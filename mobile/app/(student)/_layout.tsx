import { Tabs } from 'expo-router';
import React from 'react';

import { colors } from '../../src/components/ui';

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="today" options={{ title: '오늘의 목표' }} />
      <Tabs.Screen name="stats" options={{ title: '나의 통계' }} />
    </Tabs>
  );
}
