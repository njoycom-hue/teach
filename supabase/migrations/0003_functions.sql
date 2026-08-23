-- 회원가입 자동 프로비저닝 + 초대코드 참여용 RPC 함수

-- =========================================================
-- auth.users insert 시 public.users / user_roles 자동 생성
-- 클라이언트는 supabase.auth.signUp({ options: { data: { name, role } } }) 로 호출
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  if v_role in ('TEACHER', 'GUARDIAN', 'STUDENT') then
    insert into public.user_roles (user_id, role)
    values (new.id, v_role::public.app_role)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- 학생이 초대코드로 반(Classroom)에 참여
-- =========================================================
create or replace function public.join_classroom(p_invite_code text)
returns public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom public.classrooms;
begin
  select * into v_classroom from public.classrooms where invite_code = p_invite_code;

  if v_classroom.id is null then
    raise exception '유효하지 않은 초대코드입니다.';
  end if;

  insert into public.classroom_students (classroom_id, student_id)
  values (v_classroom.id, auth.uid())
  on conflict (classroom_id, student_id) do update set status = 'ACTIVE';

  return v_classroom;
end;
$$;

grant execute on function public.join_classroom(text) to authenticated;

-- =========================================================
-- 보호자가 학생 이메일로 연결 요청 (MVP: 즉시 연결, 승인 절차는 추후 추가)
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

  insert into public.guardian_student_links (guardian_id, student_id, relation)
  values (auth.uid(), v_student_id, p_relation)
  on conflict (guardian_id, student_id) do nothing;
end;
$$;

grant execute on function public.link_guardian_to_student(text, text) to authenticated;

-- 정책에서 쓰는 헬퍼 함수도 authenticated가 실행 가능하도록 보장
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_teacher_of_classroom(uuid) to authenticated;
grant execute on function public.is_student_in_classroom(uuid, uuid) to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
grant execute on function public.is_teacher_of_student(uuid) to authenticated;
