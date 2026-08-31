-- 학생이 스스로 정하는 "내 목표" — 선생님이 배정하는 goals와는 완전히 별개의,
-- 학생 본인만 보고 관리하는 자기주도 목표. 자기목표 설정/달성 경험이 앱의 핵심이 되도록 한다.

create table if not exists public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  target_date date not null default current_date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_personal_goals_student_date on public.personal_goals(student_id, target_date);

alter table public.personal_goals enable row level security;

create policy "personal_goals_own" on public.personal_goals
for all using (student_id = auth.uid())
with check (student_id = auth.uid());
