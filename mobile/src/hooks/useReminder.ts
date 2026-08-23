import { useCallback, useEffect, useState } from 'react';

import { cancelDailyReminder, getDailyReminderScheduled, scheduleDailyReminder } from '../lib/notifications';

const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

export function useReminder() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDailyReminderScheduled()
      .then(setEnabled)
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async (next: boolean) => {
    setError(null);
    try {
      if (next) {
        await scheduleDailyReminder(DEFAULT_HOUR, DEFAULT_MINUTE);
      } else {
        await cancelDailyReminder();
      }
      setEnabled(next);
    } catch (e: any) {
      setError(e.message ?? '알림 설정에 실패했습니다.');
    }
  }, []);

  return { enabled, loading, error, toggle, hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
}
