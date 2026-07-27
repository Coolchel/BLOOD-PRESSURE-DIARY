import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { MetricRow } from '@/components/metric-row';
import { NumberEntrySheet } from '@/components/number-entry-sheet';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { addMeasurement } from '@/data/database';
import type { MeasurementMode, Reading } from '@/types/measurement';
import { WELLBEING_TAGS } from '@/types/measurement';

type Metric = keyof Reading;
type CurrentReading = Partial<Reading>;

const metricConfig = {
  systolic: {
    title: 'Систолическое давление',
    unit: 'мм рт. ст.',
    min: 60,
    max: 260,
  },
  diastolic: {
    title: 'Диастолическое давление',
    unit: 'мм рт. ст.',
    min: 35,
    max: 160,
  },
  pulse: {
    title: 'Пульс',
    unit: 'уд/мин',
    min: 30,
    max: 220,
  },
} as const;

function isComplete(reading: CurrentReading): reading is Reading {
  return (
    reading.systolic !== undefined &&
    reading.diastolic !== undefined &&
    reading.pulse !== undefined
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NewMeasurementScreen() {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<MeasurementMode>('single');
  const [current, setCurrent] = useState<CurrentReading>({});
  const [series, setSeries] = useState<Reading[]>([]);
  const [activeMetric, setActiveMetric] = useState<Metric | null>(null);
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time' | null>(null);
  const [wellbeing, setWellbeing] = useState(7);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const activeConfig = activeMetric ? metricConfig[activeMetric] : undefined;
  const previewReadings = useMemo(() => {
    if (mode === 'series' && isComplete(current)) return [...series, current];
    return mode === 'series' ? series : isComplete(current) ? [current] : [];
  }, [current, mode, series]);

  function switchMode(next: MeasurementMode) {
    if (next === mode) return;
    void Haptics.selectionAsync();
    setMode(next);
    setSeries([]);
  }

  function updateMetric(value: number) {
    if (!activeMetric) return;
    const metric = activeMetric;
    setCurrent((existing) => ({ ...existing, [metric]: value }));

    if (metric === 'systolic') {
      setActiveMetric('diastolic');
    } else if (metric === 'diastolic') {
      setActiveMetric('pulse');
    } else {
      setActiveMetric(null);
    }
  }

  function addToSeries() {
    if (series.length >= 3) {
      Alert.alert('Серия уже заполнена', 'Можно сохранить среднее из трёх замеров.');
      return;
    }
    if (!isComplete(current)) {
      Alert.alert('Заполни все значения', 'Для серии нужны давление и пульс каждого замера.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSeries((items) => [...items, current]);
    setCurrent({});
    setActiveMetric(series.length + 1 >= 3 ? null : 'systolic');
  }

  function toggleTag(tag: string) {
    void Haptics.selectionAsync();
    setTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    );
  }

  function closeDatePicker() {
    setAndroidPickerMode(null);
    setDatePickerVisible(false);
  }

  async function save() {
    const readings =
      mode === 'series'
        ? isComplete(current)
          ? [...series, current]
          : series
        : isComplete(current)
          ? [current]
          : [];

    if (mode === 'single' && readings.length !== 1) {
      Alert.alert('Не хватает данных', 'Укажи систолическое, диастолическое давление и пульс.');
      return;
    }
    if (mode === 'series' && readings.length < 2) {
      Alert.alert('Нужно два замера', 'Добавь не менее двух измерений, чтобы сохранить среднее.');
      return;
    }
    if (readings.some((reading) => reading.systolic <= reading.diastolic)) {
      Alert.alert(
        'Проверь значения давления',
        'Систолическое давление должно быть выше диастолического.',
      );
      return;
    }

    try {
      setSaving(true);
      await addMeasurement(db, { measuredAt, wellbeing, tags, note, mode, readings });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Не получилось сохранить', 'Попробуй ещё раз.');
      setSaving(false);
    }
  }

  return (
    <>
      <ScreenShell contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Закрыть"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={Palette.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Новое измерение</Text>
            <Text style={styles.subtitle}>Добавь показатели тонометра</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.segment}>
          {(['single', 'series'] as const).map((item) => {
            const selected = mode === item;
            return (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => switchMode(item)}
                style={[styles.segmentItem, selected && styles.segmentSelected]}>
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {item === 'single' ? 'Один замер' : 'Серия'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ПОКАЗАТЕЛИ</Text>
        <GlassCard contentStyle={styles.metricsCard}>
          <MetricRow
            icon="arrow.up.circle"
            iconColor={Palette.coral}
            label="Систолическое"
            onPress={() => setActiveMetric('systolic')}
            unit="мм рт. ст."
            value={current.systolic}
          />
          <View style={styles.divider} />
          <MetricRow
            icon="arrow.down.circle"
            iconColor={Palette.orange}
            label="Диастолическое"
            onPress={() => setActiveMetric('diastolic')}
            unit="мм рт. ст."
            value={current.diastolic}
          />
          <View style={styles.divider} />
          <MetricRow
            icon="waveform.path.ecg"
            iconColor="#6D78A8"
            label="Пульс"
            onPress={() => setActiveMetric('pulse')}
            unit="уд/мин"
            value={current.pulse}
          />
        </GlassCard>

        {mode === 'series' ? (
          <View style={styles.seriesBlock}>
            {series.length > 0 ? (
              <View style={styles.seriesList}>
                {series.map((reading, index) => (
                  <View key={`${index}-${reading.systolic}`} style={styles.seriesItem}>
                    <Text style={styles.seriesIndex}>{index + 1}</Text>
                    <Text style={styles.seriesValue}>{reading.systolic}</Text>
                    <Text style={styles.seriesValue}>{reading.diastolic}</Text>
                    <Text style={styles.seriesPulse}>{reading.pulse} уд/мин</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Pressable
              disabled={series.length >= 3}
              onPress={addToSeries}
              style={({ pressed }) => [
                styles.seriesButton,
                series.length >= 3 && styles.seriesButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <IconSymbol name="plus" size={19} color={Palette.coral} />
              <Text style={styles.seriesButtonText}>
                {series.length >= 3 ? 'Серия заполнена' : 'Добавить замер в серию'}
              </Text>
            </Pressable>
            <Text style={styles.seriesHint}>
              Сохраним среднее из 2–3 последовательных измерений.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>ДАТА И ВРЕМЯ</Text>
        <Pressable
          onPress={() => setDatePickerVisible(true)}
          style={({ pressed }) => [styles.dateCard, pressed && styles.pressed]}>
          <View style={styles.dateIcon}>
            <IconSymbol name="calendar" size={21} color={Palette.coral} />
          </View>
          <View style={styles.dateText}>
            <Text style={styles.dateValue}>{formatDate(measuredAt)}</Text>
            <Text style={styles.dateHint}>Подставлено текущее время — можно изменить</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
        </Pressable>

        <Text style={styles.sectionLabel}>САМОЧУВСТВИЕ</Text>
        <GlassCard contentStyle={styles.wellbeingCard}>
          <View style={styles.wellbeingHeader}>
            <View>
              <Text style={styles.wellbeingTitle}>Самочувствие</Text>
              <Text style={styles.wellbeingHint}>Как ты себя чувствуешь?</Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreNumber}>{wellbeing}</Text>
              <Text style={styles.scoreTotal}>/10</Text>
            </View>
          </View>
          <Slider
            accessibilityLabel="Оценка самочувствия"
            maximumTrackTintColor="#E4E6EA"
            maximumValue={10}
            minimumTrackTintColor={Palette.coral}
            minimumValue={1}
            onSlidingComplete={() => void Haptics.selectionAsync()}
            onValueChange={(value) => setWellbeing(Math.round(value))}
            step={1}
            thumbTintColor={Palette.coral}
            value={wellbeing}
          />
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>Плохо</Text>
            <Text style={styles.scaleLabel}>Отлично</Text>
          </View>
          <View style={styles.tags}>
            {WELLBEING_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tag, selected && styles.tagSelected]}>
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>ЗАМЕТКА</Text>
        <View style={styles.noteCard}>
          <TextInput
            accessibilityLabel="Заметка к измерению"
            multiline
            onChangeText={setNote}
            placeholder="Например: после прогулки, до приёма лекарства…"
            placeholderTextColor={Palette.subtle}
            style={styles.noteInput}
            textAlignVertical="top"
            value={note}
          />
        </View>

        {mode === 'series' && previewReadings.length > 0 ? (
          <Text style={styles.readyText}>
            Готово измерений: {previewReadings.length}
            {previewReadings.length < 2 ? ' — нужен ещё один замер' : ''}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveDisabled,
            pressed && styles.pressed,
          ]}>
          <IconSymbol name="checkmark" size={21} color={Palette.white} weight="semibold" />
          <Text style={styles.saveText}>{saving ? 'Сохраняем…' : 'Сохранить измерение'}</Text>
        </Pressable>
      </ScreenShell>

      {activeMetric && activeConfig ? (
        <NumberEntrySheet
          actionLabel={activeMetric === 'pulse' ? 'Готово' : 'Далее'}
          initialValue={current[activeMetric]}
          max={activeConfig.max}
          min={activeConfig.min}
          onCancel={() => setActiveMetric(null)}
          onSubmit={updateMetric}
          title={activeConfig.title}
          unit={activeConfig.unit}
          visible
        />
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={closeDatePicker}
        transparent
        visible={datePickerVisible}>
        <View style={styles.dateModal}>
          <Pressable
            onPress={closeDatePicker}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.dateSheet}>
            <View style={styles.dateSheetHeader}>
              <Text style={styles.dateSheetTitle}>Дата и время</Text>
              <Pressable onPress={closeDatePicker}>
                <Text style={styles.dateDone}>Готово</Text>
              </Pressable>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                display="spinner"
                locale="ru-RU"
                mode="datetime"
                onChange={(_, date) => date && setMeasuredAt(date)}
                textColor={Palette.text}
                value={measuredAt}
              />
            ) : (
              <View style={styles.androidDateControls}>
                <Pressable
                  onPress={() => setAndroidPickerMode('date')}
                  style={styles.androidDateButton}>
                  <Text style={styles.androidDateLabel}>Дата</Text>
                  <Text style={styles.androidDateValue}>
                    {new Intl.DateTimeFormat('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(measuredAt)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAndroidPickerMode('time')}
                  style={styles.androidDateButton}>
                  <Text style={styles.androidDateLabel}>Время</Text>
                  <Text style={styles.androidDateValue}>
                    {new Intl.DateTimeFormat('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(measuredAt)}
                  </Text>
                </Pressable>
                {androidPickerMode ? (
                  <DateTimePicker
                    display="default"
                    mode={androidPickerMode}
                    onChange={(event, date) => {
                      setAndroidPickerMode(null);
                      if (event.type !== 'dismissed' && date) setMeasuredAt(date);
                    }}
                    value={measuredAt}
                  />
                ) : null}
              </View>
            )}
            <Pressable
              onPress={() => setMeasuredAt(new Date())}
              style={({ pressed }) => [styles.nowButton, pressed && styles.pressed]}>
              <IconSymbol name="arrow.counterclockwise" size={18} color={Palette.coral} />
              <Text style={styles.nowText}>Подставить текущее</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  headerText: {
    alignItems: 'center',
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
    fontSize: 12,
    marginTop: 3,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: Spacing.xl,
    borderRadius: 18,
    backgroundColor: 'rgba(235,237,241,0.82)',
  },
  segmentItem: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  segmentSelected: {
    backgroundColor: Palette.white,
    shadowColor: '#6B7180',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2,
  },
  segmentText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: Palette.coral,
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
  metricsCard: {
    paddingVertical: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 73,
    backgroundColor: Palette.line,
  },
  seriesBlock: {
    marginTop: 13,
    marginBottom: Spacing.md,
  },
  seriesList: {
    gap: 7,
    marginBottom: 9,
  },
  seriesItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceStrong,
  },
  seriesIndex: {
    width: 26,
    height: 26,
    color: Palette.coral,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
    borderRadius: 9,
    backgroundColor: Palette.coralSoft,
  },
  seriesValue: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  seriesPulse: {
    flex: 1,
    color: Palette.muted,
    fontSize: 12,
    textAlign: 'right',
  },
  seriesButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,94,87,0.22)',
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  seriesButtonText: {
    color: Palette.coral,
    fontSize: 14,
    fontWeight: '600',
  },
  seriesButtonDisabled: {
    opacity: 0.55,
  },
  seriesHint: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 7,
  },
  dateCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  dateIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: Palette.coralSoft,
  },
  dateText: {
    flex: 1,
    gap: 3,
  },
  dateValue: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dateHint: {
    color: Palette.muted,
    fontSize: 11,
  },
  wellbeingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  wellbeingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wellbeingTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  wellbeingHint: {
    color: Palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    color: Palette.coral,
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreTotal: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -3,
    marginBottom: 15,
  },
  scaleLabel: {
    color: Palette.subtle,
    fontSize: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: '#F0F1F4',
  },
  tagSelected: {
    backgroundColor: Palette.coralSoft,
  },
  tagText: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: Palette.coral,
    fontWeight: '600',
  },
  noteCard: {
    minHeight: 116,
    marginBottom: Spacing.lg,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  noteInput: {
    minHeight: 116,
    color: Palette.text,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  readyText: {
    color: Palette.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  saveButton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coral,
    ...Shadow.button,
  },
  saveDisabled: {
    opacity: 0.58,
  },
  saveText: {
    color: Palette.white,
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  dateModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24,32,47,0.24)',
  },
  dateSheet: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: 38,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: Palette.white,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateSheetTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  dateDone: {
    color: Palette.coral,
    fontSize: 16,
    fontWeight: '600',
  },
  nowButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  nowText: {
    color: Palette.coral,
    fontSize: 14,
    fontWeight: '600',
  },
  androidDateControls: {
    gap: 9,
    paddingVertical: 18,
  },
  androidDateButton: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.medium,
    backgroundColor: '#F2F3F6',
  },
  androidDateLabel: {
    color: Palette.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  androidDateValue: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
