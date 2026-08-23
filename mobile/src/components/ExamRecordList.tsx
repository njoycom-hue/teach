import React from 'react';
import { Text, View } from 'react-native';

import { useStudentExamRecords } from '../hooks/useExamRecords';
import { Card, colors, H2, Muted } from './ui';

export function ExamRecordList({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentExamRecords(studentId);

  return (
    <Card>
      <H2>시험 성적</H2>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {!isLoading && (!data || data.length === 0) && <Muted>등록된 시험 성적이 없어요.</Muted>}
      {(data ?? []).map((row) => {
        const pct = row.score != null && row.max_score ? Math.round((row.score / row.max_score) * 100) : null;
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
              <Text style={{ color: colors.text, fontWeight: '600' }}>{row.exam_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{row.exam_date}</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {row.score ?? '-'} / {row.max_score ?? '-'}
              {pct != null ? ` (${pct}%)` : ''}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}
