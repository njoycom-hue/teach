-- 과외학생 관리 앱 - 초기 스키마
-- DESIGN.md 4절 참고

create extension if not exists "pgcrypto";

-- =========================================================
-- 사용자 & 역할
-- =========================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  phone text,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create type public.app_role as enum ('TEACHER', 'GUARDIAN', 'STUDENT');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- =========================================================
-- 학원/과외 그룹
-- =========================================================
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  subject text,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

create type public.classroom_student_status as enum ('ACTIVE', 'PAUSED', 'LEFT');

create table if not exists public.classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status public.classroom_student_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);

create table if not exists public.guardian_student_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  relation text,
  created_at timestamptz not null default now(),
  unique (guardian_id, student_id)
);

-- =========================================================
-- 목표 & 학습 기록
-- =========================================================
create type public.goal_type as enum ('DAILY', 'WEEKLY', 'LONG_TERM');

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid references public.users(id) on delete cascade, -- null이면 반 전체 공통 목표
  title text not null,
  description text,
  target_date date not null,
  goal_type public.goal_type not null default 'DAILY',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create type public.goal_completion_status as enum ('PENDING', 'DONE', 'SKIPPED', 'LATE');

create table if not exists public.goal_completions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status public.goal_completion_status not null default 'PENDING',
  completed_at timestamptz,
  proof_url text,
  duration_minutes int,
  teacher_feedback text,
  created_at timestamptz not null default now(),
  unique (goal_id, student_id)
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete set null,
  log_date date not null default current_date,
  subject text,
  minutes_studied int not null default 0,
  memo text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 출석
-- =========================================================
create type public.attendance_status as enum ('PRESENT', 'ABSENT', 'LATE');

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  session_date date not null,
  status public.attendance_status not null,
  note text,
  created_at timestamptz not null default now(),
  unique (classroom_id, student_id, session_date)
);

-- =========================================================
-- 시험/성적
-- =========================================================
create table if not exists public.exam_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete set null,
  exam_name text not null,
  score numeric,
  max_score numeric,
  exam_date date not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 알림
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 인덱스
-- =========================================================
create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_classrooms_teacher on public.classrooms(teacher_id);
create index if not exists idx_classroom_students_classroom on public.classroom_students(classroom_id);
create index if not exists idx_classroom_students_student on public.classroom_students(student_id);
create index if not exists idx_guardian_links_guardian on public.guardian_student_links(guardian_id);
create index if not exists idx_guardian_links_student on public.guardian_student_links(student_id);
create index if not exists idx_goals_classroom_date on public.goals(classroom_id, target_date);
create index if not exists idx_goals_student_date on public.goals(student_id, target_date);
create index if not exists idx_goal_completions_student on public.goal_completions(student_id);
create index if not exists idx_study_logs_student_date on public.study_logs(student_id, log_date);
create index if not exists idx_attendance_classroom_date on public.attendance(classroom_id, session_date);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at);
