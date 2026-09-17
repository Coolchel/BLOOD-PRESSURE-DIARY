import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { MeasurementCard } from '@/components/measurement-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeeklyChart } from '@/components/weekly-chart';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { measurementStats } from '@/constants/measurement-stats';
import {
  formatPhaseRange,
  phaseDays,
  pluralDays,
  pluralRecords,
} from '@/constants/phase-format';
import { getMeasurementsInPhase, getPhaseById } from '@/data/database';
import type { ExperimentPhase } from '@/types/experiment';
import { phaseKindInfo } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export default function PhaseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [phase, setPhase] = useState<ExperimentPhase | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      setLoading(false);
      return;
    }

    try {
      const found = await getPhaseById(db, numericId);
      setPhase(found);
      setMeasurements(found ? await getMeasurementsInPhase(db, found) : []);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <ScreenShell>
        <Text style={styles.loading}>Загружаем период…</Text>
      </ScreenShell>
    );
  }

  if (!phase) {
    return (
      <ScreenShell>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={22} color={Palette.text} />
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Период не найден</Text>
          <Text style={styles.notFoundText}>Возможно, он уже удалён.</Text>
        </View>
      </ScreenShell>
    );
  }

  const info = phaseKindInfo(phase.kind);
  const hasData = measurements.length > 0;
  const stats = measurementStats(measurements);

  return (
    <ScreenShell contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Назад"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backButton}>
          <IconSymbol name="chevron.left" size={23} color={Palette.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{phase.title}</Text>
          <Text style={styles.subtitle}>
            {formatPhaseRange(phase.startedAt, phase.endedAt)} ·{' '}
            {pluralDays(phaseDays(phase.startedAt, phase.endedAt))}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Изменить период"
          hitSlop={12}
          onPress={() =>
            router.push({ pathname: '/phase-editor', params: { id: String(phase.id) } })
          }
          style={styles.backButton}>
          <IconSymbol name="square.and.pencil" size={19} color={Palette.coral} />
        </Pressable>
      </View>

      <View style={styles.badges}>
        <View style={[styles.kindChip, { backgroundColor: info.soft }]}>
          <View style={[styles.dot, { backgroundColor: info.color }]} />
          <Text style={[styles.kindChipText, { color: info.color }]}>{info.label}</Text>
        </View>
        {phase.endedAt === null ? (
          <View style={styles.liveChip}>
            <Text style={styles.liveChipText}>идёт сейчас</Text>
          </View>
        ) : null}
        <Text style={styles.countText}>{pluralRecords(measurements.length)}</Text>
      </View>

      <Text style={styles.sectionLabel}>СРЕДНЕЕ ЗА ПЕРИОД</Text>
      <GlassCard contentStyle={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: Palette.coralSoft }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.systolic : '—'}
            </Text>
            <Text style={styles.statLabel}>Систолическое</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: Palette.orangeSoft }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.diastolic : '—'}
            </Text>
            <Text style={styles.statLabel}>Диастолическое</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {hasData ? stats.pulse : '—'}
            </Text>
            <Text style={styles.statLabel}>Пульс</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FFF8E9' }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.wellbeing : '—'}
            </Text>
            <Text style={styles.statLabel}>Самочувствие</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionLabel}>ДИНАМИКА ВНУТРИ ПЕРИОДА</Text>
      <GlassCard contentStyle={styles.chartCard}>
        <WeeklyChart measurements={measurements} />
      </GlassCard>

      {phase.note ? (
        <>
          <Text style={styles.sectionLabel}>ЗАМЕТКА</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{phase.note}</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>ИЗМЕРЕНИЯ ПЕРИОДА</Text>
      <View style={styles.list}>
        {measurements.map((measurement) => (
          <MeasurementCard
            key={measurement.id}
            measurement={measurement}
            onPress={() =>
              router.push({
                pathname: '/measurement/[id]',
                params: { id: String(measurement.id) },
              })
            }
          />
        ))}
      </View>

      {!hasData ? (
        <Text style={styles.emptyText}>В этот период измерений пока нет.</Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 48,
  },
  loading: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 16,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    color: Palette.text,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kindChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  liveChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.coralSoft,
  },
  liveChipText: {
    color: Palette.coral,
    fontSize: 10.5,
    fontWeight: '700',
  },
  countText: {
    color: Palette.subtle,
    fontSize: 11.5,
  },
  sectionLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: Spacing.lg,
  },
  statsCard: {
    padding: 10,
    gap: 9,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
  },
  stat: {
    flex: 1,
    minHeight: 84,
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(244,245,248,0.9)',
  },
  statValue: {
    color: Palette.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 10.5,
    marginTop: 3,
  },
  chartCard: {
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 6,
  },
  noteCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  noteText: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: 12,
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
  notFound: {
    alignItems: 'center',
    marginTop: 80,
  },
  notFoundTitle: {
    color: Palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  notFoundText: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 6,
  },
});
