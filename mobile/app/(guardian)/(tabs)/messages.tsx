import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { TopBar } from '../../../src/components/TopBar';
import { Card, colors, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useGuardianThreads } from '../../../src/hooks/useClassrooms';

export default function GuardianMessages() {
  const { profile } = useAuth();
  const { data: threads, isLoading } = useGuardianThreads(profile?.id);
  const router = useRouter();

  return (
    <Screen>
      <TopBar title="메시지" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoading && (threads ?? []).length === 0 && <Muted>아직 대화 가능한 반이 없어요.</Muted>}
        {(threads ?? []).map((t) => (
          <Pressable
            key={`${t.classroomId}-${t.studentId}`}
            onPress={() => router.push(`/(guardian)/chat/${t.classroomId}/${t.studentId}`)}
          >
            <Card>
              <Text style={{ fontWeight: '600', color: colors.text }}>{t.classroomName}</Text>
              <Muted>{t.studentName} 학생 담당 선생님과 대화하기</Muted>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
