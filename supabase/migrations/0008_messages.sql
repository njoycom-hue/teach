-- 선생님 · 학생 · (승인된) 보호자가 함께 참여하는 메시지 스레드.
-- 스레드는 (classroom_id, student_id) 단위로 하나씩 존재한다.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_messages_thread on public.messages(classroom_id, student_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_thread_member" on public.messages
for select using (
  public.is_teacher_of_classroom(classroom_id)
  or (student_id = auth.uid() and public.is_student_in_classroom(classroom_id, student_id))
  or public.is_guardian_of(student_id)
);

create policy "messages_insert_thread_member" on public.messages
for insert with check (
  sender_id = auth.uid()
  and (
    public.is_teacher_of_classroom(classroom_id)
    or (student_id = auth.uid() and public.is_student_in_classroom(classroom_id, student_id))
    or public.is_guardian_of(student_id)
  )
);

-- 발신자 본인만 자신의 메시지를 읽음 처리(read_at)할 수 있는 것이 아니라,
-- 스레드 멤버 누구나 자신이 읽은 시점을 남길 수 있도록 select 조건과 동일하게 허용한다.
create policy "messages_update_read_receipt" on public.messages
for update using (
  public.is_teacher_of_classroom(classroom_id)
  or (student_id = auth.uid() and public.is_student_in_classroom(classroom_id, student_id))
  or public.is_guardian_of(student_id)
)
with check (
  public.is_teacher_of_classroom(classroom_id)
  or (student_id = auth.uid() and public.is_student_in_classroom(classroom_id, student_id))
  or public.is_guardian_of(student_id)
);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
