import { Tabs } from 'expo-router';
import React from 'react';

import { colors } from '../../../src/components/ui';

export default function TeacherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: '대시보드' }} />
      <Tabs.Screen name="stats" options={{ title: '통계' }} />
    </Tabs>
  );
}
