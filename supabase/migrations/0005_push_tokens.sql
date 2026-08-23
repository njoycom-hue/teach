-- 푸시 알림용 Expo Push Token 저장
-- 목표 리마인더는 클라이언트 로컬 알림으로 처리하고,
-- 보호자 리포트처럼 서버에서 보내야 하는 알림은 이 테이블 + Edge Function으로 처리한다.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens_own" on public.push_tokens
for all using (user_id = auth.uid())
with check (user_id = auth.uid());
