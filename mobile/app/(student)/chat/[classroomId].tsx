import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { ChatThread } from '../../../src/components/ChatThread';
import { colors, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';

export default function StudentChatScreen() {
  const { classroomId } = useLocalSearchParams<{ classroomId: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <Screen style={{ padding: 0 }}>
      <Pressable onPress={() => router.back()} style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.primary }}>{'‹ 뒤로'}</Text>
      </Pressable>
      {classroomId && profile?.id && <ChatThread classroomId={classroomId} studentId={profile.id} />}
    </Screen>
  );
}
