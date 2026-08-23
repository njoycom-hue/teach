import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useClassroomStudents } from '../hooks/useClassrooms';
import { useClassroomGoalsForDate } from '../hooks/useGoals';
import type { Classroom } from '../types/database';
import { Card, colors, H2, Muted } from './ui';

// 선생님 대시보드의 반 카드. 상세 화면에 들어가지 않아도
// 오늘의 목표(계획) 진행률을 바로 볼 수 있게 배지를 함께 보여준다.
export function ClassroomListItem({ classroom }: { classroom: Classroom }) {
  const router = useRouter();
  const { data: roster } = useClassroomStudents(classroom.id);
  const { data: goalData, isLoading } = useClassroomGoalsForDate(classroom.id);

  const goals = goalData?.goals ?? [];
  const completions = goalData?.completions ?? [];
  const rosterIds = (roster ?? []).map((r) => r.student.id);

  let expected = 0;
  let done = 0;
  for (const goal of goals) {
    const relevant = goal.student_id != null ? [goal.student_id] : rosterIds;
    expected += relevant.length;
    done += completions.filter(
      (c) => c.goal_id === goal.id && c.status === 'DONE' && relevant.includes(c.student_id)
    ).length;
  }

  const hasPlan = goals.length > 0;
  const rate = expected > 0 ? Math.round((done / expected) * 100) : 0;

  return (
    <Pressable onPress={() => router.push(`/(teacher)/classroom/${classroom.id}`)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <H2>{classroom.name}</H2>
            <Muted>{classroom.subject ?? '과목 미설정'}</Muted>
            <Text style={{ marginTop: 8, fontSize: 12, color: colors.primary }}>
              초대코드: {classroom.invite_code}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {!isLoading && hasPlan && (
              <>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary }}>{rate}%</Text>
                <Muted>
                  오늘 {done}/{expected}
                </Muted>
              </>
            )}
            {!isLoading && !hasPlan && <Muted>오늘 계획 없음</Muted>}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
