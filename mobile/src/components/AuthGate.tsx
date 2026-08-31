import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';

// 세션이 사라지면(로그아웃, 토큰 만료 등) 지금 어떤 화면에 있든 상관없이
// 로그인 화면으로 강제 이동시킨다. TopBar의 로그아웃 버튼은 인증 상태만 지우고
// 화면 이동은 이 컴포넌트가 전역에서 담당한다.
export function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments, router]);

  return null;
}
