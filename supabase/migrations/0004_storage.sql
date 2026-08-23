-- 학습 인증샷 저장용 Storage 버킷 + RLS
-- 파일 경로 규칙: {student_id}/{goal_completion_id}.jpg (비공개 버킷, 서명된 URL로만 열람)

insert into storage.buckets (id, name, public)
values ('study-proofs', 'study-proofs', false)
on conflict (id) do nothing;

create policy "study_proofs_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'study-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "study_proofs_update_own"
on storage.objects for update
using (
  bucket_id = 'study-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "study_proofs_delete_own"
on storage.objects for delete
using (
  bucket_id = 'study-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "study_proofs_select_related"
on storage.objects for select
using (
  bucket_id = 'study-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_teacher_of_student(((storage.foldername(name))[1])::uuid)
    or public.is_guardian_of(((storage.foldername(name))[1])::uuid)
  )
);
