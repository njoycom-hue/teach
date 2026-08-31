import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAddStudyLog } from '../hooks/useStudyLogs';
import { Card, colors, H2, Input, Muted } from './ui';

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// 열품타식 스톱워치 - 숫자를 직접 입력하는 대신 실제로 시간을 재면서 학습시간을 기록한다.
export function StudyTimer({ studentId }: { studentId: string | undefined }) {
  const addStudyLog = useAddStudyLog(studentId);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const handleStop = async () => {
    setRunning(false);
    const minutes = Math.round(elapsed / 60);
    setElapsed(0);
    if (minutes > 0) {
      await addStudyLog.mutateAsync({ minutes });
    }
  };

  const handleManualAdd = async () => {
    const m = parseInt(manualMinutes, 10);
    if (!m || m <= 0) return;
    await addStudyLog.mutateAsync({ minutes: m });
    setManualMinutes('');
    setShowManual(false);
  };

  return (
    <Card>
      <H2>학습 타이머</H2>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 40, fontWeight: '700', color: running ? colors.primary : colors.text }}>
          {formatElapsed(elapsed)}
        </Text>
        <Pressable
          onPress={() => (running ? handleStop() : setRunning(true))}
          style={{
            marginTop: 12,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: running ? colors.danger : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={running ? 'stop' : 'play'} size={30} color="#fff" />
        </Pressable>
        <Muted style={{ marginTop: 8 }}>{running ? '측정 중... 멈추면 자동으로 기록돼요' : '시작을 눌러 공부 시간을 재보세요'}</Muted>
      </View>

      {!running && (
        <Pressable onPress={() => setShowManual((v) => !v)}>
          <Text style={{ color: colors.primary, fontSize: 12, textAlign: 'center' }}>
            {showManual ? '접기' : '이미 공부한 시간 직접 입력하기'}
          </Text>
        </Pressable>
      )}
      {showManual && !running && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Input
            placeholder="분(minutes)"
            keyboardType="number-pad"
            value={manualMinutes}
            onChangeText={setManualMinutes}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Pressable
            onPress={handleManualAdd}
            style={{
              paddingHorizontal: 16,
              justifyContent: 'center',
              borderRadius: 10,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>추가</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
