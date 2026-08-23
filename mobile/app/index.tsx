import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/components/ui';

export default function Index() {
  const { session, loading, roles, activeRole } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (activeRole === 'TEACHER') return <Redirect href="/(teacher)/(tabs)/dashboard" />;
  if (activeRole === 'STUDENT') return <Redirect href="/(student)/(tabs)/today" />;
  if (activeRole === 'GUARDIAN') return <Redirect href="/(guardian)/(tabs)/home" />;

  if (roles.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ textAlign: 'center', color: colors.text }}>
          계정에 연결된 역할이 없습니다. 관리자 또는 선생님에게 문의해주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
