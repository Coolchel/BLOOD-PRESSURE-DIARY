import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { MeasurementEntry } from '@/components/measurement-entry';
import { SaveSuccessOverlay } from '@/components/save-success-overlay';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { runAutoBackup } from '@/data/auto-backup';
import { addMeasurement } from '@/data/database';
import type { MeasurementMode } from '@/types/measurement';
import { emptyMeasurementEntry, isEntryComplete, isEntryValid, readingsFromEntries } from '@/constants/measurement-entry';
import type { MeasurementEntryDraft } from '@/constants/measurement-entry';
import { WELLBEING_TAGS } from '@/types/measurement';

export default function NewMeasurementScreen() {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<MeasurementMode>('single');
  const [single, setSingle] = useState<MeasurementEntryDraft>(emptyMeasurementEntry);
  const [series, setSeries] = useState<(MeasurementEntryDraft & { id: number })[]>([]);
  const nextEntryId = useRef(0);
  const [wellbeing, setWellbeing] = useState(7);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const entries = mode === 'single' ? [single] : series;
  const completedCount = entries.filter(isEntryValid).length;
  const canAddAnother = series.length < 3 && series.every(isEntryValid);

  function switchMode(next: MeasurementMode) {
    if (next === mode || saving) return;
    void Haptics.selectionAsync();
    setMode(next);
  }

  function addToSeries() {
    if (saving) return;
    if (!isEntryValid(single)) {
      Alert.alert('Проверь замер', 'Заполни давление и пульс. Систолическое должно быть выше диастолического.');
      return;
    }
    if (series.length >= 3 || !series.every(isEntryValid)) {
      Alert.alert('Проверь серию', 'Заверши добавленные замеры в разделе «Серия». В серии может быть не больше трёх замеров.');
      return;
    }
    const id = ++nextEntryId.current;
    setSeries((items) => [...items, { ...single, id }]);
    setMode('series');
    void Haptics.selectionAsync();
  }

  function addAnother() {
    if (!canAddAnother || saving) return;
    const id = ++nextEntryId.current;
    const entry = { ...emptyMeasurementEntry(), id };
    setSeries((items) => items.length < 3 && items.every(isEntryValid) ? [...items, entry] : items);
    void Haptics.selectionAsync();
  }

  function toggleTag(tag: string) {
    void Haptics.selectionAsync();
    setTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    );
  }

  async function save() {
    if (saving) return;
    if (mode === 'series' && (series.length < 2 || series.length > 3)) {
      Alert.alert('Проверь серию', 'В серии должно быть от двух до трёх замеров.');
      return;
    }
    if (entries.some((entry) => !isEntryComplete(entry))) {
      Alert.alert('Не хватает данных', 'Заполни показатели каждого добавленного замера или удали незаполненный замер.');
      return;
    }
    if (entries.some((entry) => !isEntryValid(entry))) {
      Alert.alert('Проверь значения', 'Систолическое давление должно быть выше диастолического.');
      return;
    }

    try {
      setSaving(true);
      await addMeasurement(db, { measuredAt: entries[0].measuredAt, wellbeing, tags, note, mode, readings: readingsFromEntries(entries) });
      // Копия обновляется в фоне и никогда не бросает исключение — экран её не ждёт.
      void runAutoBackup(db);
      setSaved(true);
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
                accessibilityState={{ selected, disabled: saving }}
                disabled={saving}
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

        {mode === 'single' ? (
          <>
            <MeasurementEntry value={single} onChange={setSingle} disabled={saving} />
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={addToSeries}
              style={({ pressed }) => [styles.seriesButton, styles.singleSeriesButton, pressed && styles.pressed]}>
              <IconSymbol name="plus" size={19} color={Palette.coral} />
              <Text style={styles.seriesButtonText}>Добавить в серию</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.seriesBlock}>
            {series.length === 0 ? (
              <Pressable accessibilityRole="button" disabled={saving} onPress={addAnother} style={styles.seriesButton}>
                <IconSymbol name="plus" size={19} color={Palette.coral} />
                <Text style={styles.seriesButtonText}>Добавить замер</Text>
              </Pressable>
            ) : null}
            {series.map((entry, index) => (
              <View key={entry.id} style={styles.seriesEntry}>
                <View style={styles.seriesEntryHeader}>
                  <Text style={styles.seriesEntryTitle}>Замер {index + 1}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Удалить замер ${index + 1}`}
                    disabled={saving}
                    hitSlop={10}
                    onPress={() => setSeries((items) => items.filter((item) => item.id !== entry.id))}>
                    <IconSymbol name="trash" size={20} color={Palette.muted} />
                  </Pressable>
                </View>
                <MeasurementEntry
                  value={entry}
                  disabled={saving}
                  onChange={(next) => setSeries((items) => items.map((item) => item.id === entry.id ? { ...next, id: entry.id } : item))}
                />
              </View>
            ))}
            {series.length > 0 && canAddAnother ? (
              <Pressable accessibilityRole="button" disabled={saving} onPress={addAnother} style={styles.seriesButton}>
                <IconSymbol name="plus" size={19} color={Palette.coral} />
                <Text style={styles.seriesButtonText}>Добавить ещё 1 замер</Text>
              </Pressable>
            ) : null}
            <Text style={styles.seriesHint}>
              {series.length === 3 ? 'Добавлены три замера. Заполни показатели и сохрани серию.' : 'В серии 2–3 замера. Следующий можно добавить после заполнения предыдущего.'}
            </Text>
            <Text style={styles.seriesHint}>Дата серии — дата первого замера. Самочувствие и заметка общие для серии.</Text>
          </View>
        )}

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

        {mode === 'series' && completedCount > 0 ? (
          <Text style={styles.readyText}>
            Готово измерений: {completedCount}
            {completedCount < 2 ? ' — нужен ещё один замер' : ''}
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

      <SaveSuccessOverlay
        onDone={() => router.back()}
        subtitle={mode === 'series' ? 'Серия добавлена в дневник' : 'Измерение добавлено в дневник'}
        visible={saved}
      />

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
  seriesBlock: {
    marginTop: 13,
    marginBottom: Spacing.xl,
  },
  singleSeriesButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  seriesEntry: { marginBottom: Spacing.lg },
  seriesEntryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  seriesEntryTitle: { color: Palette.text, fontSize: 18, fontWeight: '600' },
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
  seriesHint: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 7,
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
});
