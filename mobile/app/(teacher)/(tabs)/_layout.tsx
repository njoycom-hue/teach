import { Ionicons } from '@expo/vector-icons';
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
        tabBarStyle: { height: 62, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: '대시보드',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
