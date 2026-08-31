import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { StudentStatCard } from '../../../src/components/StudentStatCard';
import { TopBar } from '../../../src/components/TopBar';
import { Chip, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useClassroomStudents, useTeacherClassrooms } from '../../../src/hooks/useClassrooms';

export default function TeacherStats() {
  const { profile } = useAuth();
  const { data: classrooms } = useTeacherClassrooms(profile?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedId && classrooms && classrooms.length > 0) setSelectedId(classrooms[0].id);
  }, [classrooms, selectedId]);

  const { data: roster, isLoading } = useClassroomStudents(selectedId);

  return (
    <Screen>
      <TopBar title="통계" />

      {classrooms && classrooms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4, flexGrow: 0 }}>
          {classrooms.map((item) => (
            <Chip key={item.id} label={item.name} active={selectedId === item.id} onPress={() => setSelectedId(item.id)} />
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoading && (roster ?? []).length === 0 && <Muted>등록된 학생이 없어요.</Muted>}
        {(roster ?? []).map((item) => (
          <StudentStatCard key={item.id} studentId={item.student.id} studentName={item.student.name} />
        ))}
      </ScrollView>
    </Screen>
  );
}
