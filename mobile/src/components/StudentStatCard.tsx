import React from 'react';
import { Text } from 'react-native';

import { useWeeklyStats } from '../hooks/useStats';
import { Card, colors, H2, Muted } from './ui';
import { WeeklyBarChart } from './WeeklyBarChart';

export function StudentStatCard({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { data: stats, isLoading } = useWeeklyStats(studentId);

  return (
    <Card>
      <H2>{studentName}</H2>
      {isLoading || !stats ? (
        <Muted>불러오는 중...</Muted>
      ) : (
        <>
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            이번 주 목표 달성률{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>
              {Math.round(stats.completionRate * 100)}%
            </Text>
            {'  ·  '}연속 {stats.currentStreak}일{'  ·  '}총 {stats.totalMinutes}분
          </Text>
          <WeeklyBarChart days={stats.days} />
        </>
      )}
    </Card>
  );
}
