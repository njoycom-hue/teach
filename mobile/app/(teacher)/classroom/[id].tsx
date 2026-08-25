import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoalPlanBoard } from '../../../src/components/GoalPlanBoard';
import { TuitionManager } from '../../../src/components/TuitionManager';
import { Button, Card, colors, H1, Input, Muted, Screen } from '../../../src/components/ui';
import { useClassroomAttendance, useMarkAttendance } from '../../../src/hooks/useAttendance';
import { useClassroomStudents } from '../../../src/hooks/useClassrooms';
import { useCreateExamRecord } from '../../../src/hooks/useExamRecords';
import type { AttendanceStatus } from '../../../src/types/database';

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: '출석' },
  { value: 'LATE', label: '지각' },
  { value: 'ABSENT', label: '결석' },
];

const SECTIONS = [
  { key: 'goals', label: '목표' },
  { key: 'attendance', label: '출석' },
  { key: 'exam', label: '성적' },
  { key: 'tuition', label: '수업료' },
  { key: 'roster', label: '학생' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export default function ClassroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: roster } = useClassroomStudents(id);
  const [section, setSection] = useState<SectionKey>('goals');

  const studentCount = roster?.length ?? 0;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.primary }}>{'‹ 뒤로'}</Text>
      </Pressable>
      <H1>반 상세</H1>
      <Muted>학생 {studentCount}명</Muted>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14, marginBottom: 4, flexGrow: 0 }}
      >
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSection(s.key)}
            style={[styles.segment, section === s.key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, section === s.key && { color: '#fff' }]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {section === 'goals' && id && <GoalPlanBoard classroomId={id} />}
        {section === 'attendance' && id && <AttendanceSection classroomId={id} roster={roster ?? []} />}
        {section === 'exam' && id && <ExamSection classroomId={id} roster={roster ?? []} />}
        {section === 'tuition' && id && <TuitionManager classroomId={id} />}
        {section === 'roster' && id && <RosterSection classroomId={id} roster={roster ?? []} />}
      </ScrollView>
    </Screen>
  );
}

function AttendanceSection({
  classroomId,
  roster,
}: {
  classroomId: string;
  roster: { id: string; student: { id: string; name: string } }[];
}) {
  const { data: attendanceRows } = useClassroomAttendance(classroomId);
  const markAttendance = useMarkAttendance(classroomId);
  const today = new Date().toISOString().slice(0, 10);
  const attendanceByStudent = new Map((attendanceRows ?? []).map((a) => [a.student_id, a.status]));

  return (
    <>
      <Muted style={{ marginBottom: 8 }}>오늘 출석 체크 ({today})</Muted>
      <Card>
        {roster.length === 0 && <Muted>등록된 학생이 없어요.</Muted>}
        {roster.map((r) => {
          const current = attendanceByStudent.get(r.student.id);
          return (
            <View key={r.id} style={styles.attendanceRow}>
              <Text style={{ color: colors.text, flex: 1 }}>{r.student.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => markAttendance.mutate({ studentId: r.student.id, status: opt.value })}
                    style={[styles.attendanceChip, current === opt.value && styles.segmentActive]}
                  >
                    <Text style={[styles.attendanceChipText, current === opt.value && { color: '#fff' }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function ExamSection({
  classroomId,
  roster,
}: {
  classroomId: string;
  roster: { id: string; student: { id: string; name: string } }[];
}) {
  const [examStudentId, setExamStudentId] = useState<string | null>(null);
  const [examName, setExamName] = useState('');
  const [examScore, setExamScore] = useState('');
  const [examMaxScore, setExamMaxScore] = useState('');
  const createExam = useCreateExamRecord(examStudentId ?? undefined);
  const today = new Date().toISOString().slice(0, 10);

  const handleCreateExam = async () => {
    const score = parseFloat(examScore);
    const maxScore = parseFloat(examMaxScore);
    if (!examStudentId || !examName.trim() || Number.isNaN(score) || Number.isNaN(maxScore)) return;
    await createExam.mutateAsync({ classroomId, examName: examName.trim(), score, maxScore, examDate: today });
    setExamName('');
    setExamScore('');
    setExamMaxScore('');
  };

  return (
    <>
      <Muted style={{ marginBottom: 8 }}>시험 성적 등록</Muted>
      <Card>
        <Text style={styles.label}>학생 선택</Text>
        <View style={styles.row}>
          {roster.map((r) => (
            <Pressable
              key={r.student.id}
              onPress={() => setExamStudentId(r.student.id)}
              style={[styles.segment, examStudentId === r.student.id && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, examStudentId === r.student.id && { color: '#fff' }]}>
                {r.student.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input placeholder="시험명 (예: 중간고사)" value={examName} onChangeText={setExamName} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input
            placeholder="점수"
            keyboardType="numeric"
            value={examScore}
            onChangeText={setExamScore}
            style={{ flex: 1 }}
          />
          <Input
            placeholder="만점"
            keyboardType="numeric"
            value={examMaxScore}
            onChangeText={setExamMaxScore}
            style={{ flex: 1 }}
          />
        </View>
        <Button title="등록" onPress={handleCreateExam} loading={createExam.isPending} />
      </Card>
    </>
  );
}

function RosterSection({
  classroomId,
  roster,
}: {
  classroomId: string;
  roster: { id: string; student: { id: string; name: string; email: string | null } }[];
}) {
  const router = useRouter();
  return (
    <>
      <Muted style={{ marginBottom: 8 }}>학생 목록</Muted>
      {roster.length === 0 && <Muted>등록된 학생이 없어요. 반 대시보드에서 초대코드를 공유해보세요.</Muted>}
      {roster.map((item) => (
        <Card key={item.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '600', color: colors.text }}>{item.student.name}</Text>
              <Muted>{item.student.email}</Muted>
            </View>
            <Pressable
              onPress={() => router.push(`/(teacher)/chat/${classroomId}/${item.student.id}`)}
              style={styles.messageBtn}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>메시지</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    marginRight: 8,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attendanceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  attendanceChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  messageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
});
