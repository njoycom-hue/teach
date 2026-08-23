-- Row Level Security 정책
-- DESIGN.md 5절 권한 표를 그대로 구현한다.

-- =========================================================
-- 헬퍼 함수 (security definer로 RLS 재귀 회피)
-- =========================================================
create or replace function public.has_role(p_user_id uuid, p_role public.app_role)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = p_role
  );
$$;

create or replace function public.is_teacher_of_classroom(p_classroom_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.classrooms
    where id = p_classroom_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_student_in_classroom(p_classroom_id uuid, p_student_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.classroom_students
    where classroom_id = p_classroom_id and student_id = p_student_id
  );
$$;

create or replace function public.is_guardian_of(p_student_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.guardian_student_links
    where guardian_id = auth.uid() and student_id = p_student_id
  );
$$;

create or replace function public.is_teacher_of_student(p_student_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.student_id = p_student_id and c.teacher_id = auth.uid()
  );
$$;

-- =========================================================
-- RLS 활성화
-- =========================================================
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.guardian_student_links enable row level security;
alter table public.goals enable row level security;
alter table public.goal_completions enable row level security;
alter table public.study_logs enable row level security;
alter table public.attendance enable row level security;
alter table public.exam_records enable row level security;
alter table public.notifications enable row level security;

-- =========================================================
-- users / user_roles: 본인, 그리고 관계가 있는 상대방(선생님<->학생<->보호자)만 조회 가능
-- =========================================================
create policy "users_select_self_or_related" on public.users
for select using (
  id = auth.uid()
  or public.is_teacher_of_student(id)
  or public.is_guardian_of(id)
  or exists (
    select 1 from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where c.teacher_id = id and cs.student_id = auth.uid()
  )
  or exists (
    select 1 from public.guardian_student_links gl
    where gl.student_id = id and gl.guardian_id = auth.uid()
  )
);

create policy "users_update_self" on public.users
for update using (id = auth.uid());

create policy "users_insert_self" on public.users
for insert with check (id = auth.uid());

create policy "user_roles_select_self" on public.user_roles
for select using (user_id = auth.uid());

create policy "user_roles_insert_self" on public.user_roles
for insert with check (user_id = auth.uid());

-- =========================================================
-- classrooms: 선생님(소유자) 전체 권한, 소속 학생/보호자는 읽기만
-- =========================================================
create policy "classrooms_all_own" on public.classrooms
for all using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "classrooms_select_member" on public.classrooms
for select using (
  public.is_student_in_classroom(id, auth.uid())
  or exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = id and public.is_guardian_of(cs.student_id)
  )
);

-- =========================================================
-- classroom_students
-- =========================================================
create policy "classroom_students_teacher_all" on public.classroom_students
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "classroom_students_select_self" on public.classroom_students
for select using (
  student_id = auth.uid()
  or public.is_guardian_of(student_id)
);

-- =========================================================
-- guardian_student_links: 보호자 본인 링크 관리, 학생/선생님은 조회만
-- =========================================================
create policy "guardian_links_guardian_all" on public.guardian_student_links
for all using (guardian_id = auth.uid())
with check (guardian_id = auth.uid());

create policy "guardian_links_select_student_or_teacher" on public.guardian_student_links
for select using (
  student_id = auth.uid()
  or public.is_teacher_of_student(student_id)
);

-- =========================================================
-- goals: 선생님 CRUD(자기 반), 학생/보호자는 자신(또는 자녀) 관련 목표만 조회
-- =========================================================
create policy "goals_teacher_all" on public.goals
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "goals_select_student" on public.goals
for select using (
  student_id = auth.uid()
  or (student_id is null and public.is_student_in_classroom(classroom_id, auth.uid()))
  or (student_id is not null and public.is_guardian_of(student_id))
);

-- =========================================================
-- goal_completions: 학생은 본인 것만 갱신(체크), 선생님은 자기 학생 것 갱신(피드백), 보호자는 읽기전용
-- =========================================================
create policy "goal_completions_student_own" on public.goal_completions
for all using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "goal_completions_teacher_manage" on public.goal_completions
for all using (public.is_teacher_of_student(student_id))
with check (public.is_teacher_of_student(student_id));

create policy "goal_completions_guardian_select" on public.goal_completions
for select using (public.is_guardian_of(student_id));

-- =========================================================
-- study_logs: 학생 본인 작성/조회, 선생님/보호자는 조회만
-- =========================================================
create policy "study_logs_student_all" on public.study_logs
for all using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "study_logs_teacher_select" on public.study_logs
for select using (public.is_teacher_of_student(student_id));

create policy "study_logs_guardian_select" on public.study_logs
for select using (public.is_guardian_of(student_id));

-- =========================================================
-- attendance: 선생님만 작성, 학생/보호자는 조회만
-- =========================================================
create policy "attendance_teacher_all" on public.attendance
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "attendance_select_student" on public.attendance
for select using (
  student_id = auth.uid()
  or public.is_guardian_of(student_id)
);

-- =========================================================
-- exam_records: 선생님만 작성, 학생/보호자는 조회만
-- =========================================================
create policy "exam_records_teacher_all" on public.exam_records
for all using (public.is_teacher_of_student(student_id))
with check (public.is_teacher_of_student(student_id));

create policy "exam_records_select_self" on public.exam_records
for select using (
  student_id = auth.uid()
  or public.is_guardian_of(student_id)
);

-- =========================================================
-- notifications: 본인 것만
-- =========================================================
create policy "notifications_own" on public.notifications
for all using (user_id = auth.uid())
with check (user_id = auth.uid());
