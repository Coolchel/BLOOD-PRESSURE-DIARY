import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { getPhaseById, PhaseOverlapError } from '@/data/database';
import { removePhase, savePhase } from '@/data/phase-actions';
import type { PhaseKind } from '@/types/experiment';
import { PHASE_KINDS, phaseKindInfo } from '@/types/experiment';

type PickerTarget = 'start' | 'end';

function formatMoment(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function PhaseEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null && Number.isInteger(editingId);

  const [kind, setKind] = useState<PhaseKind>('clean');
  const [title, setTitle] = useState('Без всего');
  const [titleTouched, setTitleTouched] = useState(false);
  const [startedAt, setStartedAt] = useState(new Date());
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [androidMode, setAndroidMode] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!isEditing || editingId === null) return;

    getPhaseById(db, editingId)
      .then((phase) => {
        if (!phase) return;
        setKind(phase.kind);
        setTitle(phase.title);
        setTitleTouched(true);
        setStartedAt(new Date(phase.startedAt));
        setEndedAt(phase.endedAt ? new Date(phase.endedAt) : null);
        setNote(phase.note);
      })
      .finally(() => setLoading(false));
  }, [db, editingId, isEditing]);

  function chooseKind(next: PhaseKind) {
    void Haptics.selectionAsync();
    setKind(next);
    // Название подставляем, пока человек не начал править его сам.
    if (!titleTouched) setTitle(phaseKindInfo(next).label);
  }

  function applyPickedDate(date: Date) {
    if (picker === 'end') {
      setEndedAt(date);
      return;
    }
    setStartedAt(date);
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert('Нужно название', 'Назови период, чтобы отличать его в списке.');
      return;
    }
    if (endedAt && endedAt.getTime() <= startedAt.getTime()) {
      Alert.alert('Проверь даты', 'Конец периода должен быть позже начала.');
      return;
    }

    const input = {
      kind,
      title,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt ? endedAt.toISOString() : null,
      note,
    };

    try {
      setSaving(true);
      await savePhase(db, input, isEditing ? editingId : null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Не получилось сохранить', error instanceof PhaseOverlapError ? error.message : 'Попробуй ещё раз.');
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!isEditing || editingId === null) return;

    Alert.alert(
      'Удалить период?',
      'Измерения останутся на месте — исчезнет только разбиение на эксперименты.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await removePhase(db, editingId);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  }

  const pickerValue = picker === 'end' ? (endedAt ?? new Date()) : startedAt;

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
            <Text style={styles.title}>{isEditing ? 'Период' : 'Новый период'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Можно поправить даты и название' : 'Предыдущий период закроется сам'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <Text style={styles.loading}>Загружаем период…</Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ЧТО В ЭТОТ ПЕРИОД</Text>
            <View style={styles.kinds}>
              {PHASE_KINDS.map((item) => {
                const selected = item.kind === kind;
                return (
                  <Pressable
                    key={item.kind}
                    onPress={() => chooseKind(item.kind)}
                    style={[
                      styles.kind,
                      selected && { backgroundColor: item.soft, borderColor: item.color },
                    ]}>
                    <View style={[styles.kindDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.kindText, selected && { color: item.color }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.kindHint}>{phaseKindInfo(kind).hint}</Text>

            <Text style={styles.sectionLabel}>НАЗВАНИЕ</Text>
            <View style={styles.inputCard}>
              <TextInput
                accessibilityLabel="Название периода"
                onChangeText={(value) => {
                  setTitleTouched(true);
                  setTitle(value);
                }}
                placeholder="Например: Кофе, вторая попытка"
                placeholderTextColor={Palette.subtle}
                style={styles.input}
                value={title}
              />
            </View>

            <Text style={styles.sectionLabel}>НАЧАЛО</Text>
            <Pressable
              onPress={() => setPicker('start')}
              style={({ pressed }) => [styles.dateCard, pressed && styles.pressed]}>
              <View style={styles.dateIcon}>
                <IconSymbol name="calendar" size={20} color={Palette.coral} />
              </View>
              <Text style={styles.dateValue}>{formatMoment(startedAt)}</Text>
              <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
            </Pressable>

            <Text style={styles.sectionLabel}>ОКОНЧАНИЕ</Text>
            <GlassCard contentStyle={styles.finishCard}>
              <View style={styles.finishRow}>
                <View style={styles.finishText}>
                  <Text style={styles.finishTitle}>Период завершён</Text>
                  <Text style={styles.finishHint}>
                    Пока выключено, период считается текущим и не имеет конца
                  </Text>
                </View>
                <Switch
                  ios_backgroundColor="#E4E6EA"
                  onValueChange={(next) => {
                    void Haptics.selectionAsync();
                    setEndedAt(next ? new Date() : null);
                  }}
                  thumbColor={Palette.white}
                  trackColor={{ false: '#E4E6EA', true: Palette.coral }}
                  value={endedAt !== null}
                />
              </View>
              {endedAt ? (
                <Pressable
                  onPress={() => setPicker('end')}
                  style={({ pressed }) => [styles.endDate, pressed && styles.pressed]}>
                  <IconSymbol name="calendar" size={18} color={Palette.coral} />
                  <Text style={styles.endDateValue}>{formatMoment(endedAt)}</Text>
                  <IconSymbol name="chevron.right" size={16} color={Palette.subtle} />
                </Pressable>
              ) : null}
            </GlassCard>

            <Text style={styles.sectionLabel}>ЗАМЕТКА</Text>
            <View style={styles.noteCard}>
              <TextInput
                accessibilityLabel="Заметка к периоду"
                multiline
                onChangeText={setNote}
                placeholder="Например: 1–2 чашки в день, после обеда не пью"
                placeholderTextColor={Palette.subtle}
                style={styles.noteInput}
                textAlignVertical="top"
                value={note}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void save()}
              style={({ pressed }) => [
                styles.saveButton,
                saving && styles.saveDisabled,
                pressed && styles.pressed,
              ]}>
              <IconSymbol name="checkmark" size={20} color={Palette.white} weight="semibold" />
              <Text style={styles.saveText}>
                {saving ? 'Сохраняем…' : isEditing ? 'Сохранить изменения' : 'Начать период'}
              </Text>
            </Pressable>

            {isEditing ? (
              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                <IconSymbol name="trash" size={18} color="#D93D43" />
                <Text style={styles.deleteText}>Удалить период</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScreenShell>

      <Modal
        animationType="fade"
        onRequestClose={() => setPicker(null)}
        transparent
        visible={picker !== null}>
        <View style={styles.dateModal}>
          <Pressable onPress={() => setPicker(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.dateSheet}>
            <View style={styles.dateSheetHeader}>
              <Text style={styles.dateSheetTitle}>
                {picker === 'end' ? 'Окончание периода' : 'Начало периода'}
              </Text>
              <Pressable onPress={() => setPicker(null)}>
                <Text style={styles.dateDone}>Готово</Text>
              </Pressable>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                display="spinner"
                locale="ru-RU"
                mode="datetime"
                onChange={(_, date) => date && applyPickedDate(date)}
                textColor={Palette.text}
                value={pickerValue}
              />
            ) : (
              <View style={styles.androidControls}>
                <Pressable
                  onPress={() => setAndroidMode('date')}
                  style={styles.androidButton}>
                  <Text style={styles.androidLabel}>Дата</Text>
                  <Text style={styles.androidValue}>{formatMoment(pickerValue)}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAndroidMode('time')}
                  style={styles.androidButton}>
                  <Text style={styles.androidLabel}>Время</Text>
                  <Text style={styles.androidValue}>
                    {new Intl.DateTimeFormat('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(pickerValue)}
                  </Text>
                </Pressable>
                {androidMode ? (
                  <DateTimePicker
                    display="default"
                    mode={androidMode}
                    onChange={(event, date) => {
                      setAndroidMode(null);
                      if (event.type !== 'dismissed' && date) applyPickedDate(date);
                    }}
                    value={pickerValue}
                  />
                ) : null}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 60,
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
    textAlign: 'center',
  },
  loading: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 60,
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
  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceStrong,
  },
  kindDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  kindText: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  kindHint: {
    color: Palette.subtle,
    fontSize: 11.5,
    marginTop: 9,
    marginLeft: 4,
  },
  inputCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  input: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  dateCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  dateIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Palette.coralSoft,
  },
  dateValue: {
    flex: 1,
    color: Palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
  },
  finishCard: {
    padding: Spacing.md,
  },
  finishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finishText: {
    flex: 1,
  },
  finishTitle: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  finishHint: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  endDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: Radius.small,
    backgroundColor: '#F1F2F6',
  },
  endDateValue: {
    flex: 1,
    color: Palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  noteCard: {
    minHeight: 96,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  noteInput: {
    minHeight: 68,
    color: Palette.text,
    fontSize: 14,
    lineHeight: 21,
    padding: 0,
  },
  saveButton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.xl,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coral,
    ...Shadow.button,
  },
  saveDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: Radius.medium,
    backgroundColor: '#FFF0F1',
  },
  deleteText: {
    color: '#D93D43',
    fontSize: 14,
    fontWeight: '700',
  },
  dateModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24,32,47,0.32)',
  },
  dateSheet: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 34,
    paddingTop: Spacing.md,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    backgroundColor: Palette.surfaceStrong,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateSheetTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dateDone: {
    color: Palette.coral,
    fontSize: 15,
    fontWeight: '700',
  },
  androidControls: {
    gap: 10,
  },
  androidButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.small,
    backgroundColor: '#F1F2F6',
  },
  androidLabel: {
    color: Palette.muted,
    fontSize: 11,
  },
  androidValue: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});
