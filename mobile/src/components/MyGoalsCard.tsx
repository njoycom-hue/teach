import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  useCreatePersonalGoal,
  useDeletePersonalGoal,
  useTodayPersonalGoals,
  useTogglePersonalGoal,
} from '../hooks/usePersonalGoals';
import { Card, colors, H2, Input, Muted } from './ui';

// 학생이 스스로 정하는 목표. 선생님이 배정한 "오늘 할 일"과는 완전히 분리된,
// 학생 본인만 보는 자기주도 목표 공간 — 이 앱의 동기부여 핵심.
export function MyGoalsCard({ studentId }: { studentId: string | undefined }) {
  const { data: goals, isLoading } = useTodayPersonalGoals(studentId);
  const createGoal = useCreatePersonalGoal(studentId);
  const toggleGoal = useTogglePersonalGoal(studentId);
  const deleteGoal = useDeletePersonalGoal(studentId);
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await createGoal.mutateAsync({ title: title.trim() });
    setTitle('');
  };

  const doneCount = (goals ?? []).filter((g) => g.completed).length;

  return (
    <Card style={{ borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Ionicons name="star" size={18} color="#F59E0B" />
        <H2 style={{ marginBottom: 0 }}>내 목표</H2>
      </View>
      <Muted>선생님이 준 계획 말고, 내가 스스로 정한 오늘의 목표예요.</Muted>

      {isLoading && <Muted style={{ marginTop: 8 }}>불러오는 중...</Muted>}
      {!isLoading && (goals ?? []).length > 0 && (
        <Text style={{ fontSize: 12, color: '#B45309', fontWeight: '700', marginTop: 8, marginBottom: 4 }}>
          {doneCount}/{goals!.length}개 달성
        </Text>
      )}

      <View style={{ marginTop: 4 }}>
        {(goals ?? []).map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            <Pressable
              onPress={() => toggleGoal.mutate({ id: g.id, completed: !g.completed })}
              hitSlop={8}
              style={{ marginRight: 10 }}
            >
              <Ionicons
                name={g.completed ? 'checkbox' : 'square-outline'}
                size={22}
                color={g.completed ? colors.success : '#B45309'}
              />
            </Pressable>
            <Text
              style={{
                flex: 1,
                color: g.completed ? colors.textMuted : colors.text,
                textDecorationLine: g.completed ? 'line-through' : 'none',
              }}
            >
              {g.title}
            </Text>
            <Pressable onPress={() => deleteGoal.mutate(g.id)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Input
          placeholder="예: 단어 20개 외우기"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleAdd}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <Pressable
          onPress={handleAdd}
          style={{
            paddingHorizontal: 16,
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: '#F59E0B',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>추가</Text>
        </Pressable>
      </View>
    </Card>
  );
}
