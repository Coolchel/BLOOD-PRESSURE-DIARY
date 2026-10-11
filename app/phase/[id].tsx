'use no memo'; // Re-evaluate shared locale formatters when the language changes.

import { tr } from '@/localization';
import { useLanguage } from '@/localization/provider';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { DataLoadState } from '@/components/data-load-state';
import { MeasurementCard } from '@/components/measurement-card';
import { SaveSuccessOverlay } from '@/components/save-success-overlay';
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
import { savePhase } from '@/data/phase-actions';
import type { ExperimentPhase } from '@/types/experiment';
import { phaseKindInfo } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export default function PhaseDetailsScreen() {
  useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [phase, setPhase] = useState<ExperimentPhase | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const requestId = useRef(0);
  const finishInProgress = useRef(false);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setPhase(null);
      setMeasurements([]);
      setLoading(false);
      return;
    }

    try {
      const found = await getPhaseById(db, numericId);
      const items = found ? await getMeasurementsInPhase(db, found) : [];
      if (currentRequest !== requestId.current) return;
      setPhase(found);
      setMeasurements(items);
    } catch {
      if (currentRequest === requestId.current) setError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => { requestId.current += 1; };
    }, [load]),
  );

  async function finishPhase() {
    if (!phase || finishInProgress.current) return;
    const endedAt = new Date().toISOString();
    if (phase.startedAt >= endedAt || (phase.endedAt !== null && phase.endedAt <= endedAt)) return;
    const currentRequest = requestId.current;
    finishInProgress.current = true;
    setFinishing(true);
    try {
      await savePhase(db, { ...phase, endedAt }, phase.id);
      if (currentRequest !== requestId.current) return;
      setPhase({ ...phase, endedAt });
      setFinished(true);
    } catch {
      if (currentRequest === requestId.current) {
        Alert.alert(tr('Не получилось завершить период'), tr('Попробуйте ещё раз.'));
      }
    } finally {
      finishInProgress.current = false;
      setFinishing(false);
    }
  }

  if (loading || error) {
    return (
      <ScreenShell>
        <Pressable accessibilityLabel={tr("Назад")} onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={22} color={Palette.text} />
        </Pressable>
        <DataLoadState loading={loading} error={error} onRetry={() => void load()} label={tr("период")} />
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
          <Text style={styles.notFoundTitle}>{tr("Период не найден")}</Text>
          <Text style={styles.notFoundText}>{tr("Возможно, он уже удалён.")}</Text>
        </View>
      </ScreenShell>
    );
  }

  const info = phaseKindInfo(phase.kind);
  const hasData = measurements.length > 0;
  const stats = measurementStats(measurements);
  const now = Date.now();
  const canFinish = Date.parse(phase.startedAt) < now &&
    (phase.endedAt === null || Date.parse(phase.endedAt) > now);

  return (
    <ScreenShell contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={tr("Назад")}
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
          accessibilityLabel={tr("Изменить период")}
          disabled={finishing}
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
            <Text style={styles.liveChipText}>{tr("идёт сейчас")}</Text>
          </View>
        ) : null}
        <Text style={styles.countText}>{pluralRecords(measurements.length)}</Text>
      </View>

      {canFinish ? (
        <Pressable
          accessibilityRole="button"
          disabled={finishing}
          onPress={() => void finishPhase()}
          style={[styles.finishButton, finishing && styles.finishDisabled]}>
          <IconSymbol name="checkmark" size={18} color={Palette.coral} />
          <Text style={styles.finishText}>{finishing ? tr('Завершаем…') : tr('Завершить период')}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionLabel}>{tr("СРЕДНЕЕ ЗА ПЕРИОД")}</Text>
      <GlassCard contentStyle={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: Palette.coralSoft }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.systolic : '—'}
            </Text>
            <Text style={styles.statLabel}>{tr("Систолическое")}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: Palette.orangeSoft }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.diastolic : '—'}
            </Text>
            <Text style={styles.statLabel}>{tr("Диастолическое")}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {hasData ? stats.pulse : '—'}
            </Text>
            <Text style={styles.statLabel}>{tr("Пульс")}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FFF8E9' }]}>
            <Text style={styles.statValue}>
              {hasData ? stats.wellbeing : '—'}
            </Text>
            <Text style={styles.statLabel}>{tr("Самочувствие")}</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionLabel}>{tr("ДИНАМИКА ВНУТРИ ПЕРИОДА")}</Text>
      <GlassCard contentStyle={styles.chartCard}>
        <WeeklyChart measurements={measurements} />
      </GlassCard>

      {phase.note ? (
        <>
          <Text style={styles.sectionLabel}>{tr("ЗАМЕТКА")}</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{phase.note}</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>{tr("ИЗМЕРЕНИЯ ПЕРИОДА")}</Text>
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
        <Text style={styles.emptyText}>{tr("В этот период измерений пока нет.")}</Text>
      ) : null}
      <SaveSuccessOverlay
        visible={finished}
        title={tr("Период завершён")}
        subtitle={tr("Дата завершения сохранена")}
        onDone={() => { setFinished(false); void load(); }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 24,
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
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  finishText: {
    color: Palette.coral,
    fontSize: 14,
    fontWeight: '500',
  },
  finishDisabled: {
    opacity: 0.5,
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
