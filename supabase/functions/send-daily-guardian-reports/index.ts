// Supabase Edge Function: 보호자에게 자녀의 오늘 학습 현황을 요약해 푸시 발송한다.
//
// 배포:
//   supabase functions deploy send-daily-guardian-reports
//
// 매일 저녁 실행되도록 스케줄링 (Supabase Dashboard > Edge Functions > Schedules,
// 또는 pg_cron + pg_net으로 이 함수를 HTTP 호출):
//   select cron.schedule(
//     'daily-guardian-report',
//     '0 12 * * *', -- UTC 12:00 = KST 21:00
//     $$ select net.http_post(
//          url := 'https://<project-ref>.supabase.co/functions/v1/send-daily-guardian-reports',
//          headers := jsonb_build_object('Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>')
//        ) $$
//   );
//
// 이 함수는 서비스 롤 키로 실행되어 RLS를 우회하므로, 반드시 스케줄러(Cron)나
// 신뢰된 서버에서만 호출되어야 한다. anon key로는 호출되지 않도록 유지할 것.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader.includes(serviceRoleKey)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);

  const today = new Date().toISOString().slice(0, 10);

  // 승인된 보호자-학생 연결만 대상으로 한다.
  const { data: links, error: linksError } = await supabase
    .from('guardian_student_links')
    .select('guardian_id, student_id, student:users!guardian_student_links_student_id_fkey(name)')
    .eq('status', 'APPROVED');
  if (linksError) {
    return new Response(JSON.stringify({ error: linksError.message }), { status: 500 });
  }

  const messages: { to: string; title: string; body: string }[] = [];

  for (const link of links ?? []) {
    const { data: goals } = await supabase
      .from('goals')
      .select('id, goal_completions(status, student_id)')
      .eq('target_date', today)
      .eq('goal_completions.student_id', link.student_id);

    const total = goals?.length ?? 0;
    const done = (goals ?? []).filter((g) =>
      (g.goal_completions ?? []).some((c: { status: string }) => c.status === 'DONE')
    ).length;

    if (total === 0) continue; // 오늘 등록된 목표가 없으면 리포트를 보내지 않는다.

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', link.guardian_id);

    const studentName = (link.student as unknown as { name: string } | null)?.name ?? '자녀';

    for (const t of tokens ?? []) {
      messages.push({
        to: t.expo_push_token,
        title: `${studentName}님의 오늘 학습 리포트`,
        body: `오늘 목표 ${done}/${total}개를 완료했어요.`,
      });
    }
  }

  if (messages.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
