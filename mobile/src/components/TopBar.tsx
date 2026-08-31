import { Ionicons } from '@expo/vector-icons';
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
    if (role === 'STUDENT') router.replace('/(student)/(tabs)/today');
    if (role === 'GUARDIAN') router.replace('/(guardian)/(tabs)/home');
  };

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleName}>{profile?.name ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABEL[activeRole ?? '']}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        {roles.length > 1 &&
          roles
            .filter((r) => r !== activeRole)
            .map((r) => (
              <Pressable key={r} onPress={() => handleSwitch(r)} style={styles.switchBtn}>
                <Text style={styles.switchText}>{ROLE_LABEL[r]}로</Text>
              </Pressable>
            ))}
        <Pressable onPress={() => signOut()} style={styles.logoutBtn} hitSlop={8}>
          <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
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
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  subtitleName: { fontSize: 13, color: colors.textMuted },
  roleBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
  },
  switchText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  logoutBtn: {
    padding: 6,
  },
});
