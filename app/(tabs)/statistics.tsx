import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeeklyChart } from '@/components/weekly-chart';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { measurementStats } from '@/constants/measurement-stats';
import { formatPhaseRange } from '@/constants/phase-format';
import { measurementsInWindow, STATISTICS_INTERVALS, statisticsForPhase, statisticsWindow } from '@/constants/statistics-data';
import type { StatisticsInterval } from '@/constants/statistics-data';
import { useMeasurements } from '@/hooks/use-measurements';
import { usePhaseList } from '@/hooks/use-phases';
import { phaseKindInfo } from '@/types/experiment';

export default function StatisticsScreen() {
  const { measurements: allMeasurements } = useMeasurements(-1);
  const [period, setPeriod] = useState<StatisticsInterval>('week');
  const [averageMode, setAverageMode] = useState<'time' | 'phase'>('time');
  const [averagePeriod, setAveragePeriod] = useState<StatisticsInterval>('week');
  const [phaseId, setPhaseId] = useState<number | null>(null);
  const phases = usePhaseList();

  const selected = STATISTICS_INTERVALS.find((item) => item.key === period) ?? STATISTICS_INTERVALS[0];
  const { window, measurements } = useMemo(() => {
    const window = statisticsWindow(period, Date.now());
    return { window, measurements: measurementsInWindow(allMeasurements, window) };
  }, [allMeasurements, period]);
  const systolic = measurements.map((item) => item.systolic);
  const diastolic = measurements.map((item) => item.diastolic);
  const pulse = measurements.map((item) => item.pulse);
  const selectedPhase = phases.find((phase) => phase.id === phaseId) ?? phases[0] ?? null;
  const averageMeasurements = useMemo(() => measurementsInWindow(allMeasurements, statisticsWindow(averagePeriod, Date.now())), [allMeasurements, averagePeriod]);
  const stats = averageMode === 'phase'
    ? selectedPhase ? statisticsForPhase(allMeasurements, selectedPhase) : measurementStats([])
    : measurementStats(averageMeasurements);
  const averageLabel = STATISTICS_INTERVALS.find((item) => item.key === averagePeriod)?.label;
  const hasAverageData = stats.count > 0;
  const hasData = measurements.length > 0;

  return (
    <ScreenShell>
      <Text style={styles.eyebrow}>ОБЗОР ПОКАЗАТЕЛЕЙ</Text>
      <Text style={styles.title}>Статистика</Text>
      <Text style={styles.subtitle}>
        {selected.days === null
          ? `Все записи: ${measurements.length}`
          : `${selected.label} · записей: ${measurements.length} из ${allMeasurements.length}`}
      </Text>

      <View style={styles.periods}>
        {STATISTICS_INTERVALS.map((item) => {
          const active = item.key === period;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.key}
              onPress={() => {
                void Haptics.selectionAsync();
                setPeriod(item.key);
              }}
              style={[styles.periodItem, active && styles.periodItemActive]}>
              <Text style={[styles.periodText, active && styles.periodTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GlassCard contentStyle={styles.chartCard} style={styles.chartSpacing}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика давления</Text>
            <Text style={styles.cardSubtitle}>Систолическое и диастолическое</Text>
          </View>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={23} color={Palette.coral} />
        </View>
        <WeeklyChart measurements={measurements} phases={phases} window={window} />
      </GlassCard>

      <GlassCard contentStyle={styles.chartCard} style={styles.chartSpacing}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика пульса</Text>
            <Text style={styles.cardSubtitle}>Удары в минуту</Text>
          </View>
          <IconSymbol name="waveform.path.ecg" size={23} color="#6D78A8" />
        </View>
        <WeeklyChart measurements={measurements} metric="pulse" window={window} />
      </GlassCard>

      <GlassCard contentStyle={styles.chartCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика самочувствия</Text>
            <Text style={styles.cardSubtitle}>Оценка от 1 до 10</Text>
          </View>
          <View style={styles.numberIcon}>
            <Text style={styles.numberIconText}>10</Text>
          </View>
        </View>
        <WeeklyChart measurements={measurements} metric="wellbeing" window={window} />
      </GlassCard>

      <Text style={styles.sectionTitle}>Средние значения</Text>
      <View style={[styles.periods, styles.averageModes]}>
        {(['time', 'phase'] as const).map((mode) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: averageMode === mode }}
            key={mode}
            onPress={() => setAverageMode(mode)}
            style={[styles.periodItem, averageMode === mode && styles.periodItemActive]}>
            <Text style={[styles.periodText, averageMode === mode && styles.periodTextActive]}>
              {mode === 'time' ? 'По времени' : 'По периодам'}
            </Text>
          </Pressable>
        ))}
      </View>
      {averageMode === 'time' ? (
        <View style={styles.periods}>
          {STATISTICS_INTERVALS.map((item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: averagePeriod === item.key }}
              key={item.key}
              onPress={() => setAveragePeriod(item.key)}
              style={[styles.periodItem, averagePeriod === item.key && styles.periodItemActive]}>
              <Text style={[styles.periodText, averagePeriod === item.key && styles.periodTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : phases.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseChoices}>
          {phases.map((phase) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPhase?.id === phase.id }}
              key={phase.id}
              onPress={() => setPhaseId(phase.id)}
              style={[styles.phaseChoice, selectedPhase?.id === phase.id && { borderColor: phaseKindInfo(phase.kind).color }]}>
              <Text style={styles.periodTextActive}>{phase.title}</Text>
              <Text style={styles.phaseChoiceRange}>{formatPhaseRange(phase.startedAt, phase.endedAt)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : <Text style={styles.sectionCaption}>Создай период в разделе «Периоды».</Text>}
      <Text style={styles.sectionCaption}>
        {averageMode === 'time'
          ? `${averageLabel} · ${stats.count} из ${allMeasurements.length} записей`
          : selectedPhase ? `${selectedPhase.title} · весь период · ${stats.count} записей` : 'Нет периодов для расчёта'}
      </Text>
      <View style={styles.averageGrid}>
        <View style={[styles.averageCard, { backgroundColor: Palette.coralSoft }]}>
          <IconSymbol name="arrow.up.circle" size={22} color={Palette.coral} />
          <Text style={styles.averageValue}>{hasAverageData ? stats.systolic : '—'}</Text>
          <Text style={styles.averageLabel}>Систолическое</Text>
          <Text style={styles.averageUnit}>мм рт. ст.</Text>
        </View>
        <View style={[styles.averageCard, { backgroundColor: Palette.orangeSoft }]}>
          <IconSymbol name="arrow.down.circle" size={22} color={Palette.orange} />
          <Text style={styles.averageValue}>{hasAverageData ? stats.diastolic : '—'}</Text>
          <Text style={styles.averageLabel}>Диастолическое</Text>
          <Text style={styles.averageUnit}>мм рт. ст.</Text>
        </View>
        <View style={styles.averageCard}>
          <IconSymbol name="waveform.path.ecg" size={22} color="#6D78A8" />
          <Text style={styles.averageValue}>{hasAverageData ? stats.pulse : '—'}</Text>
          <Text style={styles.averageLabel}>Пульс</Text>
          <Text style={styles.averageUnit}>уд/мин</Text>
        </View>
        <View style={[styles.averageCard, { backgroundColor: '#FFF8E9' }]}>
          <View style={styles.numberIcon}>
            <Text style={styles.numberIconText}>10</Text>
          </View>
          <Text style={styles.averageValue}>{hasAverageData ? stats.wellbeing : '—'}</Text>
          <Text style={styles.averageLabel}>Самочувствие</Text>
          <Text style={styles.averageUnit}>из 10</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Диапазон</Text>
      <Text style={styles.sectionCaption}>
        {selected.label} · {measurements.length} из {allMeasurements.length} записей
      </Text>
      <GlassCard contentStyle={styles.rangeCard}>
        <View style={styles.rangeRow}>
          <View>
            <Text style={styles.rangeLabel}>Систолическое</Text>
            <Text style={styles.rangeUnit}>минимум — максимум</Text>
          </View>
          <Text style={styles.rangeValue}>
            {hasData ? `${Math.min(...systolic)} — ${Math.max(...systolic)}` : '—'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rangeRow}>
          <View>
            <Text style={styles.rangeLabel}>Диастолическое</Text>
            <Text style={styles.rangeUnit}>минимум — максимум</Text>
          </View>
          <Text style={styles.rangeValue}>
            {hasData ? `${Math.min(...diastolic)} — ${Math.max(...diastolic)}` : '—'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rangeRow}>
          <View>
            <Text style={styles.rangeLabel}>Пульс</Text>
            <Text style={styles.rangeUnit}>минимум — максимум</Text>
          </View>
          <Text style={styles.rangeValue}>
            {hasData ? `${Math.min(...pulse)} — ${Math.max(...pulse)}` : '—'}
          </Text>
        </View>
      </GlassCard>

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: Palette.coral,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  title: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.1,
    marginTop: 2,
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: Spacing.md,
  },
  periods: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(240,241,245,0.92)',
  },
  averageModes: { marginTop: 10, marginBottom: 10 },
  phaseChoices: { gap: 10, paddingBottom: 14 },
  phaseChoice: { borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.small, padding: 12, backgroundColor: Palette.white },
  phaseChoiceRange: { color: Palette.muted, fontSize: 10, marginTop: 4 },
  periodItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  periodItemActive: {
    backgroundColor: Palette.surfaceStrong,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  periodText: {
    color: Palette.muted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  periodTextActive: {
    color: Palette.text,
    fontWeight: '700',
  },
  chartCard: {
    paddingHorizontal: 14,
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },
  chartSpacing: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 3,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: Spacing.xl,
    marginBottom: 4,
  },
  sectionCaption: {
    color: Palette.muted,
    fontSize: 11.5,
    marginBottom: 12,
  },
  averageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  averageCard: {
    width: '48.5%',
    minHeight: 150,
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.large,
    backgroundColor: '#F2F3F6',
    ...Shadow.card,
  },
  averageValue: {
    color: Palette.text,
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  averageLabel: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  averageUnit: {
    color: Palette.muted,
    fontSize: 10,
  },
  numberIcon: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F4B845',
  },
  numberIconText: {
    color: Palette.white,
    fontSize: 9,
    fontWeight: '800',
  },
  rangeCard: {
    paddingVertical: 4,
  },
  rangeRow: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  rangeLabel: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rangeUnit: {
    color: Palette.muted,
    fontSize: 10,
    marginTop: 3,
  },
  rangeValue: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.md,
    backgroundColor: Palette.line,
  },
});
