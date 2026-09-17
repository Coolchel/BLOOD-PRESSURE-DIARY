import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Spacing } from '@/constants/design';
import { DEFAULT_HISTORY_FILTERS, HISTORY_SORTS, startOfDay } from '@/constants/history-filters';
import type { HistoryFilterState } from '@/constants/history-filters';

type Props = {
  visible: boolean;
  value: HistoryFilterState;
  onApply: (value: HistoryFilterState) => void;
  onClose: () => void;
};

export function HistoryFilters({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [picker, setPicker] = useState<'startDate' | 'endDate' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPicker(null);
    }
  }, [visible, value]);

  function chooseDate(target: 'startDate' | 'endDate') {
    setPickerDate(draft[target] ?? draft.startDate ?? draft.endDate ?? new Date());
    setPicker(target);
  }

  function acceptDate(date: Date) {
    if (picker) setDraft((current) => ({ ...current, [picker]: startOfDay(date) }));
    setPicker(null);
  }

  function apply() {
    if (draft.startDate && draft.endDate && startOfDay(draft.startDate) > startOfDay(draft.endDate)) {
      Alert.alert('Проверь период', 'Дата начала должна быть раньше даты окончания или совпадать с ней.');
      return;
    }
    onApply(draft);
  }

  const dateLabel = (date: Date | null, fallback: string) => date
    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
    : fallback;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityLabel="Закрыть фильтры" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Фильтры истории</Text>
            <Pressable accessibilityLabel="Закрыть фильтры" hitSlop={12} onPress={onClose}>
              <IconSymbol name="xmark" size={21} color={Palette.muted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Период измерений</Text>
            <View style={styles.dates}>
              <Pressable accessibilityRole="button" accessibilityLabel="Начало периода" onPress={() => chooseDate('startDate')} style={styles.date}>
                <Text style={styles.dateCaption}>С даты</Text>
                <Text style={styles.dateText}>{dateLabel(draft.startDate, 'Любая дата')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Окончание периода" onPress={() => chooseDate('endDate')} style={styles.date}>
                <Text style={styles.dateCaption}>По дату включительно</Text>
                <Text style={styles.dateText}>{dateLabel(draft.endDate, 'Любая дата')}</Text>
              </Pressable>
            </View>
            {draft.startDate || draft.endDate ? (
              <Pressable accessibilityRole="button" onPress={() => { setPicker(null); setDraft((current) => ({ ...current, startDate: null, endDate: null })); }}>
                <Text style={styles.link}>Все даты</Text>
              </Pressable>
            ) : null}

            {picker ? (
              <View style={styles.picker}>
                <Text style={styles.dateCaption}>{picker === 'startDate' ? 'Начало периода' : 'Окончание периода'}</Text>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  locale="ru-RU"
                  textColor={Palette.text}
                  themeVariant="light"
                  onChange={(event, date) => {
                    if (Platform.OS === 'ios') {
                      if (date) setPickerDate(date);
                    } else if (event.type !== 'dismissed' && date) {
                      acceptDate(date);
                    } else {
                      setPicker(null);
                    }
                  }}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable accessibilityRole="button" onPress={() => acceptDate(pickerDate)}>
                    <Text style={styles.link}>Готово</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Порядок записей</Text>
            {HISTORY_SORTS.map((sort) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.sort === sort.key }}
                key={sort.key}
                onPress={() => setDraft((current) => ({ ...current, sort: sort.key }))}
                style={[styles.sortRow, draft.sort === sort.key && styles.selected]}>
                <Text style={[styles.sortText, draft.sort === sort.key && styles.selectedText]}>{sort.label}</Text>
                {draft.sort === sort.key ? <IconSymbol name="checkmark" size={18} color={Palette.coral} /> : null}
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={() => { setPicker(null); setDraft(DEFAULT_HISTORY_FILTERS); }} style={styles.reset}>
              <Text style={styles.link}>Сбросить</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => picker ? acceptDate(pickerDate) : apply()} style={styles.apply}>
              <Text style={styles.applyText}>{picker ? 'Выбрать дату' : 'Применить'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,32,47,0.3)' },
  sheet: { maxHeight: '95%', backgroundColor: Palette.white, borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, paddingTop: Spacing.lg, paddingHorizontal: Spacing.screen },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { color: Palette.text, fontSize: 22, fontWeight: '700' },
  content: { paddingBottom: Spacing.sm },
  sectionTitle: { color: Palette.text, fontSize: 16, fontWeight: '600', marginTop: Spacing.sm, marginBottom: 12 },
  dates: { flexDirection: 'row', gap: Spacing.sm },
  date: { flex: 1, borderRadius: Radius.small, backgroundColor: Palette.background, padding: 12, minHeight: 65 },
  dateCaption: { color: Palette.muted, fontSize: 11 },
  dateText: { color: Palette.text, fontSize: 14, fontWeight: '600', marginTop: 6 },
  picker: { marginTop: Spacing.sm },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.small },
  sortText: { flex: 1, color: Palette.text, fontSize: 13, lineHeight: 18 },
  selected: { backgroundColor: Palette.coralSoft },
  selectedText: { color: Palette.coral, fontWeight: '600' },
  link: { color: Palette.coral, fontSize: 14, fontWeight: '600', paddingVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  reset: { paddingHorizontal: 8 },
  apply: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, backgroundColor: Palette.coral },
  applyText: { color: Palette.white, fontSize: 16, fontWeight: '600' },
});
