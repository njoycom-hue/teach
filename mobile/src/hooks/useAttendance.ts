import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Attendance, AttendanceStatus } from '../types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ---- 선생님: 특정 반, 특정 날짜의 출석 현황 ----
export function useClassroomAttendance(classroomId: string | undefined, date = todayStr()) {
  return useQuery({
    queryKey: ['attendance', classroomId, date],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('session_date', date);
      if (error) throw error;
      return data as Attendance[];
    },
  });
}

// ---- 선생님: 출석 체크(생성/수정) ----
export function useMarkAttendance(classroomId: string | undefined, date = todayStr()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: AttendanceStatus }) => {
      if (!classroomId) throw new Error('반 정보가 없습니다.');
      const { error } = await supabase.from('attendance').upsert(
        {
          classroom_id: classroomId,
          student_id: studentId,
          session_date: date,
          status,
        },
        { onConflict: 'classroom_id,student_id,session_date' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', classroomId, date] });
    },
  });
}

// ---- 학생/보호자: 특정 학생의 출석 이력 (최근 순) ----
export function useStudentAttendanceHistory(studentId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['attendance-history', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, classroom:classrooms(name)')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as (Attendance & { classroom: { name: string } | null })[];
    },
  });
}
