"use no memo";
import { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { FlatList, Pressable, View } from "react-native";
import { Palette as P } from "@/constants/design";
import { appLocale, getLocale, tr } from "@/localization";
import * as M from "../../design-lab/model";
import {
  Button,
  CText as Text,
  Icon,
  IconButton,
  Sheet,
  styles,
  moment,
} from "./ui";
import { useDiary } from "./diary-provider";

export function localDay(date: Date | string | number) {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function parseDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function Calendar({
  from,
  to = from,
  onSelect,
  initialMonth,
}: {
  from: string;
  to?: string;
  onSelect: (day: string) => void;
  initialMonth?: string;
}) {
  const { now } = useDiary();
  const [month, setMonth] = useState(() => {
    const d = parseDay(initialMonth || from || localDay(Date.now()));
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const start = (month.getDay() + 6) % 7,
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const heading = appLocale.date(month, { month: "long", year: "numeric" });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(
      new Date(2026, 0, 5 + i),
    ),
  );
  const [choosingMonth, setChoosingMonth] = useState(false);
  const firstYear = Math.min(1950, month.getFullYear()),
    lastYear = Math.max(2100, month.getFullYear());
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.spread}>
        <IconButton
          icon="back"
          label={tr("Предыдущий месяц")}
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setChoosingMonth(!choosingMonth)}
        >
          <Text style={{ fontSize: 17 }}>
            {heading.charAt(0).toUpperCase() + heading.slice(1)}
          </Text>
        </Pressable>
        <IconButton
          icon="chevron"
          label={tr("Следующий месяц")}
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        />
      </View>
      {choosingMonth ? (
        <View style={styles.row}>
          <Wheel
            value={month.getMonth()}
            values={Array.from({ length: 12 }, (_, i) =>
              new Intl.DateTimeFormat(getLocale(), { month: "long" }).format(
                new Date(2026, i, 1),
              ),
            )}
            onSelect={(i) => setMonth(new Date(month.getFullYear(), i, 1))}
          />
          <Wheel
            value={month.getFullYear() - firstYear}
            values={Array.from({ length: lastYear - firstYear + 1 }, (_, i) =>
              String(firstYear + i),
            )}
            onSelect={(i) =>
              setMonth(new Date(firstYear + i, month.getMonth(), 1))
            }
          />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            {weekdays.map((day, i) => (
              <Text
                key={i}
                style={{
                  width: "12.1%",
                  textAlign: "center",
                  fontSize: 11,
                  color: P.muted,
                }}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {Array.from({ length: 42 }, (_, i) => {
              const number = i - start + 1;
              if (number < 1 || number > count)
                return (
                  <View key={i} style={{ width: "14.2857%", height: 38 }} />
                );
              const day = localDay(
                  new Date(month.getFullYear(), month.getMonth(), number),
                ),
                edge = day === from || day === to,
                inRange = !!from && !!to && day >= from && day <= to;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityState={{ selected: edge || inRange }}
                  onPress={() => onSelect(day)}
                  style={{
                    width: "14.2857%",
                    height: 38,
                    justifyContent: "center",
                    borderRadius: edge ? 12 : 0,
                    backgroundColor: edge
                      ? P.coral
                      : inRange
                        ? P.coralSoft
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: edge ? P.white : P.text,
                      fontWeight: day === localDay(now) ? "700" : "400",
                    }}
                  >
                    {number}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

export function Wheel({
  value,
  values,
  onSelect,
}: {
  value: number;
  values: string[];
  onSelect: (index: number) => void;
}) {
  const ref = useRef<FlatList<string>>(null);
  useEffect(() => {
    ref.current?.scrollToOffset({ offset: value * 38, animated: false });
  }, [value]);
  return (
    <View style={{ flex: 1, height: 152, overflow: "hidden" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 57,
          left: 0,
          right: 0,
          height: 38,
          backgroundColor: P.coralSoft,
          borderRadius: 10,
        }}
      />
      <FlatList
        nestedScrollEnabled
        ref={ref}
        data={values}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, index) => ({
          length: 38,
          offset: 38 * index,
          index,
        })}
        initialScrollIndex={value}
        showsVerticalScrollIndicator={false}
        snapToInterval={38}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: 57 }}
        onMomentumScrollEnd={(e) => {
          void Haptics.selectionAsync();
          onSelect(
            Math.max(
              0,
              Math.min(
                values.length - 1,
                Math.round(e.nativeEvent.contentOffset.y / 38),
              ),
            ),
          );
        }}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(index);
              ref.current?.scrollToOffset({
                offset: index * 38,
                animated: true,
              });
            }}
            style={{ height: 38, justifyContent: "center" }}
          >
            <Text
              numberOfLines={1}
              style={{
                textAlign: "center",
                color: index === value ? P.coral : P.muted,
                fontSize: 18,
              }}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export function DateSheet({
  value,
  visible = true,
  title = tr("Дата и время"),
  onClose,
  onApply,
}: {
  value: string;
  visible?: boolean;
  title?: string;
  onClose: () => void;
  onApply: (value: string) => void;
}) {
  const [date, setDate] = useState(new Date(value));
  return (
    <Sheet
      stable
      title={title}
      visible={visible}
      onClose={onClose}
      footer={
        <View style={[styles.row, { marginTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Button label={tr("Отмена")} onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={tr("Готово")}
              tone="primary"
              onPress={() => {
                onApply(date.toISOString());
                onClose();
              }}
            />
          </View>
        </View>
      }
    >
      <Calendar
        from={localDay(date)}
        onSelect={(day) => {
          const d = parseDay(day);
          d.setHours(date.getHours(), date.getMinutes());
          setDate(d);
        }}
      />
      <View style={styles.row}>
        <Wheel
          value={date.getHours()}
          values={Array.from({ length: 24 }, (_, i) =>
            String(i).padStart(2, "0"),
          )}
          onSelect={(hour) => {
            const d = new Date(date);
            d.setHours(hour);
            setDate(d);
          }}
        />
        <Text style={{ fontSize: 24 }}>:</Text>
        <Wheel
          value={date.getMinutes()}
          values={Array.from({ length: 60 }, (_, i) =>
            String(i).padStart(2, "0"),
          )}
          onSelect={(minute) => {
            const d = new Date(date);
            d.setMinutes(minute);
            setDate(d);
          }}
        />
      </View>
      <Button label={tr("Сегодня")} onPress={() => setDate(new Date())} />
    </Sheet>
  );
}

export function RangeSheet({
  selection,
  visible,
  onClose,
  onApply,
  title = tr("Даты и периоды"),
}: {
  selection: M.Selection;
  visible: boolean;
  onClose: () => void;
  onApply: (value: M.Selection) => void;
  title?: string;
}) {
  const { state } = useDiary();
  const [tab, setTab] = useState(
    selection.scope === "time" ? "dates" : "phases",
  );
  const [dates, setDates] = useState<M.Selection>(
    selection.scope === "time" ? selection : { scope: "time", preset: "7" },
  );
  const [phase, setPhase] = useState(
    selection.scope === "time"
      ? String(state.phases[0]?.id || "")
      : selection.scope,
  );
  const [anchor, setAnchor] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState("");
  const [calendarVersion, setCalendarVersion] = useState(0);
  const window = M.statisticsWindow(state.sessions, state.phases, dates);
  const from =
    dates.preset === "custom"
      ? dates.from || ""
      : window.from
        ? localDay(window.from)
        : "";
  const to =
    dates.preset === "custom"
      ? dates.to || ""
      : window.until
        ? localDay(window.until - 1)
        : "";
  let records = 0;
  try {
    records = M.statisticsWindow(
      state.sessions,
      state.phases,
      tab === "dates" ? dates : { scope: phase },
    ).items.length;
  } catch {}
  function select(day: string) {
    if (anchor === null) {
      setAnchor(day);
      setDates({ scope: "time", preset: "custom", from: day, to: day });
    } else {
      setDates({
        scope: "time",
        preset: "custom",
        from: day < anchor ? day : anchor,
        to: day < anchor ? anchor : day,
      });
      setAnchor(null);
    }
  }
  return (
    <Sheet
      stable
      title={title}
      visible={visible}
      onClose={onClose}
      footer={
        <View style={{ gap: 10 }}>
          <Text
            style={[
              styles.muted,
              { textAlign: title === tr("Даты и периоды") ? "left" : "right" },
            ]}
          >
            {appLocale.count(records, "records")}
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button label={tr("Отмена")} onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={tr("Применить")}
                disabled={tab === "phases" && !phase}
                tone="primary"
                onPress={() => {
                  onApply(tab === "dates" ? dates : { scope: phase });
                  onClose();
                }}
              />
            </View>
          </View>
        </View>
      }
    >
      <View style={[styles.row, { borderBottomWidth: 1, borderColor: P.line }]}>
        {[
          ["dates", "Даты", "calendarRange"],
          ["phases", "Периоды", "layers"],
        ].map(([id, label, icon]) => (
          <Pressable
            accessibilityRole="button"
            key={id}
            onPress={() => setTab(id)}
            style={{ flex: 1, alignItems: "center", paddingTop: 12, gap: 12 }}
          >
            <View style={styles.row}>
              <Icon name={icon} size={17} />
              <Text style={{ color: tab === id ? P.coral : P.muted }}>
                {tr(label)}
              </Text>
            </View>
            <View
              style={{
                width: 92,
                height: 2,
                backgroundColor: tab === id ? P.coral : "transparent",
              }}
            />
          </Pressable>
        ))}
      </View>
      {tab === "dates" ? (
        <>
          <View style={styles.row}>
            {[
              ["7", "7 дней"],
              ["30", "30 дней"],
              ["90", "90 дней"],
              ["all", "Всё время"],
            ].map(([preset, label]) => (
              <Pressable
                accessibilityRole="button"
                key={preset}
                onPress={() => {
                  setDates({ scope: "time", preset });
                  setAnchor(null);
                }}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor:
                    dates.preset === preset ? P.coralSoft : P.surface,
                }}
              >
                <Text style={{ fontSize: 12, color: P.coral }}>
                  {tr(label)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={[
              styles.row,
              { borderWidth: 1, borderColor: P.line, borderRadius: 12 },
            ]}
          >
            {[
              ["Начало", from],
              ["Завершение", to],
            ].map(([label, day]) => (
              <Pressable
                accessibilityRole="button"
                key={label}
                onPress={() => {
                  if (day) {
                    setCalendarMonth(day);
                    setCalendarVersion((x) => x + 1);
                  }
                }}
                style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={styles.muted}>{tr(label)}</Text>
                <Text>{day ? moment(parseDay(day)) : "—"}</Text>
              </Pressable>
            ))}
          </View>
          <Calendar
            key={calendarVersion}
            from={from}
            to={to}
            initialMonth={calendarMonth || from}
            onSelect={select}
          />
        </>
      ) : state.phases.length ? (
        state.phases.map((p) => (
          <Pressable
            accessibilityRole="button"
            key={p.id}
            onPress={() => setPhase(String(p.id))}
            style={[
              styles.row,
              {
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: P.line,
              },
            ]}
          >
            <Icon
              name={M.phaseAppearance(p).icon}
              color={M.phaseAppearance(p).color}
            />
            <View style={{ flex: 1 }}>
              <Text>{p.title}</Text>
              <Text style={styles.muted}>
                {moment(p.startedAt)} —{" "}
                {p.endedAt ? moment(p.endedAt) : tr("сейчас")}
              </Text>
            </View>
            {phase === String(p.id) ? <Icon name="check" /> : null}
          </Pressable>
        ))
      ) : (
        <Text style={styles.muted}>{tr("Периодов пока нет")}</Text>
      )}
    </Sheet>
  );
}
