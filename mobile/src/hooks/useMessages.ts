import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import type { Message } from '../types/database';

function threadKey(classroomId: string, studentId: string) {
  return ['messages', classroomId, studentId];
}

// ---- 스레드의 메시지 목록 + 실시간 구독 ----
export function useThreadMessages(classroomId: string | undefined, studentId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: classroomId && studentId ? threadKey(classroomId, studentId) : ['messages', 'disabled'],
    enabled: !!classroomId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    if (!classroomId || !studentId) return;

    const channel = supabase
      .channel(`messages:${classroomId}:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          if (incoming.classroom_id !== classroomId) return;
          queryClient.setQueryData<Message[]>(threadKey(classroomId, studentId), (prev) =>
            prev && prev.some((m) => m.id === incoming.id) ? prev : [...(prev ?? []), incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, studentId, queryClient]);

  return query;
}

// ---- 메시지 전송 ----
export function useSendMessage(classroomId: string | undefined, studentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ senderId, body }: { senderId: string; body: string }) => {
      if (!classroomId || !studentId) throw new Error('대화 상대 정보가 없습니다.');
      const { data, error } = await supabase
        .from('messages')
        .insert({ classroom_id: classroomId, student_id: studentId, sender_id: senderId, body })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (message) => {
      if (!classroomId || !studentId) return;
      queryClient.setQueryData<Message[]>(threadKey(classroomId, studentId), (prev) =>
        prev && prev.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message]
      );
    },
  });
}
