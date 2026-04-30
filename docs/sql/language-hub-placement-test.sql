-- Placement Test: Language Hub Beginner to Advanced
-- Seed script for a single canonical placement test.
-- Apply placement metadata migration before running this script.

with created_test as (
  insert into public.tests (
    module_id,
    activity_type,
    assessment_kind,
    title,
    description,
    scoring_profile,
    passing_score,
    time_limit_minutes,
    is_published,
    sort_order
  )
  select
    id,
    'test',
    'placement',
    'Placement Test: Beginner to Advanced',
    'Диагностический placement test для определения рекомендуемого уровня ученика.',
    '{
      "bands": [
        {"key":"beginner","label":"Beginner","minScore":0,"maxScore":6},
        {"key":"elementary","label":"Elementary","minScore":7,"maxScore":20},
        {"key":"pre_intermediate","label":"Pre-Intermediate","minScore":21,"maxScore":34},
        {"key":"intermediate","label":"Intermediate","minScore":35,"maxScore":48},
        {"key":"upper_intermediate","label":"Upper-Intermediate","minScore":49,"maxScore":62},
        {"key":"advanced","label":"Advanced","minScore":63,"maxScore":70}
      ]
    }'::jsonb,
    0,
    30,
    true,
    0
  from public.course_modules
  order by created_at asc nulls last, title asc
  limit 1
  returning id
)
select id from created_test;

-- Add the 70 questions with `placement_band` and their A-D options
-- using the provided Language Hub material. Keep them as `single_choice`.
