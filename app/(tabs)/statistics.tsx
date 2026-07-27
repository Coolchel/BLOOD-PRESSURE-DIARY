import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeeklyChart } from '@/components/weekly-chart';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { useMeasurements } from '@/hooks/use-measurements';

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function StatisticsScreen() {
  const { measurements } = useMeasurements(10000);
  const systolic = measurements.map((item) => item.systolic);
  const diastolic = measurements.map((item) => item.diastolic);
  const pulse = measurements.map((item) => item.pulse);
  const wellbeing = measurements.map((item) => item.wellbeing);
  const hasData = measurements.length > 0;

  return (
    <ScreenShell>
      <Text style={styles.eyebrow}>ОБЗОР ПОКАЗАТЕЛЕЙ</Text>
      <Text style={styles.title}>Статистика</Text>
      <Text style={styles.subtitle}>На основе всех сохранённых записей: {measurements.length}</Text>

      <GlassCard contentStyle={styles.chartCard} style={styles.chartSpacing}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика давления</Text>
            <Text style={styles.cardSubtitle}>Систолическое и диастолическое · все записи</Text>
          </View>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={23} color={Palette.coral} />
        </View>
        <WeeklyChart measurements={measurements} />
      </GlassCard>

      <GlassCard contentStyle={styles.chartCard} style={styles.chartSpacing}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика пульса</Text>
            <Text style={styles.cardSubtitle}>Удары в минуту · все записи</Text>
          </View>
          <IconSymbol name="waveform.path.ecg" size={23} color="#6D78A8" />
        </View>
        <WeeklyChart measurements={measurements} metric="pulse" />
      </GlassCard>

      <GlassCard contentStyle={styles.chartCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Динамика самочувствия</Text>
            <Text style={styles.cardSubtitle}>Оценка от 1 до 10 · все записи</Text>
          </View>
          <View style={styles.numberIcon}>
            <Text style={styles.numberIconText}>10</Text>
          </View>
        </View>
        <WeeklyChart measurements={measurements} metric="wellbeing" />
      </GlassCard>

      <Text style={styles.sectionTitle}>Средние значения</Text>
      <View style={styles.averageGrid}>
        <View style={[styles.averageCard, { backgroundColor: Palette.coralSoft }]}>
          <IconSymbol name="arrow.up.circle" size={22} color={Palette.coral} />
          <Text style={styles.averageValue}>{hasData ? average(systolic) : '—'}</Text>
          <Text style={styles.averageLabel}>Систолическое</Text>
          <Text style={styles.averageUnit}>мм рт. ст.</Text>
        </View>
        <View style={[styles.averageCard, { backgroundColor: Palette.orangeSoft }]}>
          <IconSymbol name="arrow.down.circle" size={22} color={Palette.orange} />
          <Text style={styles.averageValue}>{hasData ? average(diastolic) : '—'}</Text>
          <Text style={styles.averageLabel}>Диастолическое</Text>
          <Text style={styles.averageUnit}>мм рт. ст.</Text>
        </View>
        <View style={styles.averageCard}>
          <IconSymbol name="waveform.path.ecg" size={22} color="#6D78A8" />
          <Text style={styles.averageValue}>{hasData ? average(pulse) : '—'}</Text>
          <Text style={styles.averageLabel}>Пульс</Text>
          <Text style={styles.averageUnit}>уд/мин</Text>
        </View>
        <View style={[styles.averageCard, { backgroundColor: '#FFF8E9' }]}>
          <View style={styles.numberIcon}>
            <Text style={styles.numberIconText}>10</Text>
          </View>
          <Text style={styles.averageValue}>{hasData ? average(wellbeing) : '—'}</Text>
          <Text style={styles.averageLabel}>Самочувствие</Text>
          <Text style={styles.averageUnit}>из 10</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Диапазон</Text>
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
    marginBottom: Spacing.lg,
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
