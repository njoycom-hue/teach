import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoalTemplateManager } from '../../../src/components/GoalTemplateManager';
import { TuitionManager } from '../../../src/components/TuitionManager';
import { Button, Card, colors, H1, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useClassroomAttendance, useMarkAttendance } from '../../../src/hooks/useAttendance';
import { useClassroomStudents } from '../../../src/hooks/useClassrooms';
import { useCreateExamRecord } from '../../../src/hooks/useExamRecords';
import { useClassroomGoalsForDate, useCreateGoal } from '../../../src/hooks/useGoals';
import { useAutoGenerateRecurringGoals } from '../../../src/hooks/useGoalTemplates';
import type { AttendanceStatus } from '../../../src/types/database';

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: '출석' },
  { value: 'LATE', label: '지각' },
  { value: 'ABSENT', label: '결석' },
];

export default function ClassroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const { data: roster } = useClassroomStudents(id);
  const queryClient = useQueryClient();
  const classroomIds = id ? [id] : [];
  useAutoGenerateRecurringGoals(classroomIds, () => {
    queryClient.invalidateQueries({ queryKey: ['classroom-goals', id] });
  });
  const { data: goalData, isLoading: goalsLoading } = useClassroomGoalsForDate(id);
  const createGoal = useCreateGoal(profile?.id);

  const { data: attendanceRows } = useClassroomAttendance(id);
  const markAttendance = useMarkAttendance(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null); // null = 반 전체

  const [examStudentId, setExamStudentId] = useState<string | null>(null);
  const [examName, setExamName] = useState('');
  const [examScore, setExamScore] = useState('');
  const [examMaxScore, setExamMaxScore] = useState('');
  const createExam = useCreateExamRecord(examStudentId ?? undefined);

  const studentCount = roster?.length ?? 0;
  const today = new Date().toISOString().slice(0, 10);

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

  const handleCreateExam = async () => {
    const score = parseFloat(examScore);
    const maxScore = parseFloat(examMaxScore);
    if (!examStudentId || !examName.trim() || !id || Number.isNaN(score) || Number.isNaN(maxScore)) return;
    await createExam.mutateAsync({
      classroomId: id,
      examName: examName.trim(),
      score,
      maxScore,
      examDate: today,
    });
    setExamName('');
    setExamScore('');
    setExamMaxScore('');
  };

  const attendanceByStudent = new Map((attendanceRows ?? []).map((a) => [a.student_id, a.status]));

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.primary }}>{'‹ 뒤로'}</Text>
      </Pressable>
      <H1>반 상세</H1>
      <Muted>학생 {studentCount}명</Muted>

      <ScrollView showsVerticalScrollIndicator={false}>
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
        {goalsLoading && <Muted>불러오는 중...</Muted>}
        {!goalsLoading && (goalData?.goals ?? []).length === 0 && <Muted>오늘 등록된 목표가 없어요.</Muted>}
        {(goalData?.goals ?? []).map((item) => {
          const relevantStudentIds =
            item.student_id != null ? [item.student_id] : (roster ?? []).map((r) => r.student.id);
          const doneCount = (goalData?.completions ?? []).filter(
            (c) => c.goal_id === item.id && c.status === 'DONE' && relevantStudentIds.includes(c.student_id)
          ).length;
          return (
            <Card key={item.id}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{item.title}</Text>
              {item.description ? <Muted>{item.description}</Muted> : null}
              <Text style={{ marginTop: 6, fontSize: 12, color: colors.primary }}>
                {doneCount}/{relevantStudentIds.length}명 완료
              </Text>
            </Card>
          );
        })}

        {id && <GoalTemplateManager classroomId={id} />}

        <H2 style={{ marginTop: 8 }}>오늘 출석 체크 ({today})</H2>
        <Card>
          {(roster ?? []).length === 0 && <Muted>등록된 학생이 없어요.</Muted>}
          {(roster ?? []).map((r) => {
            const current = attendanceByStudent.get(r.student.id);
            return (
              <View key={r.id} style={styles.attendanceRow}>
                <Text style={{ color: colors.text, flex: 1 }}>{r.student.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {ATTENDANCE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => markAttendance.mutate({ studentId: r.student.id, status: opt.value })}
                      style={[styles.attendanceChip, current === opt.value && styles.targetChipActive]}
                    >
                      <Text style={[styles.targetChipText, current === opt.value && { color: '#fff' }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </Card>

        <H2 style={{ marginTop: 8 }}>시험 성적 등록</H2>
        <Card>
          <Text style={styles.label}>학생 선택</Text>
          <View style={styles.targetRow}>
            {(roster ?? []).map((r) => (
              <Pressable
                key={r.student.id}
                onPress={() => setExamStudentId(r.student.id)}
                style={[styles.targetChip, examStudentId === r.student.id && styles.targetChipActive]}
              >
                <Text style={[styles.targetChipText, examStudentId === r.student.id && { color: '#fff' }]}>
                  {r.student.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input placeholder="시험명 (예: 중간고사)" value={examName} onChangeText={setExamName} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input
              placeholder="점수"
              keyboardType="numeric"
              value={examScore}
              onChangeText={setExamScore}
              style={{ flex: 1 }}
            />
            <Input
              placeholder="만점"
              keyboardType="numeric"
              value={examMaxScore}
              onChangeText={setExamMaxScore}
              style={{ flex: 1 }}
            />
          </View>
          <Button title="등록" onPress={handleCreateExam} loading={createExam.isPending} />
        </Card>

        {id && <TuitionManager classroomId={id} />}

        <H2 style={{ marginTop: 8 }}>학생 목록</H2>
        {(roster ?? []).map((item) => (
          <Card key={item.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontWeight: '600', color: colors.text }}>{item.student.name}</Text>
                <Muted>{item.student.email}</Muted>
              </View>
              <Pressable
                onPress={() => id && router.push(`/(teacher)/chat/${id}/${item.student.id}`)}
                style={styles.messageBtn}
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>메시지</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
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
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attendanceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  messageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
});
