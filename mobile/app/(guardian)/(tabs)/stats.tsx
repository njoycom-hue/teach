import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { AttendanceHistory } from '../../../src/components/AttendanceHistory';
import { ExamRecordList } from '../../../src/components/ExamRecordList';
import { StudentStatCard } from '../../../src/components/StudentStatCard';
import { TopBar } from '../../../src/components/TopBar';
import { Chip, Muted, Screen } from '../../../src/components/ui';
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4, flexGrow: 0 }}>
          {approved.map((item) => (
            <Chip
              key={item.id}
              label={item.student.name}
              active={selectedId === item.student.id}
              onPress={() => setSelectedId(item.student.id)}
            />
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
