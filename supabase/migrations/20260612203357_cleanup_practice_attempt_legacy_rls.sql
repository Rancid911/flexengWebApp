begin;

drop policy if exists student_test_attempts_select_policy
  on public.student_test_attempts;
drop policy if exists test_attempts_select_own
  on public.student_test_attempts;
drop policy if exists student_test_attempts_insert_policy
  on public.student_test_attempts;
drop policy if exists student_test_attempts_update_policy
  on public.student_test_attempts;

drop policy if exists student_test_answers_select_policy
  on public.student_test_answers;
drop policy if exists student_test_answers_insert_policy
  on public.student_test_answers;
drop policy if exists student_test_answers_update_policy
  on public.student_test_answers;

revoke all privileges on table public.student_test_attempts from anon;
revoke all privileges on table public.student_test_answers from anon;

commit;
