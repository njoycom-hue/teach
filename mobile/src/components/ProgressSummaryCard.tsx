import React from 'react';
import { Text, View } from 'react-native';

import { useWeeklyStats } from '../hooks/useStats';
import { Card, colors, H2, Muted } from './ui';
import { WeeklyBarChart } from './WeeklyBarChart';

// 학생 홈 화면 최상단에 "이번 주 진척 상황"을 바로 보여주는 요약 카드.
// 통계 탭까지 안 들어가도 계획 대비 진행 정도를 한눈에 확인할 수 있게 한다.
export function ProgressSummaryCard({ studentId }: { studentId: string | undefined }) {
  const { data: stats, isLoading } = useWeeklyStats(studentId);

  return (
    <Card>
      <H2>이번 주 진행 상황</H2>
      {isLoading || !stats ? (
        <Muted>불러오는 중...</Muted>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 4 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
                {Math.round(stats.completionRate * 100)}%
              </Text>
              <Muted>목표 달성률</Muted>
            </View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                {stats.currentStreak}일
              </Text>
              <Muted>연속 달성</Muted>
            </View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                {stats.totalMinutes}분
              </Text>
              <Muted>총 학습시간</Muted>
            </View>
          </View>
          <WeeklyBarChart days={stats.days} />
        </>
      )}
    </Card>
  );
}
