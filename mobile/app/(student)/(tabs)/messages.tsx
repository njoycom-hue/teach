import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { TopBar } from '../../../src/components/TopBar';
import { Card, colors, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useMyClassrooms } from '../../../src/hooks/useClassrooms';

export default function StudentMessages() {
  const { profile } = useAuth();
  const { data: classrooms, isLoading } = useMyClassrooms(profile?.id);
  const router = useRouter();

  return (
    <Screen>
      <TopBar title="메시지" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoading && (classrooms ?? []).length === 0 && <Muted>참여중인 반이 없어요.</Muted>}
        {(classrooms ?? []).map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/(student)/chat/${c.id}`)}>
            <Card>
              <Text style={{ fontWeight: '600', color: colors.text }}>{c.name}</Text>
              <Muted>선생님과 대화하기</Muted>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
