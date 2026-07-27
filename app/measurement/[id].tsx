import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { getMeasurementById } from '@/data/database';
import type { MeasurementDetails } from '@/types/measurement';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function MeasurementDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [measurement, setMeasurement] = useState<MeasurementDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      setLoading(false);
      return;
    }

    getMeasurementById(db, numericId)
      .then(setMeasurement)
      .finally(() => setLoading(false));
  }, [db, id]);

  if (loading) {
    return (
      <ScreenShell>
        <Text style={styles.loading}>Загружаем измерение…</Text>
      </ScreenShell>
    );
  }

  if (!measurement) {
    return (
      <ScreenShell>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={22} color={Palette.text} />
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Измерение не найдено</Text>
          <Text style={styles.notFoundText}>Возможно, запись уже была удалена.</Text>
        </View>
      </ScreenShell>
    );
  }

  const isSeries = measurement.readingCount > 1;

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
          <Text style={styles.title}>{isSeries ? 'Серия измерений' : 'Измерение'}</Text>
          <Text style={styles.subtitle}>{formatDate(measurement.measuredAt)}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.sectionLabel}>{isSeries ? 'СРЕДНИЕ ЗНАЧЕНИЯ' : 'ПОКАЗАТЕЛИ'}</Text>
      <GlassCard contentStyle={styles.summaryCard}>
        <View style={styles.pressureRow}>
          <View style={styles.largeMetric}>
            <View style={styles.metricIcon}>
              <IconSymbol name="arrow.up.circle" size={21} color={Palette.coral} />
            </View>
            <Text style={styles.metricValue}>{measurement.systolic}</Text>
            <Text style={styles.metricLabel}>Систолическое</Text>
            <Text style={styles.metricUnit}>мм рт. ст.</Text>
          </View>
          <View style={[styles.largeMetric, styles.orangeMetric]}>
            <View style={styles.metricIcon}>
              <IconSymbol name="arrow.down.circle" size={21} color={Palette.orange} />
            </View>
            <Text style={styles.metricValue}>{measurement.diastolic}</Text>
            <Text style={styles.metricLabel}>Диастолическое</Text>
            <Text style={styles.metricUnit}>мм рт. ст.</Text>
          </View>
        </View>
        <View style={styles.pulseRow}>
          <IconSymbol name="waveform.path.ecg" size={22} color="#6D78A8" />
          <Text style={styles.pulseValue}>{measurement.pulse}</Text>
          <Text style={styles.pulseUnit}>уд/мин</Text>
        </View>
      </GlassCard>

      {isSeries ? (
        <>
          <Text style={styles.sectionLabel}>ЗАМЕРЫ СЕРИИ</Text>
          <View style={styles.readingsCard}>
            {measurement.readings.map((reading, index) => (
              <View
                key={`${index}-${reading.systolic}`}
                style={[styles.readingBlock, index > 0 && styles.readingDivider]}>
                <View style={styles.readingIndex}>
                  <Text style={styles.readingIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.readingMetric}>
                  <Text style={styles.readingValue}>{reading.systolic}</Text>
                  <Text style={styles.readingLabel}>Сист.</Text>
                </View>
                <View style={styles.readingMetric}>
                  <Text style={styles.readingValue}>{reading.diastolic}</Text>
                  <Text style={styles.readingLabel}>Диаст.</Text>
                </View>
                <View style={styles.readingMetric}>
                  <Text style={styles.readingValue}>{reading.pulse}</Text>
                  <Text style={styles.readingLabel}>Пульс</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>САМОЧУВСТВИЕ</Text>
      <GlassCard contentStyle={styles.wellbeingCard}>
        <View>
          <Text style={styles.wellbeingTitle}>Самочувствие</Text>
          <Text style={styles.wellbeingSubtitle}>Оценка во время измерения</Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{measurement.wellbeing}</Text>
          <Text style={styles.scoreTotal}>/10</Text>
        </View>
      </GlassCard>

      {measurement.tags.length > 0 ? (
        <View style={styles.tags}>
          {measurement.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>ЗАМЕТКА</Text>
      <View style={styles.noteCard}>
        <Text style={[styles.noteText, !measurement.note && styles.noteEmpty]}>
          {measurement.note || 'Заметка не добавлена'}
        </Text>
      </View>
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
    marginBottom: Spacing.lg,
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
  headerSpacer: {
    width: 42,
  },
  title: {
    color: Palette.text,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 3,
  },
  sectionLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 4,
  },
  summaryCard: {
    padding: 12,
    marginBottom: Spacing.xl,
  },
  pressureRow: {
    flexDirection: 'row',
    gap: 10,
  },
  largeMetric: {
    flex: 1,
    minHeight: 154,
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  orangeMetric: {
    backgroundColor: Palette.orangeSoft,
  },
  metricIcon: {
    alignSelf: 'flex-start',
  },
  metricValue: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  metricUnit: {
    color: Palette.muted,
    fontSize: 10,
  },
  pulseRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    marginTop: 10,
    borderRadius: Radius.medium,
    backgroundColor: '#F1F2F6',
  },
  pulseValue: {
    color: Palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  pulseUnit: {
    color: Palette.muted,
    fontSize: 12,
  },
  readingsCard: {
    overflow: 'hidden',
    paddingVertical: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.large,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  readingBlock: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 14,
  },
  readingDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  readingIndex: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Palette.coralSoft,
  },
  readingIndexText: {
    color: Palette.coral,
    fontSize: 12,
    fontWeight: '700',
  },
  readingMetric: {
    flex: 1,
  },
  readingValue: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  readingLabel: {
    color: Palette.muted,
    fontSize: 9,
    marginTop: 2,
  },
  wellbeingCard: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  wellbeingTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  wellbeingSubtitle: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 4,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    color: Palette.coral,
    fontSize: 32,
    fontWeight: '700',
  },
  scoreTotal: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: Spacing.xl,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.coralSoft,
  },
  tagText: {
    color: Palette.coral,
    fontSize: 12,
    fontWeight: '600',
  },
  noteCard: {
    minHeight: 100,
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
  noteEmpty: {
    color: Palette.subtle,
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
