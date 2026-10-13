"use no memo";
import { useRef, useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";

import { useSQLiteContext } from "expo-sqlite";
import { Palette as P } from "@/constants/design";
import { appLocale, countRecords, tr } from "@/localization";
import {
  deletePhase,
  updateMeasurementNote,
  updatePhase,
} from "@/data/database";
import { SaveSuccessOverlay } from "@/components/save-success-overlay";
import * as M from "../../design-lab/model";
import { useDiary } from "./diary-provider";
import {
  Button,
  Card,
  Collapse,
  CText as Text,
  DateStamp,
  DetailMeasures,
  Empty,
  ErrorText,
  Icon,
  IconButton,
  Measures,
  PhaseCard,
  Screen,
  Section,
  Sheet,
  styles,
  moment,
  time,
} from "./ui";
import { Calendar, RangeSheet } from "./calendar";
import { Chart } from "./chart";
import { comparisonSelections } from "@/constants/clarity-comparison";

const openMeasurement = (id: number) =>
  router.push({ pathname: "/measurement/[id]", params: { id: String(id) } });
const openPhase = (id: number) =>
  router.push({ pathname: "/phase/[id]", params: { id: String(id) } });

export function HomeScreen() {
  const { state } = useDiary();
  const recent = M.filter(state.sessions).slice(0, 12),
    latest = recent[0],
    draft = M.resumableDraft(state),
    active = state.phases.filter((p) => M.phaseStatus(p) !== "finished");
  return (
    <Screen title={tr("Давление")}>
      {latest ? (
        <View>
          <Section>{tr("Предыдущее измерение")}</Section>
          <DetailMeasures session={latest} onPress={() => openMeasurement(latest.id)} />
        </View>
      ) : (
        <Empty
          title={tr("Ваш первый замер")}
          subtitle={tr("Добавьте измерение, чтобы начать дневник.")}
        />
      )}
      <Button
        label={tr(draft ? "Продолжить запись" : "Новое измерение")}
        icon={draft ? "edit" : "plus"}
        tone="primary"
        onPress={() => router.push("/new-measurement")}
      />
      {active.length ? (
        <View>
          <Section>{tr("Активные периоды")}</Section>
          {active.map((p) => (
            <Pressable
              accessibilityRole="button"
              key={p.id}
              onPress={() => openPhase(p.id)}
              style={[
                styles.row,
                { minHeight: 65, borderBottomWidth: 1, borderColor: P.line },
              ]}
            >
              <Icon
                name={M.phaseAppearance(p).icon}
                color={M.phaseAppearance(p).color}
                size={24}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16 }}>{p.title}</Text>
                <Text style={styles.muted}>
                  {moment(p.startedAt)} —{" "}
                  {p.endedAt ? moment(p.endedAt) : tr("сейчас")}
                  {M.phaseStatus(p) === "scheduled"
                    ? " · " + tr("Запланирован")
                    : ""}
                </Text>
              </View>
              <Icon name="chevron" size={17} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {recent.length ? (
        <View>
          <Section right={<Text style={styles.muted}>{recent.length}</Text>}>
            {tr("Последние измерения")}
          </Section>
          <Chart sessions={recent} onOpen={openMeasurement} />
        </View>
      ) : null}
    </Screen>
  );
}

type HistoryFilters = {
  sort: string;
  from: string;
  to: string;
  mode: string;
  phaseId: string;
  wellbeingMin: string;
  wellbeingMax: string;
  tags: string[];
  withNote: boolean;
};
const defaultFilters = (): HistoryFilters => ({
  sort: "newest",
  from: "",
  to: "",
  mode: "all",
  phaseId: "all",
  wellbeingMin: "",
  wellbeingMax: "",
  tags: [],
  withNote: false,
});
function historyItems(state: M.State, f: HistoryFilters) {
  return M.filter(state.sessions, {
    ...f,
    phase: state.phases.find((p) => String(p.id) === f.phaseId),
    withoutPhase: f.phaseId === "none",
    phases: state.phases,
  });
}

export function HistoryScreen() {
  const { state, historySelection, historyFor, viewEpoch } = useDiary();
  const [filters, setFilters] = useState(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false),
    [sortOpen, setSortOpen] = useState(false),
    [limit, setLimit] = useState(30);
  const selected = historySelection
    ? M.statisticsWindow(
        state.sessions,
        state.phases,
        M.statisticsPreferences({ selection: historySelection }, state.phases)
          .selection,
      ).items
    : state.sessions;
  const items = historyItems({ ...state, sessions: selected }, filters);
  const [resetSource, setResetSource] = useState({ historySelection, viewEpoch });
  if (resetSource.historySelection !== historySelection || resetSource.viewEpoch !== viewEpoch) {
    setResetSource({ historySelection, viewEpoch });
    if (historySelection || resetSource.viewEpoch !== viewEpoch) {
      setFilters(defaultFilters());
      setLimit(30);
    }
    if (resetSource.viewEpoch !== viewEpoch) {
      setFilterOpen(false);
      setSortOpen(false);
    }
  }
  const chips: { label: string; clear: Partial<HistoryFilters> }[] = [];
  if (filters.from || filters.to)
    chips.push({
      label: [filters.from, filters.to]
        .map((day) => (day ? moment(day + "T12:00:00") : "…"))
        .join(" — "),
      clear: { from: "", to: "" },
    });
  if (filters.mode !== "all")
    chips.push({
      label: tr(filters.mode === "series" ? "Серии" : "Одиночные"),
      clear: { mode: "all" },
    });
  if (filters.phaseId !== "all")
    chips.push({
      label:
        filters.phaseId === "none"
          ? tr("Без периода")
          : state.phases.find((p) => String(p.id) === filters.phaseId)?.title ||
            tr("Период"),
      clear: { phaseId: "all" },
    });
  if (filters.wellbeingMin || filters.wellbeingMax)
    chips.push({
      label:
        tr("Самочувствие") +
        ": " +
        (filters.wellbeingMin || "1") +
        "–" +
        (filters.wellbeingMax || "10"),
      clear: { wellbeingMin: "", wellbeingMax: "" },
    });
  for (const tag of filters.tags)
    chips.push({
      label: tr(tag),
      clear: { tags: filters.tags.filter((value) => value !== tag) },
    });
  if (filters.withNote)
    chips.push({ label: tr("Только с заметкой"), clear: { withNote: false } });
  const scopedHistory = !!historySelection && !(historySelection.scope === "time" && historySelection.preset === "all");
  return (
    <Screen
      title={tr("История")}
      actions={
        <View style={styles.row}>
          <IconButton
            icon="filter"
            label={tr("Фильтры")}
            active={chips.length > 0 || scopedHistory}
            count={chips.length + (scopedHistory ? 1 : 0)}
            onPress={() => setFilterOpen(true)}
          />
          <IconButton
            icon="valuesList"
            label={tr("Порядок записей")}
            onPress={() => setSortOpen(true)}
          />
        </View>
      }
    >
      <View style={styles.spread}>
        <Text style={styles.muted}>{countRecords(items.length)}</Text>
        {chips.length || historySelection ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFilters(defaultFilters());
              historyFor(null);
            }}
          >
            <Text style={{ color: P.coral }}>{tr("Сбросить все")}</Text>
          </Pressable>
        ) : null}
      </View>
      {chips.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {chips.map((chip) => (
            <Pressable
              key={chip.label}
              accessibilityRole="button"
              accessibilityLabel={tr("Сбросить") + ": " + chip.label}
              onPress={() => {
                setFilters((previous) => ({ ...previous, ...chip.clear }));
                setLimit(30);
              }}
              style={[
                styles.row,
                {
                  backgroundColor: P.coralSoft,
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                },
              ]}
            >
              <Text style={{ fontSize: 11, color: P.coral }}>{chip.label}</Text>
              <Icon name="close" size={13} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {historySelection ? (
        <Text style={styles.muted}>
          {historySelection.scope === "time"
            ? selectionLabel(historySelection, state)
            : state.phases.find((p) => String(p.id) === historySelection.scope)
                ?.title}
        </Text>
      ) : null}
      {items.length ? (
        items.slice(0, limit).map((s) => <HistoryCard key={s.id} session={s} />)
      ) : (
        <Empty title={tr("Нет подходящих записей")} />
      )}
      {limit < items.length ? (
        <Button
          label={tr("Показать ещё")}
          onPress={() => setLimit((x) => x + 30)}
        />
      ) : null}
      {filterOpen ? (
        <HistoryFilterSheet
          state={state}
          filters={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => {
            setFilters(f);
            setLimit(30);
          }}
        />
      ) : null}
      <Sheet
        title={tr("Порядок записей")}
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
      >
        {M.SORTS.map(([sort, label]) => (
          <Pressable
            accessibilityRole="button"
            key={sort}
            onPress={() => {
              setFilters((f) => ({ ...f, sort }));
              setSortOpen(false);
            }}
            style={[styles.spread, { minHeight: 48 }]}
          >
            <Text>{tr(label)}</Text>
            {filters.sort === sort ? <Icon name="check" /> : null}
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

function HistoryCard({ session: s }: { session: M.Session }) {
  const { state } = useDiary();
  const values = M.summary(s),
    phases = M.phasesFor(s, state.phases);
  return (
    <Card onPress={() => openMeasurement(s.id)}>
      <DateStamp value={s.measuredAt} mode={s.mode} count={s.readings.length} />
      <View
        style={[
          styles.row,
          { justifyContent: "space-between", marginVertical: 14 },
        ]}
      >
        <View style={{ alignItems: "center", flex: 2 }}>
          <Text style={styles.muted}>
            {tr(s.mode === "series" ? "Среднее давление" : "Давление")}
          </Text>
          <View style={styles.row}>
            <Text style={{ color: P.coral, fontSize: 37 }}>
              {values.systolic}
            </Text>
            <Text style={{ color: P.muted, fontSize: 22 }}>/</Text>
            <Text style={{ color: P.orange, fontSize: 37 }}>
              {values.diastolic}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.muted}>{tr("Пульс")}</Text>
          <View style={styles.row}>
            <Icon name="pulse" color={P.pulse} size={18} />
            <Text style={{ color: P.pulse, fontSize: 29 }}>{values.pulse}</Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.spread,
          { borderTopWidth: 1, borderColor: P.line, paddingTop: 12 },
        ]}
      >
        <Text style={{ fontSize: 11, color: P.muted }}>
          {tr("Самочувствие")}
        </Text>
        <View style={styles.row}>
          <Icon name="wellbeingGauge" color={P.wellbeing} size={17} />
          <Text style={{ color: P.wellbeing }}>{s.wellbeing}</Text>
        </View>
      </View>
      {phases.map((p) => (
        <View key={p.id} style={[styles.row, { marginTop: 10 }]}>
          <Icon
            name={M.phaseAppearance(p).icon}
            color={M.phaseAppearance(p).color}
            size={20}
          />
          <View>
            <Text style={{ fontSize: 12 }}>{p.title}</Text>
            <Text style={{ fontSize: 10, color: P.muted }}>
              {moment(p.startedAt)} —{" "}
              {p.endedAt ? moment(p.endedAt) : tr("сейчас")}
            </Text>
          </View>
        </View>
      ))}
      {s.note ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.muted, { marginTop: 12 }]}
        >
          {s.note}
        </Text>
      ) : null}
    </Card>
  );
}

function HistoryFilterSheet({
  state,
  filters,
  onClose,
  onApply,
}: {
  state: M.State;
  filters: HistoryFilters;
  onClose: () => void;
  onApply: (f: HistoryFilters) => void;
}) {
  const [f, setF] = useState(filters),
    [calendar, setCalendar] = useState<"from" | "to" | null>(null),
    [extra, setExtra] = useState(false);
  const set = (key: keyof HistoryFilters, value: string | boolean | string[]) =>
    setF((previous) => ({ ...previous, [key]: value }));
  const error =
    f.from && f.to && f.from > f.to
      ? tr("Начало должно быть не позже завершения.")
      : (f.wellbeingMin && (+f.wellbeingMin < 1 || +f.wellbeingMin > 10)) ||
          (f.wellbeingMax && (+f.wellbeingMax < 1 || +f.wellbeingMax > 10)) ||
          (f.wellbeingMin &&
            f.wellbeingMax &&
            +f.wellbeingMin > +f.wellbeingMax)
        ? tr("Самочувствие: от 1 до 10.")
        : "";
  const items = error ? [] : historyItems(state, f);
  return (
    <Sheet
      title={tr("Фильтры")}
      visible
      onClose={onClose}
      footer={
        <View style={{ gap: 8, marginTop: 12 }}>
          <ErrorText error={error} />
          <Button
            label={tr`Показать ${countRecords(items.length)}`}
            disabled={!!error}
            tone="primary"
            onPress={() => {
              onApply(f);
              onClose();
            }}
          />
          <Button
            label={tr("Сбросить")}
            onPress={() => setF(defaultFilters())}
          />
        </View>
      }
    >
      <Section>{tr("Даты")}</Section>
      <View style={styles.row}>
        {[
          ["all", "Все"],
          ["today", "Сегодня"],
          ["7", "7 дней"],
          ["30", "30 дней"],
        ].map(([id, label]) => (
          <Pressable
            accessibilityRole="button"
            key={id}
            onPress={() => {
              const interval = M.historyInterval(id);
              setF((previous) => ({ ...previous, ...interval }));
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: P.coralSoft,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12 }}>{tr(label)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {(["from", "to"] as const).map((key) => (
          <Pressable
            accessibilityRole="button"
            key={key}
            onPress={() => setCalendar(calendar === key ? null : key)}
            style={[styles.card, { flex: 1, padding: 10 }]}
          >
            <Text style={styles.muted}>{tr(key === "from" ? "С" : "По")}</Text>
            <Text>{f[key] || "—"}</Text>
          </Pressable>
        ))}
      </View>
      {calendar ? (
        <Calendar
          from={f[calendar]}
          onSelect={(value) => {
            set(calendar, value);
            setCalendar(null);
          }}
        />
      ) : null}
      <Section>{tr("Тип записи")}</Section>
      <View style={styles.row}>
        {[
          ["all", "Все"],
          ["single", "Одиночные"],
          ["series", "Серии"],
        ].map(([id, label]) => (
          <Pressable
            accessibilityRole="button"
            key={id}
            onPress={() => set("mode", id)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              backgroundColor: f.mode === id ? P.coralSoft : P.surface,
            }}
          >
            <Text style={{ fontSize: 12, textAlign: "center" }}>
              {tr(label)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Section>{tr("Период")}</Section>
      {[
        ["all", tr("Все периоды")],
        ["none", tr("Без периода")],
        ...state.phases.map((p) => [String(p.id), p.title]),
      ].map(([id, label]) => (
        <Pressable
          accessibilityRole="button"
          key={id}
          onPress={() => set("phaseId", id)}
          style={[styles.spread, { paddingVertical: 7 }]}
        >
          <Text>{label}</Text>
          {f.phaseId === id ? <Icon name="check" size={18} /> : null}
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={() => setExtra(!extra)}>
        <Section right={<Icon name="chevronDown" />}>
          {tr("Дополнительные фильтры")}
        </Section>
      </Pressable>
      {extra ? (
        <>
          <Section>{tr("Самочувствие")}</Section>
          <View style={styles.row}>
            {(["wellbeingMin", "wellbeingMax"] as const).map((key, i) => (
              <TextInput
                key={key}
                accessibilityLabel={tr(i ? "До" : "От")}
                keyboardType="number-pad"
                value={f[key]}
                onChangeText={(value) =>
                  set(key, value.replace(/\D/g, "").slice(0, 2))
                }
                placeholder={tr(i ? "До" : "От")}
                style={{
                  flex: 1,
                  fontFamily: "Manrope",
                  padding: 12,
                  borderWidth: 1,
                  borderColor: P.line,
                  borderRadius: 10,
                  color: P.wellbeing,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {M.TAGS.map((tag) => (
              <Pressable
                accessibilityRole="button"
                key={tag}
                onPress={() =>
                  set(
                    "tags",
                    f.tags.includes(tag)
                      ? f.tags.filter((t) => t !== tag)
                      : [...f.tags, tag],
                  )
                }
                style={{
                  borderWidth: 1,
                  borderColor: P.line,
                  borderRadius: 20,
                  padding: 9,
                  backgroundColor: f.tags.includes(tag)
                    ? P.coralSoft
                    : P.surface,
                }}
              >
                <Text style={{ fontSize: 12 }}>{tr(tag)}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => set("withNote", !f.withNote)}
            style={styles.row}
          >
            <Icon name={f.withNote ? "check" : "file"} />
            <Text>{tr("Только с заметкой")}</Text>
          </Pressable>
        </>
      ) : null}
    </Sheet>
  );
}

export function MeasurementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, change } = useDiary(),
    db = useSQLiteContext();
  const item = state.sessions.find((s) => s.id === Number(id));
  const [note, setNote] = useState(item?.note || ""),
    [error, setError] = useState("");
  const navigation = useNavigation(),
    latestNote = useRef(note);
  const [notePending, setNotePending] = useState(false),
    [noteFailed, setNoteFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function persistNote(value: string) {
    setNotePending(true);
    try {
      await change(() => updateMeasurementNote(db, Number(id), value));
      if (latestNote.current === value) {
        setNotePending(false);
        setNoteFailed(false);
        setError("");
      }
    } catch (e) {
      if (latestNote.current === value) {
        setNotePending(false);
        setNoteFailed(true);
        setError((e as Error).message);
      }
      throw e;
    }
  }
  usePreventRemove(
    !!item && !deleting && (notePending || noteFailed),
    ({ data }) => {
      void persistNote(latestNote.current)
        .then(() => navigation.dispatch(data.action))
        .catch(() => {});
    },
  );
  if (!item)
    return (
      <Screen title={tr("Измерение")} back nav>
        <Empty title={tr("Запись не найдена")} />
      </Screen>
    );
  function remove() {
    Alert.alert(tr("Удалить измерение?"), tr("Действие нельзя отменить."), [
      { text: tr("Отмена"), style: "cancel" },
      {
        text: tr("Удалить"),
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          void change(() =>
            db.runAsync(
              "DELETE FROM measurement_sessions WHERE id = ?",
              Number(id),
            ),
          )
            .then(() => router.back())
            .catch((e) => {
              setDeleting(false);
              setError(e.message);
            });
        },
      },
    ]);
  }
  return (
    <Screen
      title={tr("Измерение")}
      back
      nav
      actions={
        <IconButton icon="trash" label={tr("Удалить")} onPress={remove} />
      }
    >
      <ErrorText error={error} />
      {noteFailed ? (
        <Button
          label={tr("Повторить")}
          onPress={() => {
            void persistNote(latestNote.current).catch(() => {});
          }}
        />
      ) : null}
      <View>
        <Section>{tr("Показания")}</Section>
        <DetailMeasures session={item} />
      </View>
      <View style={{ gap: 10 }}>
        <Section>
          {tr(
            M.phasesFor(item, state.phases).length > 1 ? "Периоды" : "Период",
          )}
        </Section>
        {M.phasesFor(item, state.phases).length ? (
          M.phasesFor(item, state.phases).map((p) => (
            <Card key={p.id} onPress={() => openPhase(p.id)}>
              <View style={[styles.row, { minHeight: 24 }]}>
                <Icon
                  name={M.phaseAppearance(p).icon}
                  color={M.phaseAppearance(p).color}
                  size={24}
                />
                <View style={{ flex: 1 }}>
                  <Text>{p.title}</Text>
                  <Text style={styles.muted}>
                    {moment(p.startedAt)} —{" "}
                    {p.endedAt ? moment(p.endedAt) : tr("сейчас")}
                  </Text>
                </View>
                <Icon name="chevron" size={16} />
              </View>
            </Card>
          ))
        ) : (
          <Card onPress={() => router.navigate("/phases")}>
            <View style={styles.row}>
              <Icon name="calendarRange" />
              <View style={{ flex: 1 }}>
                <Text>{tr("Без периода")}</Text>
                <Text style={styles.muted}>
                  {tr("Выбрать период наблюдения")}
                </Text>
              </View>
              <Icon name="chevron" size={16} />
            </View>
          </Card>
        )}
      </View>
      <View>
        <Section>{tr("Исходные замеры")}</Section>
        <Card>
          <View
            style={[
              styles.row,
              { paddingBottom: 12, borderBottomWidth: 1, borderColor: P.line },
            ]}
          >
            {["Дата / время", "Верхнее", "Нижнее", "Пульс"].map((label) => (
              <Text
                key={label}
                style={{ flex: 1, textAlign: "center", fontSize: 10, color: P.muted }}
              >
                {tr(label)}
              </Text>
            ))}
          </View>
          {item.readings.map((r, i) => (
            <View
              key={i}
              style={[
                styles.row,
                {
                  minHeight: 58,
                  borderBottomWidth: i < item.readings.length - 1 ? 1 : 0,
                  borderColor: P.line,
                },
              ]}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11 }}>{time(r.measuredAt)}</Text>
                <Text style={{ fontSize: 9, color: P.muted }}>
                  {moment(r.measuredAt)}
                </Text>
              </View>
              {(["systolic", "diastolic", "pulse"] as const).map((key) => (
                <Text
                  key={key}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    color:
                      key === "pulse"
                        ? P.pulse
                        : key === "diastolic"
                          ? P.orange
                          : P.coral,
                    fontSize: 19,
                  }}
                >
                  {r[key]}
                </Text>
              ))}
            </View>
          ))}
        </Card>
      </View>
      <View>
        <Section>{tr("Самочувствие")}</Section>
        <Card>
          <View style={styles.spread}>
            <Text style={styles.muted}>{tr("Оценка")}</Text>
            <Text style={{ color: P.wellbeing, fontSize: 26 }}>
              {item.wellbeing}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            {item.tags.map((tag) => (
              <Text
                key={tag}
                style={{
                  borderRadius: 15,
                  padding: 8,
                  backgroundColor: P.wellbeingSoft,
                }}
              >
                {tr(tag)}
              </Text>
            ))}
          </View>
        </Card>
      </View>
      <View>
        <Section>{tr("Заметка")}</Section>
        <Card>
          <TextInput
            accessibilityLabel={tr("Заметка")}
            multiline
            value={note}
            onChangeText={(value) => {
              setNote(value);
              latestNote.current = value;
              void persistNote(value).catch(() => {});
            }}
            placeholder={tr("Добавьте заметку")}
            placeholderTextColor={P.muted}
            style={{
              fontFamily: "Manrope",
              fontSize: 14,
              color: P.text,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </Card>
      </View>
    </Screen>
  );
}

export function PeriodsScreen() {
  const { state } = useDiary(),
    active = state.phases.filter((p) => M.phaseStatus(p) !== "finished"),
    finished = state.phases.filter((p) => M.phaseStatus(p) === "finished");
  return (
    <Screen title={tr("Периоды")}>
      <Button
        label={tr("Создать новый период")}
        icon="plus"
        onPress={() => router.push("/phase-editor")}
      />
      {!state.phases.length ? (
        <Empty
          title={tr("Периодов пока нет")}
          subtitle={tr("При обновлении привычек или образа жизни")}
        />
      ) : (
        <>
          <Collapse title={tr("Активные")} initiallyOpen={!!active.length}>
            {!active.length ? (
              <Text style={styles.muted}>
                {tr("Активных периодов пока нет.")}
              </Text>
            ) : null}
            {active.map((p) => (
              <PhaseCard key={p.id} phase={p} onPress={() => openPhase(p.id)} />
            ))}
          </Collapse>
          <Collapse
            title={tr("Завершённые")}
            count={finished.length}
            initiallyOpen={!active.length}
          >
            {!finished.length ? (
              <Text style={styles.muted}>
                {tr("Завершённых периодов пока нет.")}
              </Text>
            ) : null}
            {finished.map((p) => (
              <PhaseCard key={p.id} phase={p} onPress={() => openPhase(p.id)} />
            ))}
          </Collapse>
        </>
      )}
    </Screen>
  );
}

export function PeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { state, change, historyFor } = useDiary(),
    db = useSQLiteContext();
  const phase = state.phases.find((p) => p.id === Number(id));
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [busy, setBusy] = useState(false);
  if (!phase)
    return (
      <Screen title={tr("Период")} back nav>
        <Empty title={tr("Период не найден.")} />
      </Screen>
    );
  const status = M.phaseStatus(phase);
  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      const changed = M.finishPhase(state.phases, phase!.id).find(
        (p) => p.id === phase!.id,
      )!;
      await change(() => updatePhase(db, phase!.id, changed));
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function remove() {
    Alert.alert(tr("Удалить период?"), tr("Измерения останутся в дневнике."), [
      { text: tr("Отмена"), style: "cancel" },
      {
        text: tr("Удалить"),
        style: "destructive",
        onPress: () => {
          void change(() => deletePhase(db, phase!.id))
            .then(() => router.back())
            .catch((e) => setError(e.message));
        },
      },
    ]);
  }
  return (
    <>
      <Screen
        title={tr(
          status === "finished" ? "Завершённый период" : "Активный период",
        )}
        back
        nav
      >
        <PhaseCard phase={phase} detailed />
        <ErrorText error={error} />
        <View style={{ gap: 8 }}>
          <Button
            label={tr("История измерений")}
            icon="history"
            tone="purple"
            onPress={() => {
              historyFor({ scope: String(phase.id) });
              router.navigate("/history");
            }}
          />
          <Button
            label={tr("Изменить период")}
            icon="edit"
            tone="blue"
            onPress={() =>
              router.push({
                pathname: "/phase-editor",
                params: { id: String(phase.id) },
              })
            }
          />
          {status === "active" ? (
            <Button
              label={tr("Завершить период")}
              disabled={busy || success}
              icon="check"
              onPress={() => {
                void finish();
              }}
            />
          ) : null}
          <Button
            label={tr("Удалить период")}
            icon="trash"
            tone="red"
            onPress={remove}
          />
        </View>
      </Screen>
      <SaveSuccessOverlay
        visible={success}
        title={tr("Период завершён")}
        subtitle=""
        onDone={() => setSuccess(false)}
      />
    </>
  );
}

function selectionLabel(selection: M.Selection, state: M.State) {
  const window = M.statisticsWindow(state.sessions, state.phases, selection);
  if (window.phase) return window.phase.title;
  if (selection.preset === "all") return tr("Данные за всё время");
  return window.from && window.until
    ? tr("Данные за ") + moment(window.from) + " — " + moment(window.until - 1)
    : tr("Данные за всё время");
}

export function StatisticsScreen() {
  const { state, preferences: pref, configure, historyFor } = useDiary();
  const [rangeOpen, setRangeOpen] = useState(false),
    [metricOpen, setMetricOpen] = useState(false),
    [error, setError] = useState("");
  const window = M.statisticsWindow(
      state.sessions,
      state.phases,
      pref.selection,
    ),
    summary = M.statisticsSummary(window.items, pref.summary),
    extremes = M.statisticsExtremes(window.items);
  const metrics: [M.Metric, string, string, string][] = [
    ["systolic", "Верхнее", "мм рт. ст.", P.coral],
    ["diastolic", "Нижнее", "мм рт. ст.", P.orange],
    ["pulse", "Пульс", "уд/мин", P.pulse],
    ["wellbeing", "Самочувствие", "из 10", P.wellbeing],
  ];
  const apply = (next: M.Preferences) => {
    void configure(next).catch((e) => setError(e.message));
  };
  return (
    <Screen
      title={tr("Статистика")}
      sticky={
        <View
          style={[
            styles.row,
            { borderBottomWidth: 1, borderColor: P.line, paddingBottom: 14 },
          ]}
        >
          <Icon
            name={
              window.phase
                ? M.phaseAppearance(window.phase).icon
                : "calendarRange"
            }
            color={
              window.phase ? M.phaseAppearance(window.phase).color : P.coral
            }
            size={24}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: P.coral, fontSize: 14 }}>
              {selectionLabel(pref.selection, state)}
            </Text>
            {window.phase ? (
              <Text style={styles.muted}>
                {moment(window.phase.startedAt)} —{" "}
                {window.phase.endedAt
                  ? moment(window.phase.endedAt)
                  : tr("сейчас")}
              </Text>
            ) : null}
          </View>
        </View>
      }
      actions={
        <View style={styles.row}>
          <IconButton
            icon="calendarClock"
            label={tr("Даты и периоды")}
            onPress={() => setRangeOpen(true)}
          />
          <IconButton
            icon="compareBars"
            label={tr("Сравнение")}
            onPress={() => router.push("/comparison")}
          />
        </View>
      }
    >
      <ErrorText error={error} />
      <View>
        <Section>{tr`${tr(pref.summary === "mean" ? "Среднее" : "Медиана")} за период`}</Section>
        <Card>
          <View
            accessibilityLabel={tr("Способ расчёта")}
            style={[
              styles.row,
              {
                alignSelf: "flex-end",
                width: 138,
                gap: 2,
                padding: 2,
                borderRadius: 8,
                backgroundColor: P.coralSoft,
              },
            ]}
          >
            {(["mean", "median"] as const).map((summary) => (
              <Pressable
                key={summary}
                accessibilityRole="button"
                accessibilityState={{ selected: pref.summary === summary }}
                onPress={() => apply({ ...pref, summary })}
                style={{
                  flex: 1,
                  minHeight: 24,
                  justifyContent: "center",
                  borderRadius: 6,
                  backgroundColor:
                    pref.summary === summary ? P.surface : "transparent",
                }}
              >
                <Text
                  style={{ fontSize: 10, textAlign: "center", color: P.coral }}
                >
                  {tr(summary === "mean" ? "Среднее" : "Медиана")}
                </Text>
              </Pressable>
            ))}
          </View>
          <Measures values={summary.count ? summary.values : null} />
        </Card>
      </View>
      {window.items.length ? (
        <>
          <View>
            <Section
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tr("Показатели графика")}
                  onPress={() => setMetricOpen(true)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      minHeight: 34,
                      paddingHorizontal: 12,
                      gap: 6,
                      borderRadius: 17,
                      borderWidth: 1,
                      borderColor: P.line,
                      backgroundColor: P.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, color: P.coral }}>
                    {tr("Показатели")}
                  </Text>
                  <View style={{ transform: [{ rotate: "90deg" }] }}>
                    <Icon name="chevron" size={14} />
                  </View>
                </Pressable>
              }
            >
              {tr("Динамика")}
            </Section>
            <Chart
              sessions={window.items}
              metric={pref.chartMetric}
              onOpen={openMeasurement}
            />
          </View>
          <View>
            <Section>{tr("Минимум и максимум")}</Section>
            <View style={styles.row}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.muted, { flex: 1, textAlign: "center" }]}>
                {tr("Минимум")}
              </Text>
              <Text style={[styles.muted, { flex: 1, textAlign: "center" }]}>
                {tr("Максимум")}
              </Text>
            </View>
            {metrics.map(([metric, label, unit, color]) => (
              <View
                key={metric}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderColor: P.line,
                }}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12 }}>{tr(label)}</Text>
                    <Text style={{ fontSize: 11, color: P.muted }}>
                      {tr(unit)}
                    </Text>
                  </View>
                  {(["min", "max"] as const).map((kind) => {
                    const point = extremes[metric][kind];
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={kind}
                        disabled={!point}
                        onPress={() => point && openMeasurement(point.id)}
                        style={{ flex: 1, alignItems: "center", gap: 3 }}
                      >
                        <Text style={{ color, fontSize: 27 }}>
                          {point
                            ? appLocale.number(
                                point.value,
                                metric === "wellbeing" ? 1 : 0,
                              )
                            : "—"}
                        </Text>
                        {point ? (
                          <View
                            style={[
                              styles.row,
                              {
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 2,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 11, color: P.muted }}>
                              {appLocale.date(point.measuredAt, {
                                day: "numeric",
                                month: "short",
                              })}
                            </Text>
                            <Text style={{ fontSize: 11, color: P.muted }}>
                              {time(point.measuredAt)}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View>
          <Empty
            icon="chart"
            title={tr(
              state.sessions.length
                ? "Нет измерений в этом интервале"
                : "Статистика появится после измерений",
            )}
            subtitle={tr(
              state.sessions.length
                ? "Выберите другие даты или период."
                : "Добавьте первую запись в дневник.",
            )}
          />
          <Button
            label={tr(
              state.sessions.length ? "Показать всё" : "Новое измерение",
            )}
            onPress={() =>
              state.sessions.length
                ? apply({
                    ...pref,
                    selection: { scope: "time", preset: "all" },
                  })
                : router.push("/new-measurement")
            }
          />
        </View>
      )}
      <Button
        label={tr("История измерений")}
        icon="history"
        onPress={() => {
          historyFor(pref.selection);
          router.navigate("/history");
        }}
      />
      {rangeOpen ? (
        <RangeSheet
          visible
          selection={pref.selection}
          onClose={() => setRangeOpen(false)}
          onApply={(selection) => apply({ ...pref, selection })}
        />
      ) : null}
      <Sheet
        title={tr("Показатели графика")}
        visible={metricOpen}
        onClose={() => setMetricOpen(false)}
      >
        {(
          [
            ["systolic", "Верхнее"],
            ["diastolic", "Нижнее"],
            ["pulse", "Пульс"],
            ["pressure", "Верхнее + нижнее"],
            ["combined", "Верхнее + нижнее + пульс"],
          ] as const
        ).map(([chartMetric, label]) => (
          <Pressable
            accessibilityRole="button"
            key={chartMetric}
            onPress={() => apply({ ...pref, chartMetric })}
            style={[styles.spread, { minHeight: 48 }]}
          >
            <Text>{tr(label)}</Text>
            {pref.chartMetric === chartMetric ? <Icon name="check" /> : null}
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

export function ComparisonScreen() {
  const { state, preferences: pref, configure, historyFor } = useDiary();
  const [selecting, setSelecting] = useState<"left" | "right" | null>(null),
    [error, setError] = useState("");
  const [first, second] = comparisonSelections(state, pref);
  const get = (selection: M.Selection) => {
    try {
      return M.statisticsWindow(state.sessions, state.phases, selection).items;
    } catch {
      return [];
    }
  };
  const left = get(first),
    right = get(second),
    result = M.statisticsComparison(left, right, pref.compareSummary);
  const apply = (next: M.Preferences) => {
    void configure(next).catch((e) => setError(e.message));
  };
  return (
    <Screen title={tr("Сравнение")} back nav>
      <ErrorText error={error} />
      <View style={[styles.row, { borderBottomWidth: 1, borderColor: P.line }]}>
        {(
          [
            ["dates", "Даты", "calendarRange"],
            ["phases", "Периоды", "layers"],
          ] as const
        ).map(([compareType, label, icon]) => (
          <Pressable
            accessibilityRole="button"
            key={compareType}
            onPress={() => apply({ ...pref, compareType })}
            style={{ flex: 1, alignItems: "center", gap: 12, paddingTop: 10 }}
          >
            <View style={styles.row}>
              <Icon name={icon} size={17} />
              <Text style={{ color: P.coral }}>{tr(label)}</Text>
            </View>
            <View
              style={{
                width: 92,
                height: 2,
                backgroundColor:
                  pref.compareType === compareType ? P.coral : "transparent",
              }}
            />
          </Pressable>
        ))}
      </View>
      {pref.compareType === "phases" && state.phases.length < 2 ? (
        <View>
          <Empty
            title={tr("Нужны два периода")}
            subtitle={tr(
              "Создайте ещё один период или сравните два диапазона дат.",
            )}
          />
          <Button
            label={tr("Сравнить даты")}
            onPress={() => apply({ ...pref, compareType: "dates" })}
          />
        </View>
      ) : (
        <>
          <Card style={{ padding: 0 }}>
            <View style={styles.row}>
              {(
                [
                  ["left", first, left],
                  ["right", second, right],
                ] as const
              ).map(([side, selection, items], index) => {
                const phase = state.phases.find(
                  (p) => String(p.id) === selection.scope,
                );
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={side}
                    onPress={() => setSelecting(side)}
                    style={{
                      flex: 1,
                      minHeight: 165,
                      padding: 12,
                      borderLeftWidth: index,
                      borderColor: P.line,
                    }}
                  >
                    <View style={styles.spread}>
                      <Icon
                        name={
                          phase
                            ? M.phaseAppearance(phase).icon
                            : "calendarRange"
                        }
                        color={phase ? M.phaseAppearance(phase).color : P.coral}
                      />
                      <Text
                        style={{
                          borderWidth: 1,
                          borderColor: P.line,
                          borderRadius: 12,
                          paddingHorizontal: 7,
                          color: P.coral,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 12 }}>
                      {phase
                        ? phase.title
                        : pref.compareType === "dates"
                          ? tr(
                              selection.preset === "all"
                                ? "Всё время"
                                : selection.preset === "custom"
                                  ? "Свои даты"
                                  : "Выбрать даты",
                            )
                          : tr("Выбрать период")}
                    </Text>
                    <View
                      style={{
                        marginTop: 10,
                        flex: 1,
                        justifyContent: "flex-end",
                        gap: 5,
                      }}
                    >
                      {(["С", "По"] as const).map((label, side) => {
                        const scheduled =
                          phase && M.phaseStatus(phase) === "scheduled";
                        const value = phase
                          ? side
                            ? phase.endedAt
                              ? new Date(
                                  Date.parse(phase.endedAt) - 1,
                                ).toISOString()
                              : null
                            : phase.startedAt
                          : side
                            ? selection.to
                              ? selection.to + "T12:00:00"
                              : items[0]?.measuredAt
                            : selection.from
                              ? selection.from + "T12:00:00"
                              : items.at(-1)?.measuredAt;
                        return (
                          <View key={label} style={[styles.row, { gap: 5 }]}>
                            <Text
                              style={{
                                fontSize: 10,
                                color: P.muted,
                                width: 18,
                              }}
                            >
                              {tr(label)}
                            </Text>
                            <Text style={{ fontSize: 13, flex: 1 }}>
                              {value ? (
                                <>
                                  {appLocale.date(value, {
                                    day: "numeric",
                                    month: "short",
                                  })}{" "}
                                  <Text
                                    style={{ fontSize: 10, color: P.muted }}
                                  >
                                    {appLocale.date(value, { year: "numeric" })}
                                  </Text>
                                </>
                              ) : phase ? (
                                tr(scheduled ? "Без даты" : "Сейчас")
                              ) : (
                                "—"
                              )}
                            </Text>
                          </View>
                        );
                      })}
                      {phase && M.phaseStatus(phase) === "scheduled" ? (
                        <Text style={{ fontSize: 10, color: P.muted }}>
                          {tr("Запланирован")}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.muted,
                        { textAlign: "right", marginTop: 18 },
                      ]}
                    >
                      {countRecords(items.length)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          <View>
            <Section>
              {tr(
                pref.compareSummary === "mean"
                  ? "Средние и разница"
                  : "Медиана и разница",
              )}
            </Section>
            <View style={[styles.row, { alignSelf: "flex-end", padding: 3, gap: 2, borderWidth: 1, borderColor: P.line, borderRadius: 18, marginBottom: 16 }]}>
              {(["mean", "median"] as const).map((compareSummary) => (
                <Pressable key={compareSummary} accessibilityRole="button" accessibilityState={{ selected: pref.compareSummary === compareSummary }} onPress={() => apply({ ...pref, compareSummary })} style={{ paddingHorizontal: 14, minHeight: 34, justifyContent: "center", borderRadius: 15, backgroundColor: pref.compareSummary === compareSummary ? P.coralSoft : "transparent" }}>
                  <Text style={{ fontSize: 12, color: pref.compareSummary === compareSummary ? P.coral : P.muted }}>{tr(compareSummary === "mean" ? "Среднее" : "Медиана")}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.row}>
              <Text style={[styles.muted, { flex: 1 }]}>
                {tr("Показатель")}
              </Text>
              <Text style={[styles.muted, { flex: 1, textAlign: "center" }]}>
                {tr("Первый")}
              </Text>
              <Text style={[styles.muted, { flex: 1, textAlign: "center" }]}>
                {tr("Второй")}
              </Text>
            </View>
            {(
              [
                ["systolic", "Верхнее", P.coral, "мм рт. ст."],
                ["diastolic", "Нижнее", P.orange, "мм рт. ст."],
                ["pulse", "Пульс", P.pulse, "уд/мин"],
                ["wellbeing", "Самочувствие", P.wellbeing, "из 10"],
              ] as const
            ).map(([key, label, color, unit]) => (
              <View
                key={key}
                style={{
                  borderTopWidth: 1,
                  borderColor: P.line,
                  paddingVertical: 16,
                  marginTop: 8,
                }}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12 }}>{tr(label)}</Text>
                    <Text style={{ fontSize: 10, color: P.muted }}>
                      {tr(unit)}
                    </Text>
                  </View>
                  {[result.left, result.right].map((s, i) => (
                    <Text
                      key={i}
                      style={{
                        flex: 1,
                        fontSize: 25,
                        textAlign: "center",
                        color,
                      }}
                    >
                      {s.count ? appLocale.number(s.values[key], 1) : "—"}
                    </Text>
                  ))}
                </View>
                <Text
                  style={[
                    styles.muted,
                    { marginLeft: "33%", textAlign: "center", marginTop: 6 },
                  ]}
                >
                  {tr("Разница: ")}
                  {result.delta
                    ? appLocale.number(Math.abs(result.delta[key]), 1) +
                      " " +
                      tr("ед.")
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
          {left.length || right.length ? (
            <View style={styles.row}>
              {(
                [
                  [left, first, "История первого"],
                  [right, second, "История второго"],
                ] as const
              )
                .filter(([items]) => items.length)
                .map(([, selection, label]) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Button
                      label={tr(label)}
                      onPress={() => {
                        historyFor(selection);
                        router.navigate("/history");
                      }}
                    />
                  </View>
                ))}
            </View>
          ) : null}
        </>
      )}
      {selecting ? (
        <RangeSheet
          visible
          title={tr("Выбор периода или диапазона")}
          selection={selecting === "left" ? first : second}
          onClose={() => setSelecting(null)}
          onApply={(selection) =>
            apply(
              selection.scope === "time"
                ? {
                    ...pref,
                    compareType: "dates",
                    [selecting + "Dates"]: selection,
                  }
                : {
                    ...pref,
                    compareType: "phases",
                    [selecting]: selection.scope,
                  },
            )
          }
        />
      ) : null}
    </Screen>
  );
}
