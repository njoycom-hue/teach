import React from 'react';
import { Text, View } from 'react-native';

import { useStudentAttendanceHistory } from '../hooks/useAttendance';
import { Card, colors, H2, Muted } from './ui';

const STATUS_LABEL: Record<string, string> = {
  PRESENT: '출석',
  LATE: '지각',
  ABSENT: '결석',
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: colors.success,
  LATE: '#F59E0B',
  ABSENT: colors.danger,
};

export function AttendanceHistory({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentAttendanceHistory(studentId);

  return (
    <Card>
      <H2>출석 이력</H2>
      {isLoading && <Muted>불러오는 중...</Muted>}
      {!isLoading && (!data || data.length === 0) && <Muted>출석 기록이 없어요.</Muted>}
      {(data ?? []).map((row) => (
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
          <Text style={{ color: colors.text }}>
            {row.session_date} {row.classroom?.name ? `· ${row.classroom.name}` : ''}
          </Text>
          <Text style={{ color: STATUS_COLOR[row.status], fontWeight: '700' }}>
            {STATUS_LABEL[row.status]}
          </Text>
        </View>
      ))}
    </Card>
  );
}
