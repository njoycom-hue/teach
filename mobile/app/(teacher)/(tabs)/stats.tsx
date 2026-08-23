import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { StudentStatCard } from '../../../src/components/StudentStatCard';
import { TopBar } from '../../../src/components/TopBar';
import { colors, Muted, Screen } from '../../../src/components/ui';
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
        <FlatList
          horizontal
          data={classrooms}
          keyExtractor={(c) => c.id}
          style={{ marginBottom: 12, flexGrow: 0 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedId(item.id)}
              style={[styles.chip, selectedId === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedId === item.id && { color: '#fff' }]}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <FlatList
        data={roster ?? []}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={!isLoading ? <Muted>등록된 학생이 없어요.</Muted> : null}
        renderItem={({ item }) => <StudentStatCard studentId={item.student.id} studentName={item.student.name} />}
      />
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
