-- 보호자-학생 연결에 승인 절차를 추가한다.
-- 기존에는 보호자가 이메일만 입력하면 즉시 연결됐는데, 이제 학생이 승인/거절해야 한다.

create type public.guardian_link_status as enum ('PENDING', 'APPROVED', 'REJECTED');

alter table public.guardian_student_links
  add column if not exists status public.guardian_link_status not null default 'PENDING';

-- 이미 존재하는(과거 방식으로 즉시 연결된) 행은 승인된 것으로 간주해 하위호환을 유지한다.
update public.guardian_student_links set status = 'APPROVED' where status = 'PENDING';

-- =========================================================
-- is_guardian_of: 승인된 연결만 "보호자"로 인정하도록 변경
-- (goal_completions/study_logs/attendance/exam_records 열람, classrooms 멤버십 등
--  이 함수를 쓰는 모든 RLS 정책에 자동으로 반영된다)
-- =========================================================
create or replace function public.is_guardian_of(p_student_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.guardian_student_links
    where guardian_id = auth.uid()
      and student_id = p_student_id
      and status = 'APPROVED'
  );
$$;

-- =========================================================
-- 학생이 본인에게 온 연결 요청의 상태(승인/거절)를 변경할 수 있도록 허용
-- =========================================================
create policy "guardian_links_student_update_status" on public.guardian_student_links
for update using (student_id = auth.uid())
with check (student_id = auth.uid());

-- =========================================================
-- link_guardian_to_student: 즉시 연결 대신 PENDING 요청을 생성
-- 이미 REJECTED된 요청이 있으면 다시 PENDING으로, APPROVED는 그대로 둔다.
-- =========================================================
create or replace function public.link_guardian_to_student(p_student_email text, p_relation text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
begin
  select id into v_student_id from public.users where email = p_student_email;

  if v_student_id is null then
    raise exception '해당 이메일의 학생을 찾을 수 없습니다.';
  end if;

  if not exists (select 1 from public.user_roles where user_id = v_student_id and role = 'STUDENT') then
    raise exception '해당 사용자는 학생 역할이 아닙니다.';
  end if;

  insert into public.guardian_student_links (guardian_id, student_id, relation, status)
  values (auth.uid(), v_student_id, p_relation, 'PENDING')
  on conflict (guardian_id, student_id) do update
    set status = case
      when public.guardian_student_links.status = 'APPROVED' then 'APPROVED'
      else 'PENDING'
    end,
    relation = coalesce(excluded.relation, public.guardian_student_links.relation);
end;
$$;
