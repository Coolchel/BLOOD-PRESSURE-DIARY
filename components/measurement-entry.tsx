import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass-card';
import { MetricRow } from '@/components/metric-row';
import { NumberEntrySheet } from '@/components/number-entry-sheet';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import type { MeasurementEntryDraft } from '@/constants/measurement-entry';
import { isEntryComplete, isEntryValid } from '@/constants/measurement-entry';
import type { Reading } from '@/types/measurement';

const METRICS = {
  systolic: { title: 'Систолическое давление', label: 'Систолическое', unit: 'мм рт. ст.', min: 60, max: 260, icon: 'arrow.up.circle', color: Palette.coral },
  diastolic: { title: 'Диастолическое давление', label: 'Диастолическое', unit: 'мм рт. ст.', min: 35, max: 160, icon: 'arrow.down.circle', color: Palette.orange },
  pulse: { title: 'Пульс', label: 'Пульс', unit: 'уд/мин', min: 30, max: 220, icon: 'waveform.path.ecg', color: '#6D78A8' },
} as const;
const METRIC_KEYS: (keyof Reading)[] = ['systolic', 'diastolic', 'pulse'];

function formatMoment(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

type Props = { value: MeasurementEntryDraft; onChange: (value: MeasurementEntryDraft) => void; disabled?: boolean };

export function MeasurementEntry({ value, onChange, disabled }: Props) {
  const insets = useSafeAreaInsets();
  const [metric, setMetric] = useState<keyof Reading | null>(null);
  const [dateVisible, setDateVisible] = useState(false);
  const [androidMode, setAndroidMode] = useState<'date' | 'time' | null>(null);
  const active = metric ? METRICS[metric] : null;

  function updateMetric(number: number) {
    if (!metric || disabled) return;
    onChange({ ...value, values: { ...value.values, [metric]: number } });
    setMetric(metric === 'systolic' ? 'diastolic' : metric === 'diastolic' ? 'pulse' : null);
  }

  function closeDate() { setAndroidMode(null); setDateVisible(false); }
  function updateDate(date: Date) { if (!disabled) onChange({ ...value, measuredAt: date }); }

  return (
    <>
      <Text style={styles.label}>ПОКАЗАТЕЛИ</Text>
      <GlassCard contentStyle={styles.metrics}>
        {METRIC_KEYS.map((key, index) => (
          <View key={key}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <MetricRow
              disabled={disabled}
              icon={METRICS[key].icon}
              iconColor={METRICS[key].color}
              label={METRICS[key].label}
              unit={METRICS[key].unit}
              value={value.values[key]}
              onPress={() => setMetric(key)}
            />
          </View>
        ))}
      </GlassCard>
      {isEntryComplete(value) && !isEntryValid(value) ? <Text style={styles.error}>Проверь давление: систолическое должно быть выше диастолического.</Text> : null}

      <Text style={[styles.label, styles.dateLabel]}>ДАТА И ВРЕМЯ</Text>
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Дата и время: ${formatMoment(value.measuredAt)}`} onPress={() => setDateVisible(true)} style={styles.dateCard}>
        <View style={styles.dateIcon}><IconSymbol name="calendar" size={21} color={Palette.coral} /></View>
        <View style={styles.dateCopy}>
          <Text style={styles.dateValue}>{formatMoment(value.measuredAt)}</Text>
          <Text style={styles.dateHint}>Можно изменить дату и время этого замера</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
      </Pressable>

      {metric && active ? (
        <NumberEntrySheet visible title={active.title} unit={active.unit} initialValue={value.values[metric]} min={active.min} max={active.max} actionLabel={metric === 'pulse' ? 'Готово' : 'Далее'} onSubmit={updateMetric} onCancel={() => setMetric(null)} />
      ) : null}

      <Modal visible={dateVisible} transparent animationType="fade" onRequestClose={closeDate}>
        <View style={styles.dateOverlay}>
          <Pressable accessibilityLabel="Закрыть выбор даты" style={StyleSheet.absoluteFill} onPress={closeDate} />
          <View style={[styles.dateSheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>Дата и время замера</Text>
              <Pressable accessibilityRole="button" hitSlop={10} onPress={closeDate}><Text style={styles.link}>Готово</Text></Pressable>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker value={value.measuredAt} display="spinner" locale="ru-RU" mode="datetime" themeVariant="light" textColor={Palette.text} onChange={(_, date) => date && updateDate(date)} />
            ) : (
              <View>
                <View style={styles.androidButtons}>
                  <Pressable accessibilityRole="button" onPress={() => setAndroidMode('date')} style={styles.androidButton}><Text style={styles.link}>Изменить дату</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setAndroidMode('time')} style={styles.androidButton}><Text style={styles.link}>Изменить время</Text></Pressable>
                </View>
                <Text style={styles.dateValue}>{formatMoment(value.measuredAt)}</Text>
                {androidMode ? <DateTimePicker value={value.measuredAt} display="default" mode={androidMode} onChange={(event, date) => { setAndroidMode(null); if (event.type !== 'dismissed' && date) updateDate(date); }} /> : null}
              </View>
            )}
            <Pressable accessibilityRole="button" onPress={() => updateDate(new Date())}><Text style={styles.link}>Подставить текущее время</Text></Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: Palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginLeft: 4, marginBottom: 10 },
  metrics: { paddingVertical: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 73, backgroundColor: Palette.line },
  dateLabel: { marginTop: Spacing.lg },
  dateCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: Spacing.md, borderRadius: Radius.medium, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surfaceStrong, ...Shadow.card },
  dateIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, backgroundColor: Palette.coralSoft },
  dateCopy: { flex: 1, paddingVertical: 12 },
  dateValue: { color: Palette.text, fontSize: 14, fontWeight: '600' },
  dateHint: { color: Palette.muted, fontSize: 11, marginTop: 4 },
  error: { color: '#D93D43', fontSize: 12, marginTop: 8 },
  dateOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,32,47,0.3)' },
  dateSheet: { backgroundColor: Palette.white, borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, padding: Spacing.screen },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTitle: { color: Palette.text, fontSize: 18, fontWeight: '600' },
  link: { color: Palette.coral, fontSize: 14, fontWeight: '600', paddingVertical: 12 },
  androidButtons: { flexDirection: 'row', gap: 12 },
  androidButton: { flex: 1 },
});
