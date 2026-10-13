"use no memo";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import * as Haptics from "expo-haptics";
import * as M from "../../design-lab/model";
import { Palette as P } from "@/constants/design";
import { tr } from "@/localization";
import { addMeasurement, createPhase, updatePhase } from "@/data/database";
import { SaveSuccessOverlay } from "@/components/save-success-overlay";
import { useDiary } from "./diary-provider";
import {
  Button,
  Card,
  CText as Text,
  Empty,
  ErrorText,
  Icon,
  IconButton,
  Screen,
  Section,
  styles,
  moment,
  time,
} from "./ui";
import { DateSheet } from "./calendar";

const fields = [
  ["systolic", "Верхнее", P.coral],
  ["diastolic", "Нижнее", P.orange],
  ["pulse", "Пульс", P.pulse],
] as const;
const inputStyle = { fontFamily: "Manrope", color: P.text, fontSize: 14 };

export function EntryScreen() {
  const db = useSQLiteContext(),
    navigation = useNavigation();
  const diary = useDiary();
  const [value, setValue] = useState(
    () => M.resumableDraft(diary.state) || M.newDraft(),
  );
  const current = useRef(value);
  const modes = useRef({ ...diary.state.drafts });
  const [editing, setEditing] = useState<string | null>(null);
  const [picker, setPicker] = useState<number | null>(null);
  const [error, setError] = useState(""),
    [storageFailed, setStorageFailed] = useState(false);
  const [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const allowExit = useRef(false);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const savedRecord = useRef(0);
  function advance(key: string | null) {
    if (!key) return;
    const [index, field] = key.split(":");
    const nextField = field === "systolic" ? "diastolic" : field === "diastolic" ? "pulse" : "systolic";
    const nextIndex = Number(index) + (field === "pulse" ? 1 : 0);
    const next = inputs.current[nextIndex + ":" + nextField];
    if (next) next.focus();
    else Keyboard.dismiss();
  }
  function persist(next: M.Draft) {
    if (saving) return;
    current.current = next;
    modes.current[next.mode] = next;
    setValue(next);
    setPersisting(true);
    const pending = diary.draft(next, next.mode);
    void pending.then(
      () => {
        if (current.current !== next) return;
        setPersisting(false);
        setStorageFailed(false);
        setError("");
      },
      () => {
        if (current.current !== next) return;
        setPersisting(false);
        setStorageFailed(true);
        setError("Черновик не сохранён. Попробуйте ещё раз.");
      },
    );
  }
  usePreventRemove(
    !saved &&
      M.draftChanged(value) &&
      (persisting || storageFailed),
    ({ data }) => {
      if (allowExit.current) {
        navigation.dispatch(data.action);
        return;
      }
      void (async () => {
        try {
          // Persist the current value again: a failed earlier write must never acknowledge exit.
          await diary.draft(current.current, current.current.mode);
          allowExit.current = true;
          navigation.dispatch(data.action);
        } catch {
          setStorageFailed(true);
          setError("Черновик не сохранён. Попробуйте ещё раз.");
        }
      })();
    },
  );
  function switchMode(mode: "single" | "series") {
    if (mode === value.mode || saving) return;
    modes.current[value.mode] = current.current;
    persist(M.clone(modes.current[mode] || M.newDraft(mode)));
    void Haptics.selectionAsync();
  }
  async function save() {
    if (saving || !M.canSaveEntry(current.current)) return;
    setSaving(true);
    setError("");
    try {
      await diary.draft(current.current, current.current.mode);
      const draft = current.current;
      const readings = draft.readings.map((r) => ({
        systolic: Number(r.systolic),
        diastolic: Number(r.diastolic),
        pulse: Number(r.pulse),
        measuredAt: r.measuredAt,
      }));
      M.validateSession({
        ...draft,
        id: 1,
        measuredAt: readings[0].measuredAt,
        readings,
      });
      await diary.change(async () => {
        savedRecord.current = await addMeasurement(
          db,
          { ...draft, measuredAt: new Date(readings[0].measuredAt), readings },
          draft.mode,
        );
      });
      Keyboard.dismiss();
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось сохранить измерение.",
      );
    } finally {
      setSaving(false);
    }
  }
  function discard() {
    Alert.alert(
      tr("Удалить черновик?"),
      tr("Введённые показатели и заметка будут удалены."),
      [
        { text: tr("Отмена"), style: "cancel" },
        {
          text: tr("Удалить"),
          style: "destructive",
          onPress: () => {
            void diary.draft(null, value.mode).then(
              () => {
                allowExit.current = true;
                router.back();
              },
              () => setError("Черновик не сохранён. Попробуйте ещё раз."),
            );
          },
        },
      ],
    );
  }
  const updateReading = (index: number, next: M.DraftReading) =>
    persist({
      ...current.current,
      readings: current.current.readings.map((r, i) =>
        i === index ? next : r,
      ),
    });
  return (
    <Screen
      title={tr("Новое измерение")}
      back
      footer={
        <Button
          icon="check"
          label={tr("Сохранить измерение")}
          tone="primary"
          disabled={saving || !M.canSaveEntry(value)}
          onPress={() => void save()}
        />
      }
    >
      <View style={formStyles.segment}>
        {(["single", "series"] as const).map((mode) => (
          <Pressable
            accessibilityRole="button"
            key={mode}
            onPress={() => switchMode(mode)}
            accessibilityState={{ selected: mode === value.mode }}
            style={[
              formStyles.segmentButton,
              mode === value.mode && { backgroundColor: P.coralSoft },
            ]}
          >
            <Text>{tr(mode === "single" ? "Один замер" : "Серия")}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText error={error} />
      {storageFailed ? (
        <Button
          label={tr("Повторить")}
          onPress={() => persist(current.current)}
        />
      ) : null}
      {value.readings.map((r, index) => {
        const validation = M.entryReadingError(r, {
          partial: true,
          editingField: editing?.startsWith(index + ":")
            ? editing.split(":")[1]
            : null,
        });
        return (
          <Card
            key={index}
            style={
              value.mode === "single"
                ? { padding: 0, borderWidth: 0, backgroundColor: "transparent" }
                : { padding: 12 }
            }
          >
            <View style={styles.spread}>
              <Text style={{ color: P.muted, fontSize: 12 }}>
                {value.mode === "series"
                  ? tr("Замер ") + (index + 1)
                  : tr("Показатели")}
              </Text>
              {value.mode === "series" && value.readings.length > 1 ? (
                <IconButton
                  icon="close"
                  label={tr("Удалить замер")}
                  onPress={() =>
                    persist({
                      ...value,
                      readings: value.readings.filter((_, i) => i !== index),
                    })
                  }
                />
              ) : null}
            </View>
            <View
              style={[
                styles.row,
                {
                  gap: 0,
                  marginVertical: 10,
                  padding: 8,
                  borderWidth: value.mode === "single" ? 1 : 0,
                  borderColor: P.line,
                  borderRadius: 12,
                  backgroundColor: P.surface,
                },
              ]}
            >
              {fields.map(([field, label, color]) => (
                <View
                  key={field}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderLeftWidth: field === "systolic" ? 0 : 1,
                    borderColor: P.line,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor:
                      editing === index + ":" + field
                        ? field === "pulse"
                          ? "#E7EEF1"
                          : P.coralSoft
                        : "transparent",
                  }}
                >
                  <Text style={{ color: P.muted, fontSize: 11 }}>
                    {tr(label)}
                  </Text>
                  <TextInput
                    // Recreate the native iOS toolbar when a series changes its last field or the language changes.
                    key={Platform.OS === "ios" ? tr(field === "pulse" && index === value.readings.length - 1 ? "Готово" : "Далее") : field}
                    ref={(input) => {
                      inputs.current[index + ":" + field] = input;
                    }}
                    accessibilityLabel={tr(label)}
                    testID={"reading-" + index + "-" + field}
                    keyboardType="number-pad"
                    inputAccessoryViewButtonLabel={
                      Platform.OS === "ios"
                        ? tr(field === "pulse" && index === value.readings.length - 1 ? "Готово" : "Далее")
                        : undefined
                    }
                    returnKeyType={
                      field === "pulse" && index === value.readings.length - 1
                        ? "done"
                        : "next"
                    }
                    submitBehavior="submit"
                    onSubmitEditing={() => advance(index + ":" + field)}
                    maxLength={3}
                    editable={!saving}
                    value={r[field]}
                    placeholder="—"
                    placeholderTextColor={P.subtle}
                    onFocus={() => setEditing(index + ":" + field)}
                    onBlur={() => setEditing(null)}
                    onChangeText={(text) =>
                      updateReading(
                        index,
                        M.readingWithInput(
                          current.current.readings[index],
                          field,
                          text,
                        ),
                      )
                    }
                    style={[
                      formStyles.number,
                      {
                        color,
                        borderColor: validation?.fields.includes(field)
                          ? P.danger
                          : P.line,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            {validation ? <View style={{ marginBottom: 12 }}><ErrorText error={validation.message} /></View> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => setPicker(index)}
              style={formStyles.date}
            >
              <Text style={styles.muted}>{tr("Дата и время замера")}</Text>
              <View style={[styles.row, { alignSelf: "stretch" }]}>
                <Text style={{ flex: 1 }}>
                  {moment(
                    r.timeSource === "pending" ? new Date() : r.measuredAt,
                    true,
                  )}
                </Text>
                <Text>
                  {r.timeSource === "pending" ? "—" : time(r.measuredAt)}
                </Text>
                <Icon name="calendarRange" size={20} />
              </View>
            </Pressable>
          </Card>
        );
      })}
      {value.mode === "series" &&
      value.readings.length < M.MAX_SERIES_READINGS ? (
        <Button
          icon="plus"
          label={tr("Добавить замер")}
          disabled={
            saving || value.readings.some((r) => M.entryReadingError(r))
          }
          onPress={() =>
            persist({ ...value, readings: [...value.readings, M.newReading()] })
          }
        />
      ) : null}
      <View>
        <Section>{tr("Как вы себя чувствуете?")}</Section>
        <Card>
          <View style={styles.spread}>
            <Text style={styles.muted}>{tr("Самочувствие")}</Text>
            <Text style={{ fontSize: 28, color: P.wellbeing }}>
              {value.wellbeing}
              <Text style={styles.muted}> / 10</Text>
            </Text>
          </View>
          <Slider
            tapToSeek
            disabled={saving}
            accessibilityLabel={tr("Самочувствие")}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={value.wellbeing}
            minimumTrackTintColor={P.wellbeing}
            maximumTrackTintColor={P.wellbeingSoft}
            thumbTintColor={P.wellbeing}
            onValueChange={(wellbeing) => {
              if (current.current.wellbeing !== wellbeing)
                persist({ ...current.current, wellbeing });
            }}
            onSlidingComplete={(wellbeing) => {
              persist({ ...current.current, wellbeing });
              void Haptics.selectionAsync();
            }}
          />
          <View style={styles.spread}>
            <Text style={styles.muted}>{tr("Очень плохо")}</Text>
            <Text style={styles.muted}>{tr("Отлично")}</Text>
          </View>
        </Card>
      </View>
      <View>
        <Section>{tr("Отметки")}</Section>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {M.TAGS.map((tag) => (
            <Pressable
              accessibilityRole="button"
              key={tag}
              accessibilityState={{ selected: value.tags.includes(tag) }}
              onPress={() => {
                persist({
                  ...value,
                  tags: value.tags.includes(tag)
                    ? value.tags.filter((t) => t !== tag)
                    : [...value.tags, tag],
                });
                void Haptics.selectionAsync();
              }}
              style={[
                formStyles.tag,
                value.tags.includes(tag) && {
                  backgroundColor: P.wellbeingSoft,
                  borderColor: P.wellbeing,
                },
              ]}
            >
              <Text style={{ fontSize: 12 }}>{tr(tag)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Section>{tr("Заметка")}</Section>
        <TextInput
          accessibilityLabel={tr("Заметка")}
          placeholder={tr("Что важно помнить об этом измерении?")}
          placeholderTextColor={P.subtle}
          multiline
          value={value.note}
          onChangeText={(note) => persist({ ...current.current, note })}
          style={[inputStyle, formStyles.note]}
        />
      </View>
      <Button
        icon="trash"
        tone="red"
        label={tr("Удалить черновик")}
        disabled={saving}
        onPress={discard}
      />
      {picker !== null ? (
        <DateSheet
          title={tr("Дата и время замера")}
          value={value.readings[picker].measuredAt}
          onClose={() => setPicker(null)}
          onApply={(date) => {
            updateReading(picker, {
              ...value.readings[picker],
              measuredAt: date,
              timeSource: "manual",
            });
            setPicker(null);
          }}
        />
      ) : null}
      <SaveSuccessOverlay
        visible={saved}
        title={tr(
          value.mode === "series" ? "Серия сохранена" : "Измерение сохранено",
        )}
        subtitle=""
        onDone={() =>
          router.replace({
            pathname: "/measurement/[id]",
            params: { id: String(savedRecord.current) },
          })
        }
      />
    </Screen>
  );
}

export function PhaseEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    db = useSQLiteContext(),
    diary = useDiary();
  const existing = id
    ? diary.state.phases.find((p) => p.id === Number(id))
    : null;
  const appearance = existing
    ? M.phaseAppearance(existing)
    : { icon: "leaf", color: M.PHASE_COLORS[0] };
  const [title, setTitle] = useState(existing?.title || ""),
    [icon, setIcon] = useState(appearance.icon),
    [color, setColor] = useState(appearance.color);
  const [start, setStart] = useState(
      () => new Date(existing?.startedAt || Date.now()),
    ),
    [end, setEnd] = useState(() => new Date(existing?.endedAt || Date.now()));
  const [withoutEnd, setWithoutEnd] = useState(!existing?.endedAt),
    [note, setNote] = useState(existing?.note || "");
  const [picker, setPicker] = useState<"start" | "end" | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false);
  let validationError = "";
  if (title.trim()) {
    try {
      M.savePhase(
        diary.state.phases,
        {
          title,
          icon,
          color,
          kind: existing?.kind || "custom",
          startedAt: start.toISOString(),
          endedAt: withoutEnd ? null : end.toISOString(),
          note,
        },
        existing?.id,
      );
    } catch (reason) {
      validationError =
        reason instanceof Error
          ? reason.message
          : "Не удалось сохранить период.";
    }
  }
  const editSignature = JSON.stringify([title, icon, color, start, end, withoutEnd, note]);
  const [previousEdit, setPreviousEdit] = useState(editSignature);
  if (previousEdit !== editSignature) {
    setPreviousEdit(editSignature);
    if (error) setError("");
  }
  useEffect(() => {
    if (picker) void Haptics.selectionAsync();
  }, [picker]);
  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const input = {
        title,
        icon,
        color,
        kind: existing?.kind || ("custom" as const),
        startedAt: start.toISOString(),
        endedAt: withoutEnd ? null : end.toISOString(),
        note,
      };
      M.savePhase(diary.state.phases, input, existing?.id);
      await diary.change(() =>
        existing ? updatePhase(db, existing.id, input) : createPhase(db, input),
      );
      if (existing) router.back();
      else setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось сохранить период.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (id && !existing)
    return (
      <Screen title={tr("Изменить период")} back>
        <Empty title={tr("Период не найден")} />
      </Screen>
    );
  return (
    <Screen
      title={tr(existing ? "Изменить период" : "Новый период")}
      back
      footer={
        <Button
          label={tr(existing ? "Сохранить изменения" : "Создать период")}
          tone="primary"
          disabled={saving || !title.trim() || !!validationError}
          onPress={() => void save()}
        />
      }
    >
      <Card style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <View style={styles.row}>
          <Icon name={icon} color={color} size={28} />
          <TextInput
            accessibilityLabel={tr("Название периода")}
            placeholder={tr("Название периода")}
            placeholderTextColor={P.subtle}
            value={title}
            onChangeText={setTitle}
            style={[
              inputStyle,
              { flex: 1, minWidth: 0, fontSize: 19, paddingVertical: 12 },
            ]}
          />
        </View>
      </Card>
      <View>
        <Section>{tr("Значок")}</Section>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {M.PHASE_ICONS.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.icon}
              accessibilityLabel={tr(item.label)}
              accessibilityState={{ selected: icon === item.icon }}
              onPress={() => {
                setIcon(item.icon);
                void Haptics.selectionAsync();
              }}
              style={[
                formStyles.iconChoice,
                {
                  borderColor: icon === item.icon ? color : P.line,
                  backgroundColor: icon === item.icon ? P.coralSoft : P.surface,
                },
              ]}
            >
              <Icon name={item.icon} color={color} size={22} />
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Section>{tr("Цвет")}</Section>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {M.PHASE_COLORS.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              accessibilityLabel={tr("Цвет") + " " + item}
              accessibilityState={{ selected: item === color }}
              onPress={() => {
                setColor(item);
                void Haptics.selectionAsync();
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: item,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item === color ? (
                <Icon name="check" color={P.white} size={18} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Section>{tr("Дата и время начала")}</Section>
        <Pressable
          accessibilityRole="button"
          style={[formStyles.date, { flexDirection: "row", gap: 12 }]}
          onPress={() => setPicker("start")}
        >
          <Text style={{ flex: 1, fontSize: 13 }}>{moment(start, true)}</Text>
          <Text style={{ fontSize: 23 }}>{time(start)}</Text>
          <Icon name="calendarRange" size={20} />
        </Pressable>
      </View>
      <View>
        <Section>{tr("Дата и время завершения")}</Section>
        <Pressable
          accessibilityRole="button"
          disabled={withoutEnd}
          style={[
            formStyles.date,
            { flexDirection: "row", gap: 12 },
            withoutEnd && { opacity: 0.4 },
          ]}
          onPress={() => setPicker("end")}
        >
          <Text style={{ flex: 1, fontSize: 13 }}>{moment(end, true)}</Text>
          <Text style={{ fontSize: 23 }}>{time(end)}</Text>
          <Icon name="calendarRange" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: withoutEnd }}
          onPress={() => setWithoutEnd(!withoutEnd)}
          style={[styles.row, { justifyContent: "flex-end", marginTop: 8 }]}
        >
          <Text style={styles.muted}>{tr("Без даты завершения")}</Text>
          <View
            style={{
              width: 21,
              height: 21,
              borderWidth: 1,
              borderColor: P.line,
              borderRadius: 5,
              backgroundColor: withoutEnd ? P.coral : P.surface,
            }}
          >
            {withoutEnd ? (
              <Icon name="check" color={P.white} size={18} />
            ) : null}
          </View>
        </Pressable>
      </View>
      <View>
        <Section>{tr("Заметка")}</Section>
        <TextInput
          accessibilityLabel={tr("Заметка")}
          value={note}
          onChangeText={setNote}
          placeholder={tr("Заметка")}
          multiline
          style={[inputStyle, formStyles.note]}
        />
      </View>
      <ErrorText error={error || validationError} />
      {picker ? (
        <DateSheet
          title={tr(
            picker === "start"
              ? "Дата и время начала"
              : "Дата и время завершения",
          )}
          value={(picker === "start" ? start : end).toISOString()}
          onClose={() => setPicker(null)}
          onApply={(date) => {
            if (picker === "start") setStart(new Date(date));
            else setEnd(new Date(date));
            setPicker(null);
          }}
        />
      ) : null}
      <SaveSuccessOverlay
        visible={saved}
        title={tr("Период создан")}
        subtitle=""
        onDone={() => router.back()}
      />
    </Screen>
  );
}

const formStyles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.surface,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 9,
  },
  number: {
    fontFamily: "Manrope",
    fontSize: 34,
    minHeight: 42,
    width: "100%",
    textAlign: "center",
  },
  date: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.surface,
    padding: 14,
    alignItems: "center",
    gap: 7,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 10,
    backgroundColor: P.surface,
  },
  note: {
    minHeight: 110,
    padding: 14,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 12,
    backgroundColor: P.surface,
    textAlignVertical: "top",
  },
  iconChoice: {
    width: 43,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
