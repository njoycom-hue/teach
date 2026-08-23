import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const DAILY_REMINDER_ID = 'daily-goal-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ---- 서버발 알림(보호자 리포트 등)을 위한 Expo Push Token 등록 ----
// Expo Go에서는 SDK 53+부터 원격 푸시가 지원되지 않는다 (개발 빌드에서만 동작).
// 실패하더라도 로컬 리마인더 기능에는 영향이 없도록 조용히 무시한다.
export async function registerPushToken(userId: string) {
  try {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token) return;

    await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_push_token: token },
      { onConflict: 'user_id,expo_push_token' }
    );
  } catch {
    // Expo Go 등 원격 푸시 미지원 환경 - 무시
  }
}

// ---- 학생: 매일 정해진 시각에 "오늘의 목표 확인" 로컬 알림 ----
export async function scheduleDailyReminder(hour: number, minute: number) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') throw new Error('알림 권한이 필요합니다.');
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: '오늘의 목표를 확인해보세요',
      body: '아직 완료하지 않은 목표가 있을 수 있어요!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}

export async function getDailyReminderScheduled() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === DAILY_REMINDER_ID);
}
