import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';

import { Button, H1, Input, Muted, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      setErrorMsg(e.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen style={{ justifyContent: 'center' }}>
        <H1>과외학생 관리</H1>
        <Muted>선생님 · 보호자 · 학생 모두 이 앱 하나로 관리하세요.</Muted>

        <Input
          placeholder="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ marginTop: 24 }}
        />
        <Input placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />

        {errorMsg && <Text style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</Text>}

        <Button title="로그인" onPress={handleSubmit} loading={loading} />

        <Link href="/(auth)/signup" style={{ marginTop: 16, textAlign: 'center', color: '#3D5AFE' }}>
          아직 계정이 없으신가요? 회원가입
        </Link>
      </Screen>
    </KeyboardAvoidingView>
  );
}
