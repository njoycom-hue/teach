-- 공지사항(알림장) — 하이클래스/클래스업 등 학원관리 앱 벤치마크에서 확인된
-- 공통 핵심 기능인데 이 앱엔 없던 기능. 선생님이 반 전체에 공지를 올리면
-- 그 반 학생과 (승인된) 보호자가 볼 수 있다.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  teacher_id uuid not null references public.users(id),
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_classroom on public.announcements(classroom_id, created_at desc);

alter table public.announcements enable row level security;

create policy "announcements_teacher_all" on public.announcements
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "announcements_select_member" on public.announcements
for select using (
  public.is_student_in_classroom(classroom_id, auth.uid())
  or exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = announcements.classroom_id and public.is_guardian_of(cs.student_id)
  )
);
