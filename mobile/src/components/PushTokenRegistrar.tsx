import { useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';
import { registerPushToken } from '../lib/notifications';

// 로그인된 사용자의 Expo Push Token을 서버에 등록해두는 백그라운드 컴포넌트.
// 화면에는 아무것도 렌더링하지 않는다.
export function PushTokenRegistrar() {
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      registerPushToken(profile.id);
    }
  }, [profile?.id]);

  return null;
}
