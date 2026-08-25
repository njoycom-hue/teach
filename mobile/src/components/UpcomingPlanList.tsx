import React from 'react';
import { Text, View } from 'react-native';

import { useUpcomingGoals } from '../hooks/useGoals';
import type { Goal } from '../types/database';
import { Card, colors, H2, Muted } from './ui';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY[d.getDay()]})`;
}

// 학생: 오늘 이후 예정된 계획을 미리 보여준다 (완료 체크는 "오늘" 화면에서만 가능).
export function UpcomingPlanList({ studentId, classroomIds }: { studentId: string | undefined; classroomIds: string[] }) {
  const { data: goals, isLoading } = useUpcomingGoals(studentId, classroomIds);

  if (!isLoading && (goals ?? []).length === 0) return null;

  const grouped = new Map<string, Goal[]>();
  for (const g of goals ?? []) {
    const list = grouped.get(g.target_date) ?? [];
    list.push(g);
    grouped.set(g.target_date, list);
  }

  return (
    <>
      <H2 style={{ marginTop: 8 }}>다가오는 계획</H2>
      <Card>
        {isLoading && <Muted>불러오는 중...</Muted>}
        {Array.from(grouped.entries()).map(([date, items]) => (
          <View key={date} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 }}>
              {formatDateLabel(date)}
            </Text>
            {items.map((g) => (
              <Text key={g.id} style={{ color: colors.text, marginBottom: 2 }}>
                • {g.title}
              </Text>
            ))}
          </View>
        ))}
      </Card>
    </>
  );
}
