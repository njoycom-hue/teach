import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { AnnouncementList } from '../../../src/components/AnnouncementList';
import { GuardianRequestsCard } from '../../../src/components/GuardianRequestsCard';
import { MyGoalsCard } from '../../../src/components/MyGoalsCard';
import { ProgressSummaryCard } from '../../../src/components/ProgressSummaryCard';
import { ProofThumbnail } from '../../../src/components/ProofThumbnail';
import { StudyTimer } from '../../../src/components/StudyTimer';
import { TopBar } from '../../../src/components/TopBar';
import { UpcomingPlanList } from '../../../src/components/UpcomingPlanList';
import { Button, Card, colors, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useJoinClassroom, useMyClassrooms } from '../../../src/hooks/useClassrooms';
import { useCompleteGoal, useTodayGoals } from '../../../src/hooks/useGoals';
import { useAutoGenerateRecurringGoals } from '../../../src/hooks/useGoalTemplates';
import { useMyAnnouncements } from '../../../src/hooks/useAnnouncements';
import { useUploadProof } from '../../../src/hooks/useProofUpload';

export default function TodayGoals() {
  const { profile } = useAuth();
  const { data: classrooms } = useMyClassrooms(profile?.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const queryClient = useQueryClient();
  useAutoGenerateRecurringGoals(classroomIds, () => {
    queryClient.invalidateQueries({ queryKey: ['today-goals'] });
  });

  const {
    data: goals,
    isLoading: goalsLoading,
    isError: goalsError,
    refetch: refetchGoals,
  } = useTodayGoals(profile?.id, classroomIds);
  const completeGoal = useCompleteGoal(profile?.id);
  const uploadProof = useUploadProof(profile?.id);
  const [proofError, setProofError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGoals(),
      queryClient.invalidateQueries({ queryKey: ['weekly-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['upcoming-goals'] }),
      queryClient.invalidateQueries({ queryKey: ['personal-goals'] }),
      queryClient.invalidateQueries({ queryKey: ['announcements'] }),
    ]);
    setRefreshing(false);
  }, [refetchGoals, queryClient]);

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

  const hasClassroom = classroomIds.length > 0;
  const { data: announcements, isLoading: announcementsLoading } = useMyAnnouncements(classroomIds);

  return (
    <Screen>
      <TopBar title="오늘의 학습 계획" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <GuardianRequestsCard studentId={profile?.id} />

        <MyGoalsCard studentId={profile?.id} />

        <ProgressSummaryCard studentId={profile?.id} />

        <StudyTimer studentId={profile?.id} />

        {!hasClassroom && (
          <Card>
            <H2>선생님 반에 참여하기</H2>
            <Muted>선생님께 받은 초대코드를 입력하면 선생님이 준 계획도 함께 볼 수 있어요.</Muted>
            <Input placeholder="초대코드" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="none" />
            {joinError && <Text style={{ color: colors.danger, marginBottom: 8 }}>{joinError}</Text>}
            <Button title="참여하기" onPress={handleJoin} loading={joinClassroom.isPending} />
          </Card>
        )}

        {hasClassroom && (
          <>
            <AnnouncementList announcements={announcements} isLoading={announcementsLoading} />

            <H2 style={{ marginTop: 4 }}>선생님이 준 오늘 할 일</H2>
            {proofError && <Text style={{ color: colors.danger, marginBottom: 8 }}>{proofError}</Text>}
            {goalsError && <Muted>목표를 불러오지 못했어요. 아래로 당겨서 새로고침해보세요.</Muted>}
            {!goalsLoading && !goalsError && (goals ?? []).length === 0 && (
              <Muted>오늘 등록된 목표가 없어요.</Muted>
            )}
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

            <UpcomingPlanList studentId={profile?.id} classroomIds={classroomIds} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
