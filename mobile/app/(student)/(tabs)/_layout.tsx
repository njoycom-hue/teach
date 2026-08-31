import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { colors } from '../../../src/components/ui';

export default function StudentTabsLayout() {
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
        name="today"
        options={{
          title: '계획',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'today' : 'today-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '출결·성적',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '메시지',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
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
