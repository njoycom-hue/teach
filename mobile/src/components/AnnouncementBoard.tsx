import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useClassroomAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements';
import { Button, Card, colors, H2, Input, Muted } from './ui';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 선생님용 공지사항(알림장) 작성 + 목록. 반 전체 학생/보호자에게 노출된다.
export function AnnouncementBoard({ classroomId }: { classroomId: string }) {
  const { profile } = useAuth();
  const { data: announcements, isLoading } = useClassroomAnnouncements(classroomId);
  const createAnnouncement = useCreateAnnouncement(profile?.id);
  const deleteAnnouncement = useDeleteAnnouncement(classroomId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handlePost = async () => {
    if (!title.trim()) return;
    await createAnnouncement.mutateAsync({ classroomId, title: title.trim(), body: body.trim() || undefined });
    setTitle('');
    setBody('');
  };

  return (
    <>
      <H2 style={{ marginTop: 8 }}>공지사항 작성</H2>
      <Card>
        <Muted>학생과 보호자 모두에게 보여요.</Muted>
        <Input placeholder="제목 (예: 이번 주 휴강 안내)" value={title} onChangeText={setTitle} />
        <Input placeholder="내용 (선택)" value={body} onChangeText={setBody} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Button title="공지 올리기" onPress={handlePost} loading={createAnnouncement.isPending} />
      </Card>

      <H2 style={{ marginTop: 8 }}>공지 목록</H2>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {!isLoading && (announcements ?? []).length === 0 && <Muted>등록된 공지가 없어요.</Muted>}
      {(announcements ?? []).map((a) => (
        <Card key={a.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{a.title}</Text>
              {a.body ? <Muted style={{ marginTop: 4 }}>{a.body}</Muted> : null}
              <Muted style={{ marginTop: 6, fontSize: 11 }}>{formatDate(a.created_at)}</Muted>
            </View>
            <Pressable
              onPress={() => deleteAnnouncement.mutate(a.id)}
              hitSlop={8}
              style={{ padding: 6, borderRadius: 8, backgroundColor: colors.dangerSoft }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        </Card>
      ))}
    </>
  );
}
