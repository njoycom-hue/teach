import { Stack } from 'expo-router';
import React from 'react';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="classroom/[id]" />
      <Stack.Screen name="chat/[classroomId]/[studentId]" />
    </Stack>
  );
}
