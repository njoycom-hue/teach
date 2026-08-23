import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import type { GoalTemplate } from '../types/database';

// ---- 선생님: 반복 목표 템플릿 목록 ----
export function useClassroomGoalTemplates(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['goal-templates', classroomId],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_templates')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GoalTemplate[];
    },
  });
}

// ---- 선생님: 반복 목표 템플릿 생성 ----
export function useCreateGoalTemplate(teacherId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      classroomId: string;
      studentId?: string | null;
      title: string;
      description?: string;
      weekdays: number[];
    }) => {
      if (!teacherId) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase.from('goal_templates').insert({
        classroom_id: params.classroomId,
        student_id: params.studentId ?? null,
        title: params.title,
        description: params.description ?? null,
        weekdays: params.weekdays,
        created_by: teacherId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal-templates', variables.classroomId] });
    },
  });
}

// ---- 선생님: 템플릿 활성/비활성 토글 ----
export function useToggleGoalTemplate(classroomId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, active }: { templateId: string; active: boolean }) => {
      const { error } = await supabase.from('goal_templates').update({ active }).eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-templates', classroomId] });
    },
  });
}

// ---- 오늘 날짜에 해당하는 반복 목표를 자동 생성 (이미 생성됐다면 아무 일도 안 함) ----
export function useGenerateRecurringGoals() {
  return useMutation({
    mutationFn: async (classroomId: string) => {
      const { error } = await supabase.rpc('generate_recurring_goals', { p_classroom_id: classroomId });
      if (error) throw error;
    },
  });
}

// 화면 진입 시 한 번, 오늘자 반복 목표를 조용히 생성해두는 훅.
// 실패해도(권한 없음 등) 화면 자체는 정상 동작해야 하므로 에러를 삼킨다.
export function useAutoGenerateRecurringGoals(classroomIds: string[], onDone?: () => void) {
  const generate = useGenerateRecurringGoals();
  const key = classroomIds.join(',');

  useEffect(() => {
    if (classroomIds.length === 0) return;
    Promise.all(classroomIds.map((id) => generate.mutateAsync(id).catch(() => {}))).then(() => onDone?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
