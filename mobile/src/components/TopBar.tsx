import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { colors } from './ui';

const ROLE_LABEL: Record<string, string> = {
  TEACHER: '선생님',
  GUARDIAN: '보호자',
  STUDENT: '학생',
};

export function TopBar({ title }: { title: string }) {
  const { profile, roles, activeRole, setActiveRole, signOut } = useAuth();
  const router = useRouter();

  const handleSwitch = (role: string) => {
    setActiveRole(role as any);
    if (role === 'TEACHER') router.replace('/(teacher)/(tabs)/dashboard');
    if (role === 'STUDENT') router.replace('/(student)/today');
    if (role === 'GUARDIAN') router.replace('/(guardian)/home');
  };

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {profile?.name ?? ''}님 · {ROLE_LABEL[activeRole ?? '']}
        </Text>
      </View>
      <View style={styles.actions}>
        {roles.length > 1 &&
          roles
            .filter((r) => r !== activeRole)
            .map((r) => (
              <Pressable key={r} onPress={() => handleSwitch(r)} style={styles.switchBtn}>
                <Text style={styles.switchText}>{ROLE_LABEL[r]}로 전환</Text>
              </Pressable>
            ))}
        <Pressable onPress={() => signOut()} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  switchText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: { fontSize: 12, color: colors.textMuted },
});
