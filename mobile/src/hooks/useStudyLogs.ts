import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

export function useAddStudyLog(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { minutes: number; subject?: string; memo?: string; classroomId?: string }) => {
      if (!studentId) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase.from('study_logs').insert({
        student_id: studentId,
        classroom_id: params.classroomId ?? null,
        subject: params.subject ?? null,
        memo: params.memo ?? null,
        minutes_studied: params.minutes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-stats'] });
    },
  });
}
