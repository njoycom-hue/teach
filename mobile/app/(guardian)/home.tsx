import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';

import { StudentStatCard } from '../../src/components/StudentStatCard';
import { TopBar } from '../../src/components/TopBar';
import { Button, Card, H2, Input, Muted, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useGuardianStudents, useLinkGuardianToStudent } from '../../src/hooks/useClassrooms';

export default function GuardianHome() {
  const { profile } = useAuth();
  const { data: links, isLoading } = useGuardianStudents(profile?.id);
  const linkGuardian = useLinkGuardianToStudent();

  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLink = async () => {
    setErrorMsg(null);
    if (!email.trim()) return;
    try {
      await linkGuardian.mutateAsync({ studentEmail: email.trim(), relation: relation.trim() || undefined });
      setEmail('');
      setRelation('');
    } catch (e: any) {
      setErrorMsg(e.message ?? '연결에 실패했습니다.');
    }
  };

  return (
    <Screen>
      <TopBar title="자녀 현황" />

      <FlatList
        data={links ?? []}
        keyExtractor={(l) => l.id}
        ListEmptyComponent={!isLoading ? <Muted>아직 연결된 자녀가 없어요.</Muted> : null}
        renderItem={({ item }) => <StudentStatCard studentId={item.student.id} studentName={item.student.name} />}
        ListFooterComponent={
          <Card style={{ marginTop: 8 }}>
            <H2>자녀 계정 연결하기</H2>
            <Muted>자녀(학생)가 가입할 때 사용한 이메일을 입력해주세요.</Muted>
            <Input placeholder="자녀 이메일" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <Input placeholder="관계 (예: 모, 부) - 선택" value={relation} onChangeText={setRelation} />
            {errorMsg && <Text style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</Text>}
            <Button title="연결하기" onPress={handleLink} loading={linkGuardian.isPending} />
          </Card>
        }
      />
    </Screen>
  );
}
