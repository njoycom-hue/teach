import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { ExamRecord } from '../types/database';

// ---- 선생님: 시험 성적 등록 ----
export function useCreateExamRecord(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      classroomId: string;
      examName: string;
      score: number;
      maxScore: number;
      examDate: string;
    }) => {
      if (!studentId) throw new Error('학생 정보가 없습니다.');
      const { error } = await supabase.from('exam_records').insert({
        student_id: studentId,
        classroom_id: params.classroomId,
        exam_name: params.examName,
        score: params.score,
        max_score: params.maxScore,
        exam_date: params.examDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-records', studentId] });
    },
  });
}

// ---- 학생/보호자/선생님: 특정 학생의 시험 성적 이력 ----
export function useStudentExamRecords(studentId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['exam-records', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_records')
        .select('*')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ExamRecord[];
    },
  });
}
