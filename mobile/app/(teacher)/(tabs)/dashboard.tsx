import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';

import { Button, Card, colors, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { TopBar } from '../../../src/components/TopBar';
import { useAuth } from '../../../src/hooks/useAuth';
import { useCreateClassroom, useTeacherClassrooms } from '../../../src/hooks/useClassrooms';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const { data: classrooms, isLoading } = useTeacherClassrooms(profile?.id);
  const createClassroom = useCreateClassroom(profile?.id);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');

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

      <FlatList
        data={classrooms ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading ? <Muted>아직 만든 반이 없어요. 아래에서 새 반을 만들어보세요.</Muted> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(teacher)/classroom/${item.id}`)}>
            <Card>
              <H2>{item.name}</H2>
              <Muted>{item.subject ?? '과목 미설정'}</Muted>
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.primary }}>
                초대코드: {item.invite_code}
              </Text>
            </Card>
          </Pressable>
        )}
        ListFooterComponent={
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
        }
      />
    </Screen>
  );
}
