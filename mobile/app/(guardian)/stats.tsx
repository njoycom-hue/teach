import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { StudentStatCard } from '../../src/components/StudentStatCard';
import { TopBar } from '../../src/components/TopBar';
import { colors, Muted, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useGuardianStudents } from '../../src/hooks/useClassrooms';

export default function GuardianStats() {
  const { profile } = useAuth();
  const { data: links, isLoading } = useGuardianStudents(profile?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedId && links && links.length > 0) setSelectedId(links[0].student.id);
  }, [links, selectedId]);

  const selected = links?.find((l) => l.student.id === selectedId);

  return (
    <Screen>
      <TopBar title="통계" />

      {links && links.length > 0 && (
        <FlatList
          horizontal
          data={links}
          keyExtractor={(l) => l.id}
          style={{ marginBottom: 12, flexGrow: 0 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedId(item.student.id)}
              style={[styles.chip, selectedId === item.student.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedId === item.student.id && { color: '#fff' }]}>
                {item.student.name}
              </Text>
            </Pressable>
          )}
        />
      )}

      {!isLoading && (!links || links.length === 0) && <Muted>아직 연결된 자녀가 없어요.</Muted>}
      {selected && <StudentStatCard studentId={selected.student.id} studentName={selected.student.name} />}
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
