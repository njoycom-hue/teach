import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DayStat } from '../hooks/useStats';
import { colors } from './ui';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

export function WeeklyBarChart({ days }: { days: DayStat[] }) {
  const maxMinutes = Math.max(1, ...days.map((d) => d.minutesStudied));

  return (
    <View style={styles.row}>
      {days.map((d) => {
        const heightPct = Math.round((d.minutesStudied / maxMinutes) * 100);
        const weekday = WEEKDAY[new Date(d.date).getDay()];
        const allDone = d.goalsTotal > 0 && d.goalsDone === d.goalsTotal;
        return (
          <View key={d.date} style={styles.col}>
            <Text style={styles.minutes}>{d.minutesStudied > 0 ? d.minutesStudied : ''}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(heightPct, d.minutesStudied > 0 ? 6 : 0)}%` },
                  allDone && { backgroundColor: colors.success },
                ]}
              />
            </View>
            <Text style={styles.weekday}>{weekday}</Text>
            <Text style={styles.goalCount}>
              {d.goalsTotal > 0 ? `${d.goalsDone}/${d.goalsTotal}` : '-'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  minutes: {
    fontSize: 11,
    color: colors.textMuted,
    height: 14,
  },
  track: {
    width: 18,
    height: 90,
    justifyContent: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderRadius: 9,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9,
  },
  weekday: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  goalCount: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
