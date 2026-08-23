import React from 'react';
import { View } from 'react-native';

import { usePendingGuardianRequests, useRespondGuardianRequest } from '../hooks/useClassrooms';
import { Button, Card, H2, Muted } from './ui';

export function GuardianRequestsCard({ studentId }: { studentId: string | undefined }) {
  const { data: requests } = usePendingGuardianRequests(studentId);
  const respond = useRespondGuardianRequest(studentId);

  if (!requests || requests.length === 0) return null;

  return (
    <Card>
      <H2>보호자 연결 요청</H2>
      {requests.map((req) => (
        <View key={req.id} style={{ marginBottom: 10 }}>
          <Muted>
            {req.guardian.name}
            {req.relation ? ` (${req.relation})` : ''}님이 연결을 요청했어요.
          </Muted>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="승인"
                onPress={() => respond.mutate({ linkId: req.id, approve: true })}
                loading={respond.isPending}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="거절"
                variant="secondary"
                onPress={() => respond.mutate({ linkId: req.id, approve: false })}
              />
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}
