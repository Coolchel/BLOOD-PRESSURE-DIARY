import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { usePhaseList } from '@/hooks/use-phases';
import { findPhaseFor, phaseKindInfo } from '@/types/experiment';
import { runAutoBackup } from '@/data/auto-backup';
import { getMeasurementById, updateMeasurementNote } from '@/data/database';
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
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const phases = usePhaseList();

  function startEditingNote(current: MeasurementDetails) {
    void Haptics.selectionAsync();
    setNoteDraft(current.note);
    setEditingNote(true);
  }

  async function saveNote(current: MeasurementDetails) {
    try {
      setSavingNote(true);
      await updateMeasurementNote(db, current.id, noteDraft);
      setMeasurement({ ...current, note: noteDraft.trim() });
      setEditingNote(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void runAutoBackup(db);
    } catch {
      Alert.alert('Не получилось сохранить заметку', 'Попробуй ещё раз.');
    } finally {
      setSavingNote(false);
    }
  }

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

      {(() => {
        const phase = findPhaseFor(measurement.measuredAt, phases);
        if (!phase) return null;
        const info = phaseKindInfo(phase.kind);
        return (
          <View style={[styles.phaseChip, { backgroundColor: info.soft }]}>
            <View style={[styles.phaseDot, { backgroundColor: info.color }]} />
            <Text style={[styles.phaseChipText, { color: info.color }]}>
              Период: {phase.title}
            </Text>
          </View>
        );
      })()}

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
                <View style={styles.readingDateBlock}>
                  <View style={styles.readingIndex}>
                    <Text style={styles.readingIndexText}>{index + 1}</Text>
                  </View>
                  {reading.measuredAt ? <Text style={styles.readingDate}>{formatDate(reading.measuredAt)}</Text> : null}
                </View>
                <View style={styles.readingMetrics}>
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

      <View style={styles.noteHeader}>
        <Text style={[styles.sectionLabel, styles.noteLabel]}>ЗАМЕТКА</Text>
        {editingNote ? null : (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => startEditingNote(measurement)}
            style={({ pressed }) => [styles.noteEdit, pressed && styles.notePressed]}>
            <IconSymbol name="square.and.pencil" size={15} color={Palette.coral} />
            <Text style={styles.noteEditText}>
              {measurement.note ? 'Изменить' : 'Добавить'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.noteCard}>
        {editingNote ? (
          <>
            <TextInput
              accessibilityLabel="Заметка к измерению"
              autoFocus
              multiline
              onChangeText={setNoteDraft}
              placeholder="Например: после прогулки, до приёма лекарства…"
              placeholderTextColor={Palette.subtle}
              style={styles.noteInput}
              textAlignVertical="top"
              value={noteDraft}
            />
            <View style={styles.noteActions}>
              <Pressable
                onPress={() => setEditingNote(false)}
                style={({ pressed }) => [styles.noteButton, pressed && styles.notePressed]}>
                <Text style={styles.noteCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                disabled={savingNote}
                onPress={() => void saveNote(measurement)}
                style={({ pressed }) => [
                  styles.noteButton,
                  styles.noteSaveButton,
                  pressed && styles.notePressed,
                ]}>
                <Text style={styles.noteSaveText}>
                  {savingNote ? 'Сохраняем…' : 'Сохранить'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={[styles.noteText, !measurement.note && styles.noteEmpty]}>
            {measurement.note || 'Заметка не добавлена'}
          </Text>
        )}
      </View>
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
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  readingDateBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readingDate: { flex: 1, color: Palette.muted, fontSize: 11, lineHeight: 16 },
  readingMetrics: { flexDirection: 'row', gap: 14 },
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
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: Spacing.md,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: 10,
  },
  noteLabel: {
    marginBottom: 0,
  },
  noteEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.coralSoft,
  },
  noteEditText: {
    color: Palette.coral,
    fontSize: 12,
    fontWeight: '700',
  },
  notePressed: {
    opacity: 0.75,
  },
  noteInput: {
    minHeight: 96,
    color: Palette.text,
    fontSize: 14,
    lineHeight: 21,
    padding: 0,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: Spacing.md,
  },
  noteButton: {
    minWidth: 104,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.small,
    backgroundColor: '#F1F2F6',
  },
  noteSaveButton: {
    backgroundColor: Palette.coral,
  },
  noteCancelText: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  noteSaveText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
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
