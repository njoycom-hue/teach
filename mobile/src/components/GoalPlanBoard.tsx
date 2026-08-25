import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useClassroomStudents } from '../hooks/useClassrooms';
import { useClassroomGoalsRange, useCreateGoal, useDeleteGoal } from '../hooks/useGoals';
import { GoalTemplateManager } from './GoalTemplateManager';
import { Button, Card, colors, H2, Input, Muted } from './ui';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromTodayStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const isToday = dateStr === todayStr();
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY[d.getDay()]})${isToday ? ' · 오늘' : ''}`;
}

const QUICK_DATES = [
  { label: '오늘', value: todayStr() },
  { label: '내일', value: daysFromTodayStr(1) },
  { label: '모레', value: daysFromTodayStr(2) },
];

// 선생님용 "목표(학습 계획) 관리" 섹션. 계획 등록 + 이번 주 전체 계획 한눈에 보기 + 반복 계획 설정을 한 곳에 모은다.
export function GoalPlanBoard({ classroomId }: { classroomId: string }) {
  const { profile } = useAuth();
  const { data: roster } = useClassroomStudents(classroomId);
  const { data: goalData, isLoading, isError, refetch } = useClassroomGoalsRange(classroomId);
  const createGoal = useCreateGoal(profile?.id);
  const deleteGoal = useDeleteGoal(classroomId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null); // null = 반 전체
  const [targetDate, setTargetDate] = useState(todayStr());
  const [customDate, setCustomDate] = useState('');

  const handleCreateGoal = async () => {
    if (!title.trim()) return;
    await createGoal.mutateAsync({
      classroomId,
      studentId: targetStudentId,
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: (customDate.trim() || targetDate) as string,
    });
    setTitle('');
    setDescription('');
  };

  const rosterIds = (roster ?? []).map((r) => r.student.id);
  const goals = goalData?.goals ?? [];
  const completions = goalData?.completions ?? [];

  const grouped = new Map<string, typeof goals>();
  for (const g of goals) {
    const list = grouped.get(g.target_date) ?? [];
    list.push(g);
    grouped.set(g.target_date, list);
  }

  return (
    <>
      <H2 style={{ marginTop: 8 }}>학습 계획 등록</H2>
      <Card>
        <Input placeholder="목표 제목 (예: 수학 문제집 10p)" value={title} onChangeText={setTitle} />
        <Input placeholder="설명 (선택)" value={description} onChangeText={setDescription} />

        <Text style={styles.label}>날짜</Text>
        <View style={styles.row}>
          {QUICK_DATES.map((d) => (
            <Pressable
              key={d.value}
              onPress={() => {
                setTargetDate(d.value);
                setCustomDate('');
              }}
              style={[styles.chip, !customDate && targetDate === d.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, !customDate && targetDate === d.value && { color: '#fff' }]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          placeholder="직접 입력 (YYYY-MM-DD, 선택)"
          value={customDate}
          onChangeText={setCustomDate}
        />

        <Text style={styles.label}>대상</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setTargetStudentId(null)}
            style={[styles.chip, targetStudentId === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, targetStudentId === null && { color: '#fff' }]}>반 전체</Text>
          </Pressable>
          {(roster ?? []).map((r) => (
            <Pressable
              key={r.student.id}
              onPress={() => setTargetStudentId(r.student.id)}
              style={[styles.chip, targetStudentId === r.student.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, targetStudentId === r.student.id && { color: '#fff' }]}>
                {r.student.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title="계획으로 등록" onPress={handleCreateGoal} loading={createGoal.isPending} />
      </Card>

      <H2 style={{ marginTop: 8 }}>이번 주 계획</H2>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {isError && <Muted>목록을 불러오지 못했어요.</Muted>}
      {!isLoading && !isError && goals.length === 0 && <Muted>등록된 계획이 없어요.</Muted>}
      {Array.from(grouped.entries()).map(([date, items]) => (
        <Card key={date}>
          <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
          {items.map((item) => {
            const relevant = item.student_id != null ? [item.student_id] : rosterIds;
            const done = completions.filter(
              (c) => c.goal_id === item.id && c.status === 'DONE' && relevant.includes(c.student_id)
            ).length;
            return (
              <View key={item.id} style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{item.title}</Text>
                  {item.description ? <Muted>{item.description}</Muted> : null}
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
                    {done}/{relevant.length}명 완료
                  </Text>
                </View>
                <Pressable
                  onPress={() => deleteGoal.mutate(item.id)}
                  hitSlop={8}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>삭제</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>
      ))}

      <GoalTemplateManager classroomId={classroomId} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  dateLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
