import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import type { Announcement } from '../types/database';
import { Card, colors, H2, Muted } from './ui';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type AnnouncementWithClassroom = Announcement & { classroom: { name: string } | null };

// 학생/보호자 공용 공지사항 읽기 전용 리스트.
export function AnnouncementList({
  announcements,
  isLoading,
}: {
  announcements: AnnouncementWithClassroom[] | undefined;
  isLoading: boolean;
}) {
  if (!isLoading && (announcements ?? []).length === 0) return null;

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 }}>
        <Ionicons name="megaphone-outline" size={16} color={colors.text} />
        <H2 style={{ marginBottom: 0 }}>공지사항</H2>
      </View>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {(announcements ?? []).map((a) => (
        <Card key={a.id}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{a.title}</Text>
          {a.body ? <Muted style={{ marginTop: 4 }}>{a.body}</Muted> : null}
          <Muted style={{ marginTop: 6, fontSize: 11 }}>
            {a.classroom?.name ? `${a.classroom.name} · ` : ''}
            {formatDate(a.created_at)}
          </Muted>
        </Card>
      ))}
    </>
  );
}
