import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { GuardianRequestsCard } from '../../../src/components/GuardianRequestsCard';
import { ProgressSummaryCard } from '../../../src/components/ProgressSummaryCard';
import { ProofThumbnail } from '../../../src/components/ProofThumbnail';
import { TopBar } from '../../../src/components/TopBar';
import { Button, Card, colors, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useJoinClassroom, useMyClassrooms } from '../../../src/hooks/useClassrooms';
import { useCompleteGoal, useTodayGoals } from '../../../src/hooks/useGoals';
import { useAutoGenerateRecurringGoals } from '../../../src/hooks/useGoalTemplates';
import { useUploadProof } from '../../../src/hooks/useProofUpload';
import { useAddStudyLog } from '../../../src/hooks/useStudyLogs';

export default function TodayGoals() {
  const { profile } = useAuth();
  const { data: classrooms, isLoading: classroomsLoading } = useMyClassrooms(profile?.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const queryClient = useQueryClient();
  useAutoGenerateRecurringGoals(classroomIds, () => {
    queryClient.invalidateQueries({ queryKey: ['today-goals'] });
  });

  const { data: goals, isLoading: goalsLoading } = useTodayGoals(profile?.id, classroomIds);
  const completeGoal = useCompleteGoal(profile?.id);
  const addStudyLog = useAddStudyLog(profile?.id);
  const uploadProof = useUploadProof(profile?.id);
  const [proofError, setProofError] = useState<string | null>(null);

  const handleCompleteWithProof = async (goalId: string) => {
    setProofError(null);
    try {
      const path = await uploadProof.mutateAsync({ goalId });
      if (!path) return; // 사용자가 촬영을 취소함
      completeGoal.mutate({ goalId, status: 'DONE', proofUrl: path });
    } catch (e: any) {
      setProofError(e.message ?? '사진 인증에 실패했습니다.');
    }
  };

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
        <TopBar title="오늘의 학습 계획" />
        <GuardianRequestsCard studentId={profile?.id} />
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
      <TopBar title="오늘의 학습 계획" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <GuardianRequestsCard studentId={profile?.id} />

        <ProgressSummaryCard studentId={profile?.id} />

        <H2 style={{ marginTop: 4 }}>오늘 할 일</H2>
        {proofError && <Text style={{ color: 'red', marginBottom: 8 }}>{proofError}</Text>}
        {!goalsLoading && (goals ?? []).length === 0 && <Muted>오늘 등록된 목표가 없어요.</Muted>}
        {(goals ?? []).map((item) => {
          const status = item.completion?.status;
          return (
            <Card key={item.id}>
              <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{item.title}</Text>
              {item.description ? <Muted>{item.description}</Muted> : null}
              {status === 'DONE' ? (
                <>
                  <Text style={{ marginTop: 10, color: colors.success, fontWeight: '600' }}>완료했어요!</Text>
                  {item.completion?.proof_url ? <ProofThumbnail path={item.completion.proof_url} /> : null}
                </>
              ) : (
                <>
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
                  <Button
                    title="사진 찍고 인증하기"
                    variant="secondary"
                    onPress={() => handleCompleteWithProof(item.id)}
                    loading={uploadProof.isPending}
                  />
                </>
              )}
            </Card>
          );
        })}

        <Card style={{ marginTop: 8 }}>
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
      </ScrollView>
    </Screen>
  );
}
