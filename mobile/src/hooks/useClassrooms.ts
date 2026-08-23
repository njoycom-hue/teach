import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { AppUser, Classroom, GuardianLinkStatus } from '../types/database';

// ---- 선생님: 내 반 목록 ----
export function useTeacherClassrooms(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', 'teacher', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Classroom[];
    },
  });
}

export function useCreateClassroom(teacherId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, subject }: { name: string; subject?: string }) => {
      if (!teacherId) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase
        .from('classrooms')
        .insert({ teacher_id: teacherId, name, subject })
        .select()
        .single();
      if (error) throw error;
      return data as Classroom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms', 'teacher', teacherId] });
    },
  });
}

// ---- 선생님: 반 소속 학생 ----
export function useClassroomStudents(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classroom-students', classroomId],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classroom_students')
        .select('id, status, joined_at, student:users!classroom_students_student_id_fkey(*)')
        .eq('classroom_id', classroomId);
      if (error) throw error;
      return data as unknown as { id: string; status: string; joined_at: string; student: AppUser }[];
    },
  });
}

// ---- 학생: 초대코드로 반 참여 ----
export function useJoinClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc('join_classroom', { p_invite_code: inviteCode });
      if (error) throw error;
      return data as Classroom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] });
    },
  });
}

// ---- 학생 본인이 속한 반 목록 (목표 부여 대상 확인용) ----
export function useMyClassrooms(studentId: string | undefined) {
  return useQuery({
    queryKey: ['my-classrooms', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classroom_students')
        .select('classroom:classrooms(*)')
        .eq('student_id', studentId)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return (data as unknown as { classroom: Classroom }[]).map((r) => r.classroom);
    },
  });
}

// ---- 보호자: 이메일로 학생 연결 ----
export function useLinkGuardianToStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentEmail, relation }: { studentEmail: string; relation?: string }) => {
      const { error } = await supabase.rpc('link_guardian_to_student', {
        p_student_email: studentEmail,
        p_relation: relation ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-students'] });
    },
  });
}

// ---- 보호자: 연결된 자녀 목록 ----
export function useGuardianStudents(guardianId: string | undefined) {
  return useQuery({
    queryKey: ['guardian-students', guardianId],
    enabled: !!guardianId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guardian_student_links')
        .select('id, relation, status, student:users!guardian_student_links_student_id_fkey(*)')
        .eq('guardian_id', guardianId);
      if (error) throw error;
      return data as unknown as {
        id: string;
        relation: string | null;
        status: GuardianLinkStatus;
        student: AppUser;
      }[];
    },
  });
}

// ---- 학생: 나에게 온 보호자 연결 요청(대기중) ----
export function usePendingGuardianRequests(studentId: string | undefined) {
  return useQuery({
    queryKey: ['guardian-requests', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guardian_student_links')
        .select('id, relation, guardian:users!guardian_student_links_guardian_id_fkey(*)')
        .eq('student_id', studentId)
        .eq('status', 'PENDING');
      if (error) throw error;
      return data as unknown as { id: string; relation: string | null; guardian: AppUser }[];
    },
  });
}

// ---- 학생: 보호자 연결 요청 승인/거절 ----
export function useRespondGuardianRequest(studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, approve }: { linkId: string; approve: boolean }) => {
      const { error } = await supabase
        .from('guardian_student_links')
        .update({ status: approve ? 'APPROVED' : 'REJECTED' })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-requests', studentId] });
    },
  });
}
