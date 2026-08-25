import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Goal, GoalCompletion, GoalType } from '../types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromTodayStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- 학생: 오늘의 목표 (반 공통 목표 + 개인 목표) ----
export function useTodayGoals(studentId: string | undefined, classroomIds: string[], date = todayStr()) {
  return useQuery({
    queryKey: ['today-goals', studentId, classroomIds, date],
    enabled: !!studentId && classroomIds.length > 0,
    queryFn: async () => {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .in('classroom_id', classroomIds)
        .eq('target_date', date)
        .or(`student_id.eq.${studentId},student_id.is.null`);
      if (error) throw error;

      const goalIds = (goals as Goal[]).map((g) => g.id);
      if (goalIds.length === 0) return [] as (Goal & { completion: GoalCompletion | null })[];

      const { data: completions, error: compError } = await supabase
        .from('goal_completions')
        .select('*')
        .eq('student_id', studentId)
        .in('goal_id', goalIds);
      if (compError) throw compError;

      const byGoalId = new Map((completions as GoalCompletion[]).map((c) => [c.goal_id, c]));
      return (goals as Goal[]).map((g) => ({ ...g, completion: byGoalId.get(g.id) ?? null }));
    },
  });
}

// ---- 학생: 목표 완료 체크 ----
export function useCompleteGoal(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      status,
      durationMinutes,
      proofUrl,
    }: {
      goalId: string;
      status: 'DONE' | 'SKIPPED';
      durationMinutes?: number;
      proofUrl?: string | null;
    }) => {
      if (!studentId) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase
        .from('goal_completions')
        .upsert(
          {
            goal_id: goalId,
            student_id: studentId,
            status,
            completed_at: status === 'DONE' ? new Date().toISOString() : null,
            duration_minutes: durationMinutes ?? null,
            proof_url: proofUrl ?? null,
          },
          { onConflict: 'goal_id,student_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as GoalCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-goals'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-stats'] });
    },
  });
}

// ---- 선생님: 목표 생성 ----
export function useCreateGoal(teacherId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      classroomId: string;
      studentId?: string | null;
      title: string;
      description?: string;
      targetDate?: string;
      goalType?: GoalType;
    }) => {
      if (!teacherId) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase
        .from('goals')
        .insert({
          classroom_id: params.classroomId,
          student_id: params.studentId ?? null,
          title: params.title,
          description: params.description ?? null,
          target_date: params.targetDate ?? todayStr(),
          goal_type: params.goalType ?? 'DAILY',
          created_by: teacherId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classroom-goals', variables.classroomId] });
    },
  });
}

// ---- 선생님: 목표 삭제 (실수로 등록한 목표 정리용) ----
export function useDeleteGoal(classroomId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-goals', classroomId] });
      queryClient.invalidateQueries({ queryKey: ['classroom-goals-range', classroomId] });
    },
  });
}

// ---- 학생: 오늘 이후 며칠간의 예정된 계획 (완료 체크는 오늘 화면에서만 가능, 여기는 미리보기) ----
export function useUpcomingGoals(
  studentId: string | undefined,
  classroomIds: string[],
  daysAhead = 6
) {
  const from = daysFromTodayStr(1);
  const to = daysFromTodayStr(daysAhead);
  return useQuery({
    queryKey: ['upcoming-goals', studentId, classroomIds, from, to],
    enabled: !!studentId && classroomIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .in('classroom_id', classroomIds)
        .gte('target_date', from)
        .lte('target_date', to)
        .or(`student_id.eq.${studentId},student_id.is.null`)
        .order('target_date', { ascending: true });
      if (error) throw error;
      return data as Goal[];
    },
  });
}

// ---- 선생님: 반의 특정 기간(기본 오늘~+6일) 목표 + 완료 현황 ----
export function useClassroomGoalsRange(
  classroomId: string | undefined,
  fromDate = todayStr(),
  toDate = daysFromTodayStr(6)
) {
  return useQuery({
    queryKey: ['classroom-goals-range', classroomId, fromDate, toDate],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('classroom_id', classroomId)
        .gte('target_date', fromDate)
        .lte('target_date', toDate)
        .order('target_date', { ascending: true });
      if (error) throw error;

      const goalIds = (goals as Goal[]).map((g) => g.id);
      if (goalIds.length === 0) return { goals: [] as Goal[], completions: [] as GoalCompletion[] };

      const { data: completions, error: compError } = await supabase
        .from('goal_completions')
        .select('*')
        .in('goal_id', goalIds);
      if (compError) throw compError;

      return { goals: goals as Goal[], completions: completions as GoalCompletion[] };
    },
  });
}

// ---- 선생님: 반 전체의 특정 날짜 목표 + 학생별 진행 현황 ----
export function useClassroomGoalsForDate(classroomId: string | undefined, date = todayStr()) {
  return useQuery({
    queryKey: ['classroom-goals', classroomId, date],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('target_date', date)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const goalIds = (goals as Goal[]).map((g) => g.id);
      if (goalIds.length === 0) return { goals: [] as Goal[], completions: [] as GoalCompletion[] };

      const { data: completions, error: compError } = await supabase
        .from('goal_completions')
        .select('*')
        .in('goal_id', goalIds);
      if (compError) throw compError;

      return { goals: goals as Goal[], completions: completions as GoalCompletion[] };
    },
  });
}
