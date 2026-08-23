-- 수업료 관리

create table if not exists public.tuition_payments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  amount numeric not null,
  due_date date not null,
  paid_date date,
  memo text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_tuition_payments_student on public.tuition_payments(student_id, due_date);
create index if not exists idx_tuition_payments_classroom on public.tuition_payments(classroom_id, due_date);

alter table public.tuition_payments enable row level security;

create policy "tuition_payments_teacher_all" on public.tuition_payments
for all using (public.is_teacher_of_classroom(classroom_id))
with check (public.is_teacher_of_classroom(classroom_id));

create policy "tuition_payments_select_self_or_guardian" on public.tuition_payments
for select using (
  student_id = auth.uid()
  or public.is_guardian_of(student_id)
);
