-- 요일별로 반복되는 목표 템플릿 + 자동 생성 RPC

create table if not exists public.goal_templates (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid references public.users(id) on delete cascade, -- null이면 반 전체 공통
  title text not null,
  description text,
  weekdays smallint[] not null, -- 0=일 ... 6=토 (Postgres EXTRACT(DOW)와 동일)
  active boolean not null default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_goal_templates_classroom on public.goal_templates(classroom_id);

alter table public.goal_templates enable row level security;

create policy "goal_templates_teacher_all" on public.goal_templates
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "goal_templates_select_student" on public.goal_templates
for select using (
  student_id = auth.uid()
  or (student_id is null and public.is_student_in_classroom(classroom_id, auth.uid()))
  or (student_id is not null and public.is_guardian_of(student_id))
);

-- 생성된 목표가 어떤 템플릿에서 나왔는지 추적 + 같은 날 중복 생성 방지
alter table public.goals add column if not exists template_id uuid references public.goal_templates(id) on delete set null;

create unique index if not exists goals_template_date_uidx
  on public.goals(template_id, target_date)
  where template_id is not null;

-- =========================================================
-- 특정 날짜(기본 오늘)에 대해, 활성 템플릿 중 요일이 맞는 것들로 목표를 생성한다.
-- 선생님 또는 그 반 소속 학생이 호출할 수 있다(둘 다 자기 반 데이터만 건드림).
-- 이미 생성된 목표는 건드리지 않는다(on conflict do nothing).
-- =========================================================
create or replace function public.generate_recurring_goals(p_classroom_id uuid, p_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dow smallint := extract(dow from p_date)::smallint;
begin
  if not (public.is_teacher_of_classroom(p_classroom_id) or public.is_student_in_classroom(p_classroom_id, auth.uid())) then
    raise exception '권한이 없습니다.';
  end if;

  insert into public.goals (classroom_id, student_id, title, description, target_date, goal_type, created_by, template_id)
  select
    t.classroom_id,
    t.student_id,
    t.title,
    t.description,
    p_date,
    'DAILY',
    t.created_by,
    t.id
  from public.goal_templates t
  where t.classroom_id = p_classroom_id
    and t.active
    and v_dow = any(t.weekdays)
  on conflict (template_id, target_date) where template_id is not null do nothing;
end;
$$;

grant execute on function public.generate_recurring_goals(uuid, date) to authenticated;

-- =========================================================
-- 모든 반에 대해 한 번에 생성 (인증 컨텍스트가 없는 서버 스케줄러 전용).
-- authenticated/anon에는 실행 권한을 주지 않는다 - pg_cron(슈퍼유저)에서만 호출.
-- 매일 자정에 자동 생성하고 싶다면 pg_cron 확장을 켠 뒤 아래처럼 스케줄한다:
--   select cron.schedule('generate-recurring-goals', '0 15 * * *', -- UTC 15:00 = KST 00:00
--     $$ select public.generate_recurring_goals_all() $$);
-- (앱에서는 화면 진입 시 generate_recurring_goals()를 직접 호출하므로 이 크론은 선택사항이다.)
-- =========================================================
create or replace function public.generate_recurring_goals_all(p_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dow smallint := extract(dow from p_date)::smallint;
begin
  insert into public.goals (classroom_id, student_id, title, description, target_date, goal_type, created_by, template_id)
  select
    t.classroom_id,
    t.student_id,
    t.title,
    t.description,
    p_date,
    'DAILY',
    t.created_by,
    t.id
  from public.goal_templates t
  where t.active
    and v_dow = any(t.weekdays)
  on conflict (template_id, target_date) where template_id is not null do nothing;
end;
$$;
