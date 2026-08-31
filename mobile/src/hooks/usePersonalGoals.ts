import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { PersonalGoal } from '../types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ---- 학생: 오늘의 내 목표 ----
export function useTodayPersonalGoals(studentId: string | undefined, date = todayStr()) {
  return useQuery({
    queryKey: ['personal-goals', studentId, date],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('student_id', studentId)
        .eq('target_date', date)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as PersonalGoal[];
    },
  });
}

// ---- 학생: 내 목표 추가 ----
export function useCreatePersonalGoal(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, targetDate }: { title: string; targetDate?: string }) => {
      if (!studentId) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase.from('personal_goals').insert({
        student_id: studentId,
        title,
        target_date: targetDate ?? todayStr(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-goals', studentId] });
    },
  });
}

// ---- 학생: 내 목표 완료 토글 ----
export function useTogglePersonalGoal(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('personal_goals')
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-goals', studentId] });
    },
  });
}

// ---- 학생: 내 목표 삭제 ----
export function useDeletePersonalGoal(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-goals', studentId] });
    },
  });
}
