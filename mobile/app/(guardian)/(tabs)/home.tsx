import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { StudentStatCard } from '../../../src/components/StudentStatCard';
import { TopBar } from '../../../src/components/TopBar';
import { Button, Card, H2, Input, Muted, Screen } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useGuardianStudents, useLinkGuardianToStudent } from '../../../src/hooks/useClassrooms';

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

  const approved = (links ?? []).filter((l) => l.status === 'APPROVED');
  const pending = (links ?? []).filter((l) => l.status === 'PENDING');

  return (
    <Screen>
      <TopBar title="자녀 현황" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoading && approved.length === 0 && pending.length === 0 && (
          <Muted>아직 연결된 자녀가 없어요.</Muted>
        )}

        {pending.map((item) => (
          <Card key={item.id}>
            <H2>{item.student.name}</H2>
            <Muted>학생의 승인을 기다리는 중이에요.</Muted>
          </Card>
        ))}

        {approved.map((item) => (
          <StudentStatCard key={item.id} studentId={item.student.id} studentName={item.student.name} />
        ))}

        <Card style={{ marginTop: 8 }}>
          <H2>자녀 계정 연결하기</H2>
          <Muted>자녀(학생)가 가입할 때 사용한 이메일을 입력해주세요. 자녀가 승인하면 연결돼요.</Muted>
          <Input placeholder="자녀 이메일" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Input placeholder="관계 (예: 모, 부) - 선택" value={relation} onChangeText={setRelation} />
          {errorMsg && <Text style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</Text>}
          <Button title="연결 요청 보내기" onPress={handleLink} loading={linkGuardian.isPending} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
