import React from 'react';
import { Text, View } from 'react-native';

import { useStudentTuition } from '../hooks/useTuition';
import { Card, colors, H2, Muted } from './ui';

function statusOf(payment: { paid_date: string | null; due_date: string }) {
  if (payment.paid_date) return { label: '완납', color: colors.success };
  const today = new Date().toISOString().slice(0, 10);
  if (payment.due_date < today) return { label: '기한 초과', color: colors.danger };
  return { label: '미납', color: '#F59E0B' };
}

export function TuitionList({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentTuition(studentId);

  return (
    <Card>
      <H2>수업료</H2>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {!isLoading && (!data || data.length === 0) && <Muted>등록된 수업료 내역이 없어요.</Muted>}
      {(data ?? []).map((row) => {
        const status = statusOf(row);
        return (
          <View
            key={row.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{row.amount.toLocaleString()}원</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>납부 기한 {row.due_date}</Text>
            </View>
            <Text style={{ color: status.color, fontWeight: '700' }}>{status.label}</Text>
          </View>
        );
      })}
    </Card>
  );
}
