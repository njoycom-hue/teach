import { Tabs } from 'expo-router';
import React from 'react';

import { colors } from '../../../src/components/ui';

export default function GuardianTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="home" options={{ title: '자녀 현황' }} />
      <Tabs.Screen name="messages" options={{ title: '메시지' }} />
      <Tabs.Screen name="stats" options={{ title: '통계' }} />
    </Tabs>
  );
}
