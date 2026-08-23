import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export interface DayStat {
  date: string;
  goalsTotal: number;
  goalsDone: number;
  minutesStudied: number;
}

export interface WeeklyStats {
  days: DayStat[]; // 최근 7일, 과거 -> 오늘 순
  completionRate: number; // 0~1
  totalMinutes: number;
  currentStreak: number; // 목표를 하나라도 완료한 연속 일수
}

// ---- 학생 통계 (본인/선생님/보호자 공용 - RLS가 열람 권한을 제어) ----
export function useWeeklyStats(studentId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-stats', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<WeeklyStats> => {
      const since = daysAgoStr(6);

      const [{ data: goals, error: goalsError }, { data: logs, error: logsError }] = await Promise.all([
        supabase
          .from('goals')
          .select('id, target_date, goal_completions(status, student_id)')
          .gte('target_date', since)
          .eq('goal_completions.student_id', studentId),
        supabase.from('study_logs').select('log_date, minutes_studied').eq('student_id', studentId).gte('log_date', since),
      ]);
      if (goalsError) throw goalsError;
      if (logsError) throw logsError;

      const days: DayStat[] = Array.from({ length: 7 }).map((_, i) => {
        const date = daysAgoStr(6 - i);
        const goalsForDay = (goals ?? []).filter((g: any) => g.target_date === date);
        const goalsDone = goalsForDay.filter((g: any) =>
          (g.goal_completions ?? []).some((c: any) => c.status === 'DONE')
        ).length;
        const minutesStudied = (logs ?? [])
          .filter((l: any) => l.log_date === date)
          .reduce((sum: number, l: any) => sum + (l.minutes_studied ?? 0), 0);
        return { date, goalsTotal: goalsForDay.length, goalsDone, minutesStudied };
      });

      const totalGoals = days.reduce((s, d) => s + d.goalsTotal, 0);
      const totalDone = days.reduce((s, d) => s + d.goalsDone, 0);
      const totalMinutes = days.reduce((s, d) => s + d.minutesStudied, 0);

      let currentStreak = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].goalsDone > 0) currentStreak += 1;
        else break;
      }

      return {
        days,
        completionRate: totalGoals > 0 ? totalDone / totalGoals : 0,
        totalMinutes,
        currentStreak,
      };
    },
  });
}
