import React from 'react';
import { ScrollView } from 'react-native';

import { AttendanceHistory } from '../../src/components/AttendanceHistory';
import { ExamRecordList } from '../../src/components/ExamRecordList';
import { TopBar } from '../../src/components/TopBar';
import { Screen } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';

export default function StudentRecords() {
  const { profile } = useAuth();

  return (
    <Screen>
      <TopBar title="출결 · 성적" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {profile && <AttendanceHistory studentId={profile.id} />}
        {profile && <ExamRecordList studentId={profile.id} />}
      </ScrollView>
    </Screen>
  );
}
