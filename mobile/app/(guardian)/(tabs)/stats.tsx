import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AttendanceHistory } from '../../../src/components/AttendanceHistory';
import { ExamRecordList } from '../../../src/components/ExamRecordList';
import { StudentStatCard } from '../../../src/components/StudentStatCard';
import { TopBar } from '../../../src/components/TopBar';
import { colors, Muted, Screen } from '../../../src/components/ui';
import { TuitionList } from '../../../src/components/TuitionList';
import { useAuth } from '../../../src/hooks/useAuth';
import { useGuardianStudents } from '../../../src/hooks/useClassrooms';

export default function GuardianStats() {
  const { profile } = useAuth();
  const { data: links, isLoading } = useGuardianStudents(profile?.id);
  const approved = (links ?? []).filter((l) => l.status === 'APPROVED');
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedId && approved.length > 0) setSelectedId(approved[0].student.id);
  }, [approved, selectedId]);

  const selected = approved.find((l) => l.student.id === selectedId);

  return (
    <Screen>
      <TopBar title="통계" />

      {approved.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, flexGrow: 0 }}>
          {approved.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId(item.student.id)}
              style={[styles.chip, selectedId === item.student.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedId === item.student.id && { color: '#fff' }]}>
                {item.student.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoading && approved.length === 0 && <Muted>연결이 승인된 자녀가 없어요.</Muted>}
        {selected && (
          <>
            <StudentStatCard studentId={selected.student.id} studentName={selected.student.name} />
            <AttendanceHistory studentId={selected.student.id} />
            <ExamRecordList studentId={selected.student.id} />
            <TuitionList studentId={selected.student.id} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
