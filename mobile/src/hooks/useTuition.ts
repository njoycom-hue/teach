import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { TuitionPayment } from '../types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ---- 선생님: 반의 수업료 내역 (학생 정보 포함) ----
export function useClassroomTuition(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['tuition', 'classroom', classroomId],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tuition_payments')
        .select('*, student:users!tuition_payments_student_id_fkey(name)')
        .eq('classroom_id', classroomId)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as unknown as (TuitionPayment & { student: { name: string } | null })[];
    },
  });
}

// ---- 선생님: 수업료 항목 등록 ----
export function useCreateTuitionPayment(teacherId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { classroomId: string; studentId: string; amount: number; dueDate: string; memo?: string }) => {
      if (!teacherId) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase.from('tuition_payments').insert({
        classroom_id: params.classroomId,
        student_id: params.studentId,
        amount: params.amount,
        due_date: params.dueDate,
        memo: params.memo ?? null,
        created_by: teacherId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tuition', 'classroom', variables.classroomId] });
    },
  });
}

// ---- 선생님: 완납 처리 / 취소 ----
export function useSetTuitionPaid(classroomId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase
        .from('tuition_payments')
        .update({ paid_date: paid ? todayStr() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuition', 'classroom', classroomId] });
    },
  });
}

// ---- 학생/보호자: 본인(자녀) 수업료 내역 ----
export function useStudentTuition(studentId: string | undefined) {
  return useQuery({
    queryKey: ['tuition', 'student', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tuition_payments')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as TuitionPayment[];
    },
  });
}
