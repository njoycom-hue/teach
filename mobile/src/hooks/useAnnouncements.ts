import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Announcement } from '../types/database';

// ---- 선생님: 반 공지 목록 ----
export function useClassroomAnnouncements(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['announcements', 'classroom', classroomId],
    enabled: !!classroomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

// ---- 선생님: 공지 작성 ----
export function useCreateAnnouncement(teacherId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classroomId, title, body }: { classroomId: string; title: string; body?: string }) => {
      if (!teacherId) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase
        .from('announcements')
        .insert({ classroom_id: classroomId, teacher_id: teacherId, title, body: body ?? null });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'classroom', variables.classroomId] });
    },
  });
}

// ---- 선생님: 공지 삭제 ----
export function useDeleteAnnouncement(classroomId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'classroom', classroomId] });
    },
  });
}

// ---- 학생: 내가 속한 반들의 공지 (최근순) ----
export function useMyAnnouncements(classroomIds: string[]) {
  return useQuery({
    queryKey: ['announcements', 'my', classroomIds],
    enabled: classroomIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, classroom:classrooms(name)')
        .in('classroom_id', classroomIds)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as (Announcement & { classroom: { name: string } | null })[];
    },
  });
}

// ---- 보호자: 승인된 자녀들이 속한 반들의 공지 ----
export function useGuardianAnnouncements(guardianId: string | undefined) {
  return useQuery({
    queryKey: ['announcements', 'guardian', guardianId],
    enabled: !!guardianId,
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('guardian_student_links')
        .select('student_id')
        .eq('guardian_id', guardianId)
        .eq('status', 'APPROVED');
      if (linksError) throw linksError;

      const studentIds = (links ?? []).map((l) => l.student_id);
      if (studentIds.length === 0) return [];

      const { data: memberships, error: membershipsError } = await supabase
        .from('classroom_students')
        .select('classroom_id')
        .in('student_id', studentIds)
        .eq('status', 'ACTIVE');
      if (membershipsError) throw membershipsError;

      const classroomIds = Array.from(new Set((memberships ?? []).map((m) => m.classroom_id)));
      if (classroomIds.length === 0) return [];

      const { data, error } = await supabase
        .from('announcements')
        .select('*, classroom:classrooms(name)')
        .in('classroom_id', classroomIds)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as (Announcement & { classroom: { name: string } | null })[];
    },
  });
}
