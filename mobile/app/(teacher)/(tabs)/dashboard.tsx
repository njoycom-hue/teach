import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { ClassroomListItem } from '../../../src/components/ClassroomListItem';
import { Button, Card, colors, Input, Muted, Screen } from '../../../src/components/ui';
import { TopBar } from '../../../src/components/TopBar';
import { useAuth } from '../../../src/hooks/useAuth';
import { useCreateClassroom, useTeacherClassrooms } from '../../../src/hooks/useClassrooms';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { data: classrooms, isLoading, isError, refetch } = useTeacherClassrooms(profile?.id);
  const createClassroom = useCreateClassroom(profile?.id);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createClassroom.mutateAsync({ name: name.trim(), subject: subject.trim() || undefined });
    setName('');
    setSubject('');
    setShowForm(false);
  };

  return (
    <Screen>
      <TopBar title="대시보드" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {isError && <Muted>반 목록을 불러오지 못했어요. 아래로 당겨서 새로고침해보세요.</Muted>}
        {!isLoading && !isError && (classrooms ?? []).length === 0 && (
          <Muted>아직 만든 반이 없어요. 아래에서 새 반을 만들어보세요.</Muted>
        )}
        {(classrooms ?? []).map((item) => (
          <ClassroomListItem key={item.id} classroom={item} />
        ))}

        <Card style={{ marginTop: 8 }}>
          {showForm ? (
            <>
              <Input placeholder="반 이름 (예: 중2 수학 과외)" value={name} onChangeText={setName} />
              <Input placeholder="과목 (선택)" value={subject} onChangeText={setSubject} />
              <Button title="만들기" onPress={handleCreate} loading={createClassroom.isPending} />
              <Button title="취소" variant="secondary" onPress={() => setShowForm(false)} />
            </>
          ) : (
            <Button title="+ 새 반 만들기" variant="secondary" onPress={() => setShowForm(true)} />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
