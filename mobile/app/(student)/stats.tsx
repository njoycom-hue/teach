import React from 'react';
import { Text } from 'react-native';

import { TopBar } from '../../src/components/TopBar';
import { Card, colors, H2, Muted, Screen } from '../../src/components/ui';
import { WeeklyBarChart } from '../../src/components/WeeklyBarChart';
import { useAuth } from '../../src/hooks/useAuth';
import { useWeeklyStats } from '../../src/hooks/useStats';

export default function StudentStats() {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useWeeklyStats(profile?.id);

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
    </Screen>
  );
}
