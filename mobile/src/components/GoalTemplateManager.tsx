import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useClassroomStudents } from '../hooks/useClassrooms';
import {
  useClassroomGoalTemplates,
  useCreateGoalTemplate,
  useToggleGoalTemplate,
} from '../hooks/useGoalTemplates';
import { Button, Card, Chip, colors, H2, Input, Muted } from './ui';

const WEEKDAYS = [
  { value: 0, label: '일' },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
];

export function GoalTemplateManager({ classroomId }: { classroomId: string }) {
  const { profile } = useAuth();
  const { data: roster } = useClassroomStudents(classroomId);
  const { data: templates, isLoading } = useClassroomGoalTemplates(classroomId);
  const createTemplate = useCreateGoalTemplate(profile?.id);
  const toggleTemplate = useToggleGoalTemplate(classroomId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleWeekday = (value: number) => {
    setWeekdays((prev) => (prev.includes(value) ? prev.filter((w) => w !== value) : [...prev, value].sort()));
  };

  const handleCreate = async () => {
    if (!title.trim() || weekdays.length === 0) return;
    await createTemplate.mutateAsync({
      classroomId,
      studentId: targetStudentId,
      title: title.trim(),
      description: description.trim() || undefined,
      weekdays,
    });
    setTitle('');
    setDescription('');
  };

  return (
    <>
      <H2 style={{ marginTop: 8 }}>반복 목표 설정</H2>
      <Card>
        <Muted>선택한 요일마다 오늘의 목표에 자동으로 추가돼요.</Muted>
        <Input placeholder="목표 제목 (예: 단어 20개 암기)" value={title} onChangeText={setTitle} />
        <Input placeholder="설명 (선택)" value={description} onChangeText={setDescription} />

        <Text style={styles.label}>반복 요일</Text>
        <View style={styles.row}>
          {WEEKDAYS.map((w) => (
            <Pressable
              key={w.value}
              onPress={() => toggleWeekday(w.value)}
              style={[styles.dayChip, weekdays.includes(w.value) && styles.chipActive]}
            >
              <Text style={[styles.chipText, weekdays.includes(w.value) && { color: '#fff' }]}>{w.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>대상</Text>
        <View style={styles.row}>
          <Chip label="반 전체" active={targetStudentId === null} onPress={() => setTargetStudentId(null)} />
          {(roster ?? []).map((r) => (
            <Chip
              key={r.student.id}
              label={r.student.name}
              active={targetStudentId === r.student.id}
              onPress={() => setTargetStudentId(r.student.id)}
            />
          ))}
        </View>

        <Button title="반복 목표 추가" onPress={handleCreate} loading={createTemplate.isPending} />
      </Card>

      {!isLoading && (templates ?? []).length === 0 && <Muted>등록된 반복 목표가 없어요.</Muted>}
      {(templates ?? []).map((t) => (
        <Card key={t.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{t.title}</Text>
              <Muted>
                {t.weekdays.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(', ')}
                {t.student_id ? ' · 개인' : ' · 반 전체'}
              </Muted>
            </View>
            <Switch
              value={t.active}
              onValueChange={(active) => toggleTemplate.mutate({ templateId: t.id, active })}
            />
          </View>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
