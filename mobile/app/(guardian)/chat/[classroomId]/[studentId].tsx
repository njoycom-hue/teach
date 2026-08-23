import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { ChatThread } from '../../../../src/components/ChatThread';
import { colors, Screen } from '../../../../src/components/ui';

export default function GuardianChatScreen() {
  const { classroomId, studentId } = useLocalSearchParams<{ classroomId: string; studentId: string }>();
  const router = useRouter();

  return (
    <Screen style={{ padding: 0 }}>
      <Pressable onPress={() => router.back()} style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.primary }}>{'‹ 뒤로'}</Text>
      </Pressable>
      {classroomId && studentId && <ChatThread classroomId={classroomId} studentId={studentId} />}
    </Screen>
  );
}
