import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, colors, Field, H1, Muted, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import type { AppRole } from '../../src/types/database';

const ROLE_OPTIONS: { value: AppRole; label: string; desc: string }[] = [
  { value: 'TEACHER', label: '선생님', desc: '학생을 등록하고 목표/통계를 관리해요' },
  { value: 'STUDENT', label: '학생', desc: '오늘의 목표를 확인하고 체크해요' },
  { value: 'GUARDIAN', label: '보호자', desc: '자녀의 학습 현황을 확인해요' },
];

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setErrorMsg('이름, 이메일을 입력하고 비밀번호는 6자 이상으로 설정해주세요.');
      return;
    }
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, name: name.trim(), role });
      setDone(true);
    } catch (e: any) {
      setErrorMsg(e.message ?? '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <H1>가입 완료</H1>
        <Muted>이메일 인증이 필요할 수 있어요. 인증 후 로그인해주세요.</Muted>
        <Button title="로그인 화면으로" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <H1>회원가입</H1>
          <Muted>역할은 나중에 추가로 연결할 수도 있어요.</Muted>

          <Field label="이름" required placeholder="홍길동" value={name} onChangeText={setName} style={{ marginTop: 20 }} />
          <Field
            label="이메일"
            required
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="비밀번호"
            required
            placeholder="6자 이상"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.roleSectionLabel}>역할 선택 *</Text>
          {ROLE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setRole(opt.value)}
              style={[styles.roleCard, role === opt.value && styles.roleCardActive]}
            >
              <Text style={[styles.roleLabel, role === opt.value && { color: colors.primary }]}>{opt.label}</Text>
              <Text style={styles.roleDesc}>{opt.desc}</Text>
            </Pressable>
          ))}

          {errorMsg && <Text style={{ color: colors.danger, marginVertical: 10 }}>{errorMsg}</Text>}

          <Button title="가입하기" onPress={handleSubmit} loading={loading} />

          <Link href="/(auth)/login" style={{ marginTop: 16, marginBottom: 8, textAlign: 'center', color: colors.primary }}>
            이미 계정이 있으신가요? 로그인
          </Link>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  roleSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    marginBottom: 6,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  roleDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
