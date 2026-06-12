begin;

create or replace function public.submit_practice_test_attempt(
  p_test_id uuid,
  p_answers jsonb,
  p_allow_partial boolean,
  p_started_at timestamptz,
  p_submitted_at timestamptz,
  p_time_spent_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_assessment_kind text;
  v_scoring_profile jsonb;
  v_passing_score integer;
  v_total_questions integer;
  v_correct_answers integer;
  v_score integer;
  v_passed boolean;
  v_attempt_id uuid;
  v_answers jsonb;
  v_review_answers jsonb;
  v_default_scoring_profile jsonb := jsonb_build_object(
    'kind', 'placement_v1',
    'bands', jsonb_build_array(
      jsonb_build_object('key', 'beginner', 'label', 'Beginner', 'minScore', 0, 'maxScore', 6),
      jsonb_build_object('key', 'elementary', 'label', 'Elementary', 'minScore', 7, 'maxScore', 20),
      jsonb_build_object('key', 'pre_intermediate', 'label', 'Pre-Intermediate', 'minScore', 21, 'maxScore', 34),
      jsonb_build_object('key', 'intermediate', 'label', 'Intermediate', 'minScore', 35, 'maxScore', 48),
      jsonb_build_object('key', 'upper_intermediate', 'label', 'Upper-Intermediate', 'minScore', 49, 'maxScore', 62),
      jsonb_build_object('key', 'advanced', 'label', 'Advanced', 'minScore', 63, 'maxScore', 70)
    )
  );
  v_effective_scoring_profile jsonb;
  v_recommended_level text;
  v_recommended_band_label text;
  v_section_scores jsonb := '[]'::jsonb;
  v_placement_summary jsonb;
  v_band jsonb;
  v_band_span integer;
  v_band_margin integer;
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN:Authenticated student required'
      using errcode = 'P0001';
  end if;

  select s.id
    into v_student_id
  from public.students s
  where s.profile_id = auth.uid()
    and not exists (
      select 1
      from public.teachers teacher
      where teacher.profile_id = auth.uid()
    )
  limit 1;

  if v_student_id is null
    or not app_private.has_permission('homework.submit', 'own') then
    raise exception 'FORBIDDEN:Real student with homework.submit:own required'
      using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'INCOMPLETE_ATTEMPT:Answers must be an array'
      using errcode = 'P0001';
  end if;

  select
    case when t.assessment_kind = 'placement' then 'placement' else 'regular' end,
    t.scoring_profile,
    t.passing_score
  into
    v_assessment_kind,
    v_scoring_profile,
    v_passing_score
  from public.tests t
  where t.id = p_test_id;

  if not found then
    raise exception 'TEST_LOAD_FAILED:Failed to load test for grading'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.test_questions q
    where q.test_id = p_test_id
      and coalesce(q.question_type, 'unknown') <> 'single_choice'
  ) then
    raise exception 'UNSUPPORTED_QUESTION_TYPE:This activity contains unsupported question types'
      using errcode = 'P0001';
  end if;

  select count(*)
    into v_total_questions
  from public.test_questions q
  where q.test_id = p_test_id;

  if v_total_questions = 0 then
    raise exception 'EMPTY_TEST:This activity does not contain any questions'
      using errcode = 'P0001';
  end if;

  begin
    with raw_answers as (
      select
        answer.ordinality,
        (answer.value ->> 'questionId')::uuid as question_id,
        (answer.value ->> 'optionId')::uuid as option_id
      from jsonb_array_elements(p_answers) with ordinality as answer(value, ordinality)
    ),
    normalized_answers as (
      select distinct on (raw.question_id)
        raw.question_id,
        raw.option_id
      from raw_answers raw
      order by raw.question_id, raw.ordinality desc
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'questionId', normalized.question_id,
          'optionId', normalized.option_id
        )
        order by normalized.question_id
      ),
      '[]'::jsonb
    )
    into v_answers
    from normalized_answers normalized;
  exception
    when invalid_text_representation or null_value_not_allowed then
      raise exception 'INVALID_OPTION:Selected option does not belong to the question'
        using errcode = 'P0001';
  end;

  if not (coalesce(p_allow_partial, false) and v_assessment_kind = 'placement') then
    if jsonb_array_length(v_answers) <> v_total_questions
      or exists (
        select 1
        from public.test_questions q
        where q.test_id = p_test_id
          and not exists (
            select 1
            from jsonb_to_recordset(v_answers)
              as answer("questionId" uuid, "optionId" uuid)
            where answer."questionId" = q.id
          )
      ) then
      raise exception 'INCOMPLETE_ATTEMPT:All questions must be answered before submission'
        using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_answers)
      as answer("questionId" uuid, "optionId" uuid)
    join public.test_questions q
      on q.id = answer."questionId"
     and q.test_id = p_test_id
    where not exists (
      select 1
      from public.test_question_options option_row
      where option_row.id = answer."optionId"
        and option_row.question_id = q.id
    )
  ) then
    raise exception 'INVALID_OPTION:Selected option does not belong to the question'
      using errcode = 'P0001';
  end if;

  with graded_answers as (
    select
      q.id as question_id,
      answer."optionId" as selected_option_id,
      coalesce(selected_option.is_correct, false) as is_correct,
      q.placement_band,
      q.sort_order
    from public.test_questions q
    left join jsonb_to_recordset(v_answers)
      as answer("questionId" uuid, "optionId" uuid)
      on answer."questionId" = q.id
    left join public.test_question_options selected_option
      on selected_option.id = answer."optionId"
     and selected_option.question_id = q.id
    where q.test_id = p_test_id
  )
  select
    count(*) filter (where graded.is_correct),
    jsonb_agg(
      jsonb_build_object(
        'questionId', graded.question_id,
        'selectedOptionId', graded.selected_option_id,
        'isCorrect', graded.is_correct,
        'placementBand', graded.placement_band
      )
      order by graded.sort_order, graded.question_id
    )
  into
    v_correct_answers,
    v_review_answers
  from graded_answers graded;

  v_score := round((v_correct_answers::numeric / v_total_questions::numeric) * 100)::integer;
  v_passed := v_score >= v_passing_score;

  if v_assessment_kind = 'placement' then
    if jsonb_typeof(v_scoring_profile) = 'object'
      and v_scoring_profile ->> 'kind' = 'placement_v1'
      and jsonb_typeof(v_scoring_profile -> 'bands') = 'array'
      and not exists (
        select 1
        from jsonb_array_elements(v_scoring_profile -> 'bands') profile_band
        where profile_band ->> 'key' not in (
          'beginner',
          'elementary',
          'pre_intermediate',
          'intermediate',
          'upper_intermediate',
          'advanced'
        )
          or jsonb_typeof(profile_band -> 'label') is distinct from 'string'
          or jsonb_typeof(profile_band -> 'minScore') is distinct from 'number'
          or jsonb_typeof(profile_band -> 'maxScore') is distinct from 'number'
      ) then
      v_effective_scoring_profile := v_scoring_profile;
    else
      v_effective_scoring_profile := v_default_scoring_profile;
    end if;

    select profile_band
      into v_band
    from jsonb_array_elements(v_effective_scoring_profile -> 'bands') profile_band
    where v_correct_answers between
      (profile_band ->> 'minScore')::integer
      and (profile_band ->> 'maxScore')::integer
    limit 1;

    if v_band is null then
      select profile_band
        into v_band
      from jsonb_array_elements(v_effective_scoring_profile -> 'bands')
        with ordinality as band(profile_band, ordinal)
      order by band.ordinal desc
      limit 1;
    end if;

    if v_band is null then
      raise exception 'TEST_LOAD_FAILED:Placement scoring profile has no bands'
        using errcode = 'P0001';
    end if;

    v_recommended_level := v_band ->> 'label';
    v_band_span :=
      (v_band ->> 'maxScore')::integer
      - (v_band ->> 'minScore')::integer
      + 1;
    v_band_margin := greatest(2, floor(v_band_span::numeric / 3)::integer);

    if v_correct_answers <= (v_band ->> 'minScore')::integer + v_band_margin - 1
      and v_correct_answers > (v_band ->> 'minScore')::integer then
      v_recommended_band_label := 'Lower part of ' || v_recommended_level;
    elsif v_correct_answers >= (v_band ->> 'maxScore')::integer - v_band_margin + 1
      and v_correct_answers < (v_band ->> 'maxScore')::integer then
      v_recommended_band_label := 'Upper part of ' || v_recommended_level;
    else
      v_recommended_band_label := v_recommended_level;
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'key', profile_band ->> 'key',
          'label', profile_band ->> 'label',
          'correctAnswers', (
            select count(*)
            from jsonb_to_recordset(v_review_answers)
              as review(
                "questionId" uuid,
                "selectedOptionId" uuid,
                "isCorrect" boolean,
                "placementBand" text
              )
            where review."placementBand" = profile_band ->> 'key'
              and review."isCorrect"
          ),
          'totalQuestions', (
            select count(*)
            from jsonb_to_recordset(v_review_answers)
              as review(
                "questionId" uuid,
                "selectedOptionId" uuid,
                "isCorrect" boolean,
                "placementBand" text
              )
            where review."placementBand" = profile_band ->> 'key'
          )
        )
        order by band.ordinal
      ),
      '[]'::jsonb
    )
    into v_section_scores
    from jsonb_array_elements(v_effective_scoring_profile -> 'bands')
      with ordinality as band(profile_band, ordinal);

    v_placement_summary := jsonb_build_object(
      'recommendedLevel', v_recommended_level,
      'recommendedBandLabel', v_recommended_band_label,
      'sectionScores', v_section_scores
    );
  end if;

  begin
    insert into public.student_test_attempts (
      student_id,
      test_id,
      score,
      correct_answers,
      total_questions,
      status,
      recommended_level,
      recommended_band_label,
      placement_summary,
      started_at,
      submitted_at,
      time_spent_seconds
    )
    values (
      v_student_id,
      p_test_id,
      v_score,
      v_correct_answers,
      v_total_questions,
      case when v_passed then 'passed' else 'failed' end,
      v_recommended_level,
      v_recommended_band_label,
      v_placement_summary,
      p_started_at,
      p_submitted_at,
      greatest(0, coalesce(p_time_spent_seconds, 0))
    )
    returning id into v_attempt_id;
  exception
    when others then
      raise exception 'ATTEMPT_CREATE_FAILED:%', sqlerrm
        using errcode = 'P0001';
  end;

  begin
    insert into public.student_test_answers (
      attempt_id,
      question_id,
      selected_option_id,
      answer_text,
      is_correct
    )
    select
      v_attempt_id,
      review."questionId",
      review."selectedOptionId",
      null,
      review."isCorrect"
    from jsonb_to_recordset(v_review_answers)
      as review(
        "questionId" uuid,
        "selectedOptionId" uuid,
        "isCorrect" boolean,
        "placementBand" text
      );
  exception
    when others then
      raise exception 'ATTEMPT_ANSWERS_SAVE_FAILED:%', sqlerrm
        using errcode = 'P0001';
  end;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'score', v_score,
    'correctAnswers', v_correct_answers,
    'totalQuestions', v_total_questions,
    'passed', v_passed,
    'assessmentKind', v_assessment_kind,
    'recommendedLevel', v_recommended_level,
    'recommendedBandLabel', v_recommended_band_label,
    'sectionScores', v_section_scores,
    'answers', (
      select jsonb_agg(
        jsonb_build_object(
          'questionId', review."questionId",
          'selectedOptionId', review."selectedOptionId",
          'isCorrect', review."isCorrect"
        )
      )
      from jsonb_to_recordset(v_review_answers)
        as review(
          "questionId" uuid,
          "selectedOptionId" uuid,
          "isCorrect" boolean,
          "placementBand" text
        )
    )
  );
end;
$$;

revoke all on function public.submit_practice_test_attempt(
  uuid,
  jsonb,
  boolean,
  timestamptz,
  timestamptz,
  integer
) from public;
revoke all on function public.submit_practice_test_attempt(
  uuid,
  jsonb,
  boolean,
  timestamptz,
  timestamptz,
  integer
) from anon;
grant execute on function public.submit_practice_test_attempt(
  uuid,
  jsonb,
  boolean,
  timestamptz,
  timestamptz,
  integer
) to authenticated;

commit;
