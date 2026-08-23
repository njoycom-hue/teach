import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { TopBar } from '../../src/components/TopBar';
import { Button, Card, colors, H2, Input, Muted, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useJoinClassroom, useMyClassrooms } from '../../src/hooks/useClassrooms';
import { useCompleteGoal, useTodayGoals } from '../../src/hooks/useGoals';
import { useAddStudyLog } from '../../src/hooks/useStudyLogs';

export default function TodayGoals() {
  const { profile } = useAuth();
  const { data: classrooms, isLoading: classroomsLoading } = useMyClassrooms(profile?.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);

  const { data: goals, isLoading: goalsLoading } = useTodayGoals(profile?.id, classroomIds);
  const completeGoal = useCompleteGoal(profile?.id);
  const addStudyLog = useAddStudyLog(profile?.id);

  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinClassroom = useJoinClassroom();

  const [minutes, setMinutes] = useState('');

  const handleJoin = async () => {
    setJoinError(null);
    if (!inviteCode.trim()) return;
    try {
      await joinClassroom.mutateAsync(inviteCode.trim());
      setInviteCode('');
    } catch (e: any) {
      setJoinError(e.message ?? '참여에 실패했습니다.');
    }
  };

  const handleLogMinutes = async () => {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return;
    await addStudyLog.mutateAsync({ minutes: m });
    setMinutes('');
  };

  if (!classroomsLoading && classroomIds.length === 0) {
    return (
      <Screen>
        <TopBar title="오늘의 목표" />
        <Card>
          <H2>선생님 반에 참여하기</H2>
          <Muted>선생님께 받은 초대코드를 입력해주세요.</Muted>
          <Input placeholder="초대코드" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="none" />
          {joinError && <Text style={{ color: 'red', marginBottom: 8 }}>{joinError}</Text>}
          <Button title="참여하기" onPress={handleJoin} loading={joinClassroom.isPending} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="오늘의 목표" />

      <Card>
        <H2>오늘 학습시간 기록</H2>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input
            placeholder="분(minutes)"
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
            style={{ flex: 1 }}
          />
        </View>
        <Button title="기록 추가" variant="secondary" onPress={handleLogMinutes} loading={addStudyLog.isPending} />
      </Card>

      <FlatList
        data={goals ?? []}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={!goalsLoading ? <Muted>오늘 등록된 목표가 없어요.</Muted> : null}
        renderItem={({ item }) => {
          const status = item.completion?.status;
          return (
            <Card>
              <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{item.title}</Text>
              {item.description ? <Muted>{item.description}</Muted> : null}
              {status === 'DONE' ? (
                <Text style={{ marginTop: 10, color: colors.success, fontWeight: '600' }}>완료했어요!</Text>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="완료"
                      onPress={() => completeGoal.mutate({ goalId: item.id, status: 'DONE' })}
                      loading={completeGoal.isPending}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="건너뛰기"
                      variant="secondary"
                      onPress={() => completeGoal.mutate({ goalId: item.id, status: 'SKIPPED' })}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        }}
      />
    </Screen>
  );
}
