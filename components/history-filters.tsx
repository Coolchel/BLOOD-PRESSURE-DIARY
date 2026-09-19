import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { DEFAULT_HISTORY_FILTERS, startOfDay } from '@/constants/history-filters';
import type { HistoryFilterState } from '@/constants/history-filters';
import type { MeasurementSort } from '@/types/measurement';

type Props = {
  visible: boolean;
  value: HistoryFilterState;
  onApply: (value: HistoryFilterState) => void;
  onClose: () => void;
};

type FilterPage = 'main' | 'period' | 'metric' | 'direction';
type SortMetric = 'date' | 'systolic' | 'diastolic' | 'pulse';
type SortDirection = 'first' | 'second';

const SORT_METRICS: { key: SortMetric; label: string }[] = [
  { key: 'date', label: 'Дата измерения' },
  { key: 'systolic', label: 'Систолическое давление' },
  { key: 'diastolic', label: 'Диастолическое давление' },
  { key: 'pulse', label: 'Пульс' },
];

function splitSort(sort: MeasurementSort): { metric: SortMetric; direction: SortDirection } {
  if (sort === 'newest') return { metric: 'date', direction: 'first' };
  if (sort === 'oldest') return { metric: 'date', direction: 'second' };
  const [metric, order] = sort.split('-') as [Exclude<SortMetric, 'date'>, 'asc' | 'desc'];
  return { metric, direction: order === 'desc' ? 'first' : 'second' };
}

function combineSort(metric: SortMetric, direction: SortDirection): MeasurementSort {
  if (metric === 'date') return direction === 'first' ? 'newest' : 'oldest';
  return `${metric}-${direction === 'first' ? 'desc' : 'asc'}`;
}

function metricLabel(metric: SortMetric) {
  return SORT_METRICS.find((item) => item.key === metric)?.label ?? 'Дата измерения';
}

function directionOptions(metric: SortMetric) {
  return metric === 'date'
    ? [{ key: 'first' as const, label: 'Сначала новые' }, { key: 'second' as const, label: 'Сначала старые' }]
    : [{ key: 'first' as const, label: 'Сначала большие значения' }, { key: 'second' as const, label: 'Сначала меньшие значения' }];
}

function SettingsRow({ title, value, onPress, last = false }: {
  title: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, last && styles.lastRow, pressed && styles.rowPressed]}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.rowValue}>{value}</Text>
      <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
    </Pressable>
  );
}

function ChoiceRow({ label, selected, onPress, last = false }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceRow, last && styles.lastRow, pressed && styles.rowPressed]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      {selected ? <IconSymbol name="checkmark" size={19} color={Palette.coral} weight="semibold" /> : <View style={styles.checkSpace} />}
    </Pressable>
  );
}

export function HistoryFilters({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<FilterPage>('main');
  const [dateTarget, setDateTarget] = useState<'startDate' | 'endDate' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const { metric, direction } = splitSort(draft.sort);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
      setDateTarget(null);
    }
  }, [visible, value]);

  function chooseDate(target: 'startDate' | 'endDate') {
    setPickerDate(draft[target] ?? draft.startDate ?? draft.endDate ?? new Date());
    setDateTarget(target);
  }

  function acceptDate(date: Date) {
    if (dateTarget) setDraft((current) => ({ ...current, [dateTarget]: startOfDay(date) }));
    setDateTarget(null);
  }

  function selectMetric(nextMetric: SortMetric) {
    void Haptics.selectionAsync();
    setDraft((current) => ({ ...current, sort: combineSort(nextMetric, splitSort(current.sort).direction) }));
  }

  function selectDirection(nextDirection: SortDirection) {
    void Haptics.selectionAsync();
    setDraft((current) => ({ ...current, sort: combineSort(splitSort(current.sort).metric, nextDirection) }));
  }

  function apply() {
    if (draft.startDate && draft.endDate && startOfDay(draft.startDate) > startOfDay(draft.endDate)) {
      Alert.alert('Проверь период', 'Дата начала должна быть раньше даты окончания или совпадать с ней.');
      return;
    }
    onApply(draft);
  }

  const formatDate = (date: Date) => new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
  const periodValue = draft.startDate && draft.endDate
    ? `${formatDate(draft.startDate)} — ${formatDate(draft.endDate)}`
    : draft.startDate ? `С ${formatDate(draft.startDate)}`
    : draft.endDate ? `По ${formatDate(draft.endDate)}` : 'Все даты';
  const directions = directionOptions(metric);

  const titles: Record<FilterPage, string> = {
    main: 'Фильтры истории',
    period: 'Период измерений',
    metric: 'Сортировать по',
    direction: 'Показывать сначала',
  };

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={page === 'main' ? onClose : () => setPage('main')}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityLabel="Закрыть фильтры" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            {page === 'main' ? <View style={styles.headerSide} /> : (
              <Pressable accessibilityLabel="Назад" hitSlop={10} onPress={() => { setDateTarget(null); setPage('main'); }} style={styles.headerButton}>
                <IconSymbol name="chevron.left" size={23} color={Palette.text} />
              </Pressable>
            )}
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{titles[page]}</Text>
              {page === 'main' ? <Text style={styles.subtitle}>Период и порядок записей</Text> : null}
            </View>
            {page === 'main' ? (
              <Pressable accessibilityLabel="Закрыть фильтры" hitSlop={10} onPress={onClose} style={styles.headerButton}>
                <IconSymbol name="xmark" size={21} color={Palette.muted} />
              </Pressable>
            ) : <View style={styles.headerSide} />}
          </View>

          {page === 'main' ? (
            <>
              <Text style={styles.sectionTitle}>Параметры</Text>
              <View style={styles.group}>
                <SettingsRow title="Период измерений" value={periodValue} onPress={() => setPage('period')} />
                <SettingsRow title="Сортировать по" value={metricLabel(metric)} onPress={() => setPage('metric')} />
                <SettingsRow title="Показывать сначала" value={directions.find((item) => item.key === direction)?.label ?? ''} onPress={() => setPage('direction')} last />
              </View>
              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setDateTarget(null); setDraft(DEFAULT_HISTORY_FILTERS); }}
                  style={({ pressed }) => [styles.reset, pressed && styles.buttonPressed]}>
                  <Text style={styles.resetText}>Сбросить</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={apply}
                  style={({ pressed }) => [styles.apply, pressed && styles.buttonPressed]}>
                  <Text style={styles.applyText}>Применить</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {page === 'metric' ? (
            <View style={styles.group}>
              {SORT_METRICS.map((item, index) => (
                <ChoiceRow key={item.key} label={item.label} selected={metric === item.key} onPress={() => selectMetric(item.key)} last={index === SORT_METRICS.length - 1} />
              ))}
            </View>
          ) : null}

          {page === 'direction' ? (
            <View style={styles.group}>
              {directions.map((item, index) => (
                <ChoiceRow key={item.key} label={item.label} selected={direction === item.key} onPress={() => selectDirection(item.key)} last={index === directions.length - 1} />
              ))}
            </View>
          ) : null}

          {page === 'period' ? (
            <>
              <View style={styles.dates}>
                <Pressable accessibilityRole="button" onPress={() => chooseDate('startDate')} style={styles.date}>
                  <Text style={styles.dateCaption}>С даты</Text>
                  <Text style={styles.dateText}>{draft.startDate ? formatDate(draft.startDate) : 'Любая дата'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => chooseDate('endDate')} style={styles.date}>
                  <Text style={styles.dateCaption}>По дату включительно</Text>
                  <Text style={styles.dateText}>{draft.endDate ? formatDate(draft.endDate) : 'Любая дата'}</Text>
                </Pressable>
              </View>
              {draft.startDate || draft.endDate ? (
                <Pressable accessibilityRole="button" onPress={() => { setDateTarget(null); setDraft((current) => ({ ...current, startDate: null, endDate: null })); }} style={styles.clearPeriod}>
                  <Text style={styles.clearPeriodText}>Очистить период</Text>
                </Pressable>
              ) : null}
              {dateTarget && Platform.OS === 'ios' ? (
                <View style={styles.datePicker}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    locale="ru-RU"
                    textColor={Palette.text}
                    themeVariant="light"
                    onChange={(_, date) => date && setPickerDate(date)}
                  />
                  <Pressable accessibilityRole="button" onPress={() => acceptDate(pickerDate)} style={styles.dateDone}>
                    <Text style={styles.dateDoneText}>Выбрать дату</Text>
                  </Pressable>
                </View>
              ) : null}
              {dateTarget && Platform.OS !== 'ios' ? (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (event.type !== 'dismissed' && date) acceptDate(date);
                    else setDateTarget(null);
                  }}
                />
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,32,47,0.38)' },
  sheet: { backgroundColor: Palette.white, borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, paddingTop: 9, paddingHorizontal: Spacing.screen },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: Palette.line, marginBottom: 13 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSide: { width: 40, height: 40 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Palette.background },
  title: { color: Palette.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Palette.muted, fontSize: 12, marginTop: 3, textAlign: 'center' },
  sectionTitle: { color: Palette.muted, fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  group: { overflow: 'hidden', borderRadius: Radius.medium, backgroundColor: Palette.background, borderWidth: 1, borderColor: Palette.line },
  settingsRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Palette.line },
  choiceRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Palette.line },
  lastRow: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: Palette.coralSoft },
  rowTitle: { flex: 1, color: Palette.text, fontSize: 14, fontWeight: '500' },
  rowValue: { maxWidth: '45%', color: Palette.muted, fontSize: 13, textAlign: 'right' },
  choiceText: { flex: 1, color: Palette.text, fontSize: 14 },
  choiceTextSelected: { color: Palette.coral, fontWeight: '600' },
  checkSpace: { width: 19 },
  footer: { flexDirection: 'row', gap: 10, paddingTop: Spacing.lg },
  reset: { flex: 0.85, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, borderWidth: 1, borderColor: 'rgba(255,94,87,0.06)', backgroundColor: Palette.coralSoft },
  resetText: { color: Palette.coral, fontSize: 15, fontWeight: '700' },
  apply: { flex: 1.25, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, backgroundColor: Palette.coral, ...Shadow.button },
  applyText: { color: Palette.white, fontSize: 16, fontWeight: '700' },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  dates: { flexDirection: 'row', gap: Spacing.sm },
  date: { flex: 1, minHeight: 74, padding: 13, borderRadius: Radius.small, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.background },
  dateCaption: { color: Palette.muted, fontSize: 11 },
  dateText: { color: Palette.text, fontSize: 14, fontWeight: '600', marginTop: 7 },
  clearPeriod: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 4, paddingVertical: 10 },
  clearPeriodText: { color: Palette.coral, fontSize: 14, fontWeight: '600' },
  datePicker: { marginTop: Spacing.sm, overflow: 'hidden', borderRadius: Radius.small, backgroundColor: Palette.background },
  dateDone: { minHeight: 46, alignItems: 'center', justifyContent: 'center', margin: 10, borderRadius: 12, backgroundColor: Palette.coral },
  dateDoneText: { color: Palette.white, fontSize: 15, fontWeight: '600' },
});
