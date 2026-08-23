import { Stack } from 'expo-router';
import React from 'react';

export default function GuardianLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[classroomId]/[studentId]" />
    </Stack>
  );
}
