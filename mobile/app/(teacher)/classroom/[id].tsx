import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, colors, H1, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useClassroomStudents } from '../../../src/hooks/useClassrooms';
import { useClassroomGoalsForDate, useCreateGoal } from '../../../src/hooks/useGoals';

export default function ClassroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const { data: roster } = useClassroomStudents(id);
  const { data: goalData, isLoading: goalsLoading } = useClassroomGoalsForDate(id);
  const createGoal = useCreateGoal(profile?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null); // null = 반 전체

  const studentCount = roster?.length ?? 0;

  const handleCreateGoal = async () => {
    if (!title.trim() || !id) return;
    await createGoal.mutateAsync({
      classroomId: id,
      studentId: targetStudentId,
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setTitle('');
    setDescription('');
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.primary }}>{'‹ 뒤로'}</Text>
      </Pressable>
      <H1>반 상세</H1>
      <Muted>학생 {studentCount}명</Muted>

      <Card style={{ marginTop: 16 }}>
        <H2>오늘의 목표 추가</H2>
        <Input placeholder="목표 제목 (예: 수학 문제집 10p)" value={title} onChangeText={setTitle} />
        <Input placeholder="설명 (선택)" value={description} onChangeText={setDescription} />

        <Text style={styles.label}>대상</Text>
        <View style={styles.targetRow}>
          <Pressable
            onPress={() => setTargetStudentId(null)}
            style={[styles.targetChip, targetStudentId === null && styles.targetChipActive]}
          >
            <Text style={[styles.targetChipText, targetStudentId === null && { color: '#fff' }]}>반 전체</Text>
          </Pressable>
          {(roster ?? []).map((r) => (
            <Pressable
              key={r.student.id}
              onPress={() => setTargetStudentId(r.student.id)}
              style={[styles.targetChip, targetStudentId === r.student.id && styles.targetChipActive]}
            >
              <Text style={[styles.targetChipText, targetStudentId === r.student.id && { color: '#fff' }]}>
                {r.student.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title="오늘 목표로 등록" onPress={handleCreateGoal} loading={createGoal.isPending} />
      </Card>

      <H2 style={{ marginTop: 8 }}>오늘의 목표 현황</H2>
      <FlatList
        data={goalData?.goals ?? []}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={!goalsLoading ? <Muted>오늘 등록된 목표가 없어요.</Muted> : null}
        renderItem={({ item }) => {
          const relevantStudentIds =
            item.student_id != null ? [item.student_id] : (roster ?? []).map((r) => r.student.id);
          const doneCount = (goalData?.completions ?? []).filter(
            (c) => c.goal_id === item.id && c.status === 'DONE' && relevantStudentIds.includes(c.student_id)
          ).length;
          return (
            <Card>
              <Text style={{ fontWeight: '600', color: colors.text }}>{item.title}</Text>
              {item.description ? <Muted>{item.description}</Muted> : null}
              <Text style={{ marginTop: 6, fontSize: 12, color: colors.primary }}>
                {doneCount}/{relevantStudentIds.length}명 완료
              </Text>
            </Card>
          );
        }}
      />

      <H2 style={{ marginTop: 8 }}>학생 목록</H2>
      <FlatList
        data={roster ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: '600', color: colors.text }}>{item.student.name}</Text>
            <Muted>{item.student.email}</Muted>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  targetChipActive: { backgroundColor: colors.primary },
  targetChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
