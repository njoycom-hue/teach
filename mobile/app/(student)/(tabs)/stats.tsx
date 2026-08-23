import React from 'react';
import { Switch, Text, View } from 'react-native';

import { TopBar } from '../../../src/components/TopBar';
import { Card, colors, H2, Muted, Screen } from '../../../src/components/ui';
import { WeeklyBarChart } from '../../../src/components/WeeklyBarChart';
import { useAuth } from '../../../src/hooks/useAuth';
import { useReminder } from '../../../src/hooks/useReminder';
import { useWeeklyStats } from '../../../src/hooks/useStats';

export default function StudentStats() {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useWeeklyStats(profile?.id);
  const reminder = useReminder();

  return (
    <Screen>
      <TopBar title="나의 통계" />

      <Card>
        <H2>이번 주 요약</H2>
        {isLoading || !stats ? (
          <Muted>불러오는 중...</Muted>
        ) : (
          <>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              목표 달성률{' '}
              <Text style={{ fontWeight: '700', color: colors.primary }}>
                {Math.round(stats.completionRate * 100)}%
              </Text>
              {'  ·  '}연속 <Text style={{ fontWeight: '700' }}>{stats.currentStreak}일</Text>
              {'  ·  '}총 {stats.totalMinutes}분
            </Text>
            <WeeklyBarChart days={stats.days} />
          </>
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <H2>매일 목표 알림</H2>
            <Muted>
              매일 오후 {reminder.hour}시에 오늘의 목표를 확인하라는 알림을 보내드려요.
            </Muted>
          </View>
          <Switch value={reminder.enabled} onValueChange={reminder.toggle} disabled={reminder.loading} />
        </View>
        {reminder.error && <Text style={{ color: 'red', marginTop: 8 }}>{reminder.error}</Text>}
      </Card>
    </Screen>
  );
}
