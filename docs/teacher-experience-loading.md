# Teacher Experience Loading

## Actor model

- Teacher scope is defined only by `teacherId + accessibleStudentIds`.
- Teacher workspace writes are teacher-only and must not be inherited by `manager` or `admin` readers.
- Staff readers may open teacher workspace surfaces, but billing remains a separate privileged companion concern.

## Route ownership

- `/dashboard`
  - Critical: today agenda, follow-up attention queue
  - Secondary: student roster summary
  - Preferred path: shared weekly lesson bundle plus derived sections, not `getTeacherDashboardData()`
- `/schedule`
  - Page owner: teacher-scoped lesson list and filter catalog
  - Section owner: attendance/outcome/homework follow-up
  - Follow-up ownership: dedicated state/section path, not part of general lesson mutation form state
- `/students/[studentId]`
  - Critical: profile header, notes, lesson history
  - Secondary: homework snapshot, mistakes snapshot, staff-only billing snapshot
  - Preferred path: section assembly from narrow loaders, not `getTeacherStudentProfileData()`

## Write boundaries

- Teacher notes:
  - teacher-scoped mutation
  - server is the source of truth for teacher scope checks
- Attendance/outcome/homework follow-up:
  - lesson-scoped teacher mutation
  - completed-attendance remains the only allowed billing side-effect path

## Deferred splits

- Teacher dashboard aggregate wrapper remains compatibility-only
- Teacher student profile aggregate wrapper remains compatibility-only
- Teacher mutation integration smoke coverage can still be expanded further
