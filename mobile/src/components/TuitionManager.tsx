import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useClassroomStudents } from '../hooks/useClassrooms';
import { useClassroomTuition, useCreateTuitionPayment, useSetTuitionPaid } from '../hooks/useTuition';
import { Button, Card, colors, H2, Input, Muted } from './ui';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function statusOf(payment: { paid_date: string | null; due_date: string }) {
  if (payment.paid_date) return { label: '완납', color: colors.success };
  if (payment.due_date < todayStr()) return { label: '기한 초과', color: colors.danger };
  return { label: '미납', color: '#F59E0B' };
}

export function TuitionManager({ classroomId }: { classroomId: string }) {
  const { profile } = useAuth();
  const { data: roster } = useClassroomStudents(classroomId);
  const { data: payments, isLoading } = useClassroomTuition(classroomId);
  const createPayment = useCreateTuitionPayment(profile?.id);
  const setPaid = useSetTuitionPaid(classroomId);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());

  const handleCreate = async () => {
    const amountNum = parseFloat(amount);
    if (!studentId || !dueDate.trim() || Number.isNaN(amountNum)) return;
    await createPayment.mutateAsync({ classroomId, studentId, amount: amountNum, dueDate: dueDate.trim() });
    setAmount('');
  };

  return (
    <>
      <H2 style={{ marginTop: 8 }}>수업료 관리</H2>
      <Card>
        <Muted>학생을 선택하고 금액·납부 기한을 입력하세요.</Muted>
        <View style={styles.row}>
          {(roster ?? []).map((r) => (
            <Pressable
              key={r.student.id}
              onPress={() => setStudentId(r.student.id)}
              style={[styles.chip, studentId === r.student.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, studentId === r.student.id && { color: '#fff' }]}>
                {r.student.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input placeholder="금액 (원)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <Input placeholder="납부 기한 (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
        <Button title="등록" onPress={handleCreate} loading={createPayment.isPending} />
      </Card>

      {!isLoading && (payments ?? []).length === 0 && <Muted>등록된 수업료 내역이 없어요.</Muted>}
      {(payments ?? []).map((p) => {
        const status = statusOf(p);
        return (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {p.student?.name ?? ''} · {p.amount.toLocaleString()}원
                </Text>
                <Muted>납부 기한 {p.due_date}</Muted>
              </View>
              <Pressable
                onPress={() => setPaid.mutate({ id: p.id, paid: !p.paid_date })}
                style={[styles.statusChip, { borderColor: status.color }]}
              >
                <Text style={{ color: status.color, fontWeight: '700', fontSize: 12 }}>{status.label}</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
});
