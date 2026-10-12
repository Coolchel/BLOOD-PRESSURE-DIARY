"use no memo";
import {
  useState,
  useEffect,
  useMemo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  Modal,
  Animated,
  PanResponder,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
  useWindowDimensions,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { router, useRootNavigationState } from "expo-router";
import { Palette as P } from "@/constants/design";
import { appLocale, countRecords, tr } from "@/localization";
import { useLanguage } from "@/localization/provider";
import * as M from "../../design-lab/model";
import { iconPaths } from "./icon-paths";
import { useDiary } from "./diary-provider";
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export function CText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[styles.text, style]} />;
}
export function Icon({
  name,
  color = P.coral,
  size = 22,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0 }}
    >
      <Path
        d={iconPaths[name] || iconPaths.layers}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
  active = false,
  count = 0,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}: ${count}` : label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.iconButton, active && { backgroundColor: P.coralSoft, borderColor: P.coral }]}
    >
      <Icon name={icon} />
      {count > 0 ? <View style={styles.badge}><CText style={{ fontSize: 10, color: P.white }}>{count}</CText></View> : null}
    </Pressable>
  );
}
export function Card({
  children,
  onPress,
  style,
}: PropsWithChildren<{ onPress?: () => void; style?: ViewStyle }>) {
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, style]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );
}
export function Section({
  children,
  right,
}: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.section}>
      <View style={styles.accent} />
      <CText style={styles.sectionTitle}>{children}</CText>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}
export function Button({
  label,
  icon,
  onPress,
  tone = "green",
  disabled = false,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  tone?: "green" | "blue" | "gold" | "purple" | "red" | "primary";
  disabled?: boolean;
}) {
  const colors = {
    green: P.coral,
    blue: P.pulse,
    gold: P.wellbeing,
    purple: "#6B5C7D",
    red: P.danger,
    primary: P.white,
  };
  const backgrounds = {
    green: P.coralSoft,
    blue: "#E7EEF1",
    gold: P.wellbeingSoft,
    purple: "#ECE9F1",
    red: "#F5ECE9",
    primary: P.coral,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: backgrounds[tone], opacity: disabled ? 0.45 : 1 },
      ]}
    >
      {icon ? <Icon name={icon} color={colors[tone]} size={20} /> : null}
      <CText style={{ color: colors[tone], fontSize: 14 }}>{label}</CText>
    </Pressable>
  );
}
export function Empty({
  title,
  subtitle,
  icon = "layers",
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={34} />
      <CText style={{ fontSize: 19, textAlign: "center" }}>{title}</CText>
      {subtitle ? <CText style={styles.muted}>{subtitle}</CText> : null}
    </View>
  );
}
export function ErrorText({ error }: { error: string }) {
  return error ? (
    <CText accessibilityRole="alert" style={styles.error}>
      {tr(error)}
    </CText>
  ) : null;
}
export const moment = (value: string | number | Date, full = false) =>
  appLocale.date(value, {
    day: "numeric",
    month: full ? "long" : "short",
    year: "numeric",
  });
export const time = (value: string | number | Date) =>
  appLocale.date(value, { hour: "2-digit", minute: "2-digit" });
export function DateStamp({
  value,
  mode,
  count,
}: {
  value: string;
  mode?: M.Session["mode"];
  count?: number;
}) {
  return (
    <View style={[styles.spread, { alignItems: "flex-start" }]}>
      <View style={{ flex: 1 }}>
        <CText style={{ fontSize: 14 }}>
          {appLocale.date(value, { day: "numeric", month: "long" })}{" "}
          <CText style={{ fontSize: 12, color: P.muted }}>
            {appLocale.date(value, { year: "numeric" })}
          </CText>
        </CText>
        {mode ? (
          <View style={[styles.row, { gap: 5, marginTop: 5 }]}>
            <Icon
              name={mode === "series" ? "layers" : "singleReading"}
              size={14}
              color={P.muted}
            />
            <CText style={{ fontSize: 11, color: P.muted }}>
              {mode === "series"
                ? tr("Серия · ") + appLocale.count(count || 0, "readings")
                : tr("Одиночный замер")}
            </CText>
          </View>
        ) : null}
      </View>
      <CText style={{ fontSize: 22 }}>{time(value)}</CText>
    </View>
  );
}
export function Measures({
  values,
  size = 42,
  labels = true,
}: {
  values: Partial<M.Values> | null;
  size?: number;
  labels?: boolean;
}) {
  const { width } = useWindowDimensions();
  if (width <= 340 && size === 42) size = 38;
  const number = (key: M.Metric) =>
    values && values[key] !== undefined
      ? appLocale.number(values[key]!, key === "wellbeing" ? 1 : 0)
      : "—";
  return (
    <View>
      <View style={{ alignItems: "center", paddingVertical: 14 }}>
        <View style={styles.row}>
          <CText style={{ color: P.coral, fontSize: size }}>
            {number("systolic")}
          </CText>
          <CText style={{ fontSize: size - 10, color: P.subtle }}>/</CText>
          <CText style={{ color: P.orange, fontSize: size }}>
            {number("diastolic")}
          </CText>
        </View>
        {labels ? <CText style={styles.muted}>{tr("Давление")}</CText> : null}
      </View>
      <View style={[styles.row, styles.metricDivider]}>
        {(["pulse", "wellbeing"] as const).map((metric) => (
          <View key={metric} style={{ flex: 1, alignItems: "center" }}>
            <View style={styles.row}>
              <Icon
                name={metric === "pulse" ? "heartPulse" : "wellbeingGauge"}
                color={metric === "pulse" ? P.pulse : P.wellbeing}
                size={19}
              />
              <CText
                style={{
                  fontSize: size - 14,
                  color: metric === "pulse" ? P.pulse : P.wellbeing,
                }}
              >
                {number(metric)}
              </CText>
            </View>
            {labels ? (
              <CText style={styles.muted}>
                {tr(metric === "pulse" ? "Пульс" : "Самочувствие")}
              </CText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
export function DetailMeasures({ session, onPress }: { session: M.Session; onPress?: () => void }) {
  return <Card onPress={onPress}>
    <DateStamp value={session.measuredAt} />
    <Measures values={{ ...M.summary(session), wellbeing: session.wellbeing }} />
  </Card>;
}
export function PhaseCard({
  phase,
  detailed = false,
  onPress,
}: {
  phase: M.Phase;
  detailed?: boolean;
  onPress?: () => void;
}) {
  const { state } = useDiary();
  const { width } = useWindowDimensions();
  const appearance = M.phaseAppearance(phase),
    values = M.stats(state.sessions.filter((s) => M.inside(s, phase)));
  return (
    <Card
      onPress={onPress}
      style={{ borderLeftColor: appearance.color, borderLeftWidth: 3 }}
    >
      <View style={styles.row}>
        <Icon name={appearance.icon} color={appearance.color} size={25} />
        <CText style={{ flex: 1, fontSize: detailed ? 26 : 16 }}>
          {phase.title}
        </CText>
        {!detailed && onPress ? (
          <Icon name="chevron" size={15} color={P.muted} />
        ) : null}
        {M.phaseStatus(phase) === "scheduled" ? (
          <CText style={styles.muted}>{tr("Запланирован")}</CText>
        ) : null}
      </View>
      {detailed ? (
        <>
          <View style={[styles.row, { marginTop: 14, alignItems: "baseline" }]}>
            <CText style={{ width: 88, fontSize: 13 }}>{tr("Начало")}</CText>
            <CText style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>
              {moment(phase.startedAt)} {time(phase.startedAt)}
            </CText>
          </View>
          <View style={[styles.row, { alignItems: "baseline" }]}>
            <CText style={{ width: 88, fontSize: 13 }}>
              {tr("Завершение")}
            </CText>
            <CText style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>
              {phase.endedAt
                ? moment(phase.endedAt) + " " + time(phase.endedAt)
                : tr("сейчас")}
            </CText>
          </View>
        </>
      ) : (
        <View style={[styles.spread, { marginTop: 12, flexWrap: "wrap" }]}>
          <View style={[styles.row, { gap: 6 }]}>
            <Icon name="calendarRange" size={15} color={P.muted} />
            <CText style={{ fontSize: 13 }}>
              {appLocale.date(phase.startedAt, {
                day: "numeric",
                month: "short",
              })}{" "}
              —{" "}
              {phase.endedAt
                ? appLocale.date(phase.endedAt, {
                    day: "numeric",
                    month: "short",
                  })
                : tr("сейчас")}
            </CText>
          </View>
          {values.count ? (
            <CText style={{ fontSize: 11, color: P.muted }}>
              {countRecords(values.count)}
            </CText>
          ) : null}
        </View>
      )}
      {phase.note ? (
        <CText
          numberOfLines={detailed ? undefined : 1}
          ellipsizeMode="tail"
          style={{
            marginTop: 12,
            color: detailed ? P.text : P.muted,
            fontSize: 13,
          }}
        >
          {phase.note}
        </CText>
      ) : null}
      {values.count ? (
        <View
          style={{
            borderTopWidth: 1,
            borderColor: P.line,
            marginTop: 14,
            paddingTop: 12,
          }}
        >
          <View
            style={[styles.row, { justifyContent: "space-between", gap: 5 }]}
          >
            <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
              <CText
                style={{ fontSize: width <= 370 ? 10 : 11, color: P.muted, textAlign: "center", minHeight: 28, lineHeight: 14 }}
              >
                {tr("Давление")}
              </CText>
              <View style={[styles.row, { gap: 3, minHeight: 34 }]}>
                <CText
                  style={{ color: P.coral, fontSize: width <= 370 ? 18 : 23 }}
                >
                  {values.systolic}
                </CText>
                <CText style={{ color: P.subtle, fontSize: 16 }}>/</CText>
                <CText
                  style={{ color: P.orange, fontSize: width <= 370 ? 18 : 23 }}
                >
                  {values.diastolic}
                </CText>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
              <CText
                style={{ fontSize: width <= 370 ? 10 : 11, color: P.muted, textAlign: "center", minHeight: 28, lineHeight: 14 }}
              >
                {tr("Пульс")}
              </CText>
              <CText
                style={{ color: P.pulse, fontSize: width <= 370 ? 22 : 25, lineHeight: 34 }}
              >
                {values.pulse}
              </CText>
            </View>
            <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
              <CText
                style={{ fontSize: width <= 370 ? 10 : 11, color: P.muted, textAlign: "center", minHeight: 28, lineHeight: 14 }}
              >
                {tr("Самочувствие")}
              </CText>
              <CText
                style={{ color: P.wellbeing, fontSize: width <= 370 ? 22 : 25, lineHeight: 34 }}
              >
                {appLocale.number(values.wellbeing, 1)}
              </CText>
            </View>
          </View>
          <CText
            style={[
              styles.muted,
              {
                marginTop: 6,
                textAlign: "center",
                fontSize: 11,
                opacity: 0.75,
              },
            ]}
          >
            {tr("Средние за период")}
          </CText>
        </View>
      ) : (
        <CText style={[styles.muted, { marginTop: 14 }]}>
          {tr("Измерений в периоде пока нет")}
        </CText>
      )}
    </Card>
  );
}
export function BottomNav({
  selected,
  bottom = 0,
  onSelect,
}: {
  selected?: string;
  bottom?: number;
  onSelect?: (name: string) => void;
}) {
  const { historyFor } = useDiary();
  const root = useRootNavigationState(),
    tabs = root?.routes.find((route) => route.name === "(tabs)")?.state;
  const selectedTab = selected || tabs?.routes[tabs.index || 0]?.name;
  useLanguage();
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(bottom, 8) }]}>
      {[
        ["index", "Главная", "home"],
        ["history", "История", "history"],
        ["statistics", "Статистика", "chart"],
        ["phases", "Периоды", "layers"],
        ["settings", "Настройки", "settings"],
      ].map(([id, label, icon]) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedTab === id }}
          onPress={() => {
            historyFor(null);
            if (onSelect) onSelect(id);
            else
              router.navigate(
                id === "index" ? "/" : (("/" + id) as "/history"),
              );
          }}
          style={styles.navItem}
        >
          <View
            style={{
              width: 42,
              height: 26,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selectedTab === id ? P.coral : "transparent",
            }}
          >
            <Icon
              name={icon}
              color={selectedTab === id ? P.white : P.muted}
              size={21}
            />
          </View>
          <CText
            style={{ fontSize: 10, color: selectedTab === id ? P.coral : P.muted }}
          >
            {tr(label)}
          </CText>
        </Pressable>
      ))}
    </View>
  );
}
export function Screen({
  title,
  back,
  actions,
  children,
  footer,
  sticky,
  nav = false,
}: PropsWithChildren<{
  title: string;
  back?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  sticky?: ReactNode;
  nav?: boolean;
}>) {
  useLanguage();
  return (
    <SafeAreaView
      edges={nav || footer ? ["top", "bottom"] : ["top"]}
      style={{ flex: 1, backgroundColor: P.background }}
    >
      <View style={styles.header}>
        {back ? (
          <IconButton
            icon="back"
            label={tr("Назад")}
            onPress={() => router.back()}
          />
        ) : null}
        <CText style={{ fontSize: back ? 24 : 28, flex: 1 }}>{title}</CText>
        {actions}
      </View>
      {sticky ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>{sticky}</View>
      ) : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28, gap: 18 }}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ padding: 16, borderTopWidth: 1, borderColor: P.line }}>
          {footer}
        </View>
      ) : null}
      {nav ? <BottomNav /> : null}
    </SafeAreaView>
  );
}
export function Sheet({
  title,
  visible,
  onClose,
  children,
  footer,
  stable = false,
  dismissible = true,
}: PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
  footer?: ReactNode;
  stable?: boolean;
  dismissible?: boolean;
}>) {
  const { height } = useWindowDimensions();
  const [offset] = useState(() => new Animated.Value(0));
  useEffect(() => {
    offset.setValue(0);
    return () => offset.stopAnimation();
  }, [visible, offset]);
  const drag = useMemo(() => {
    return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => visible && dismissible && gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx) * 1.3,
    onMoveShouldSetPanResponderCapture: (_, gesture) => visible && dismissible && gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx) * 1.3,
    onPanResponderGrant: () => Keyboard.dismiss(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (dismissible && (gesture.dy > 80 || (gesture.dy > 25 && gesture.vy > 0.8))) {
        Animated.timing(offset, { toValue: height, duration: 180, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onClose();
        });
      } else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start(),
    });
  }, [visible, dismissible, offset, height, onClose]);
  const requestClose = () => { if (dismissible) onClose(); };
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={requestClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("Закрыть")}
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        />
        <AnimatedSafeAreaView
          edges={["bottom"]}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            stable && { height: Math.min(height * 0.88, 680) },
            { transform: [{ translateY: offset }] },
          ]}
        >
          <View testID="sheet-drag-handle" {...drag.panHandlers} style={{ paddingTop: 8, gap: 12 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: P.line, alignSelf: "center" }} />
            <View style={styles.spread}>
              <CText style={{ fontSize: 22, flex: 1 }}>{title}</CText>
              <IconButton icon="close" label={tr("Закрыть")} onPress={requestClose} />
            </View>
          </View>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingTop: 8 }}
          >
            {children}
          </ScrollView>
          {footer}
        </AnimatedSafeAreaView>
      </View>
    </Modal>
  );
}
export function Collapse({
  title,
  children,
  initiallyOpen = true,
  count,
}: PropsWithChildren<{
  title: string;
  initiallyOpen?: boolean;
  count?: number;
}>) {
  const [open, setOpen] = useState(initiallyOpen);
  const [previousInitial, setPreviousInitial] = useState(initiallyOpen);
  if (previousInitial !== initiallyOpen) {
    setPreviousInitial(initiallyOpen);
    setOpen(initiallyOpen);
  }
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
      >
        <Section
          right={
            <View style={styles.row}>
              {count !== undefined ? (
                <CText style={styles.muted}>{count}</CText>
              ) : null}
              <Icon name="chevronDown" size={17} />
            </View>
          }
        >
          {title}
        </Section>
      </Pressable>
      {open ? <View style={{ gap: 12 }}>{children}</View> : null}
    </View>
  );
}
export const styles = StyleSheet.create({
  text: { fontFamily: "Manrope", fontSize: 14, color: P.text },
  muted: { color: P.muted, fontSize: 12, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  spread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 14,
    backgroundColor: P.surface,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: P.coral, flexShrink: 1 },
  accent: { width: 3, height: 18, borderRadius: 2, backgroundColor: "#939B83" },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { position: "absolute", right: -3, top: -3, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, backgroundColor: P.coral, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: P.background },
  header: {
    minHeight: 74,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: P.line,
  },
  button: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  metricDivider: { borderTopWidth: 1, borderColor: P.line, paddingTop: 14 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 14 },
  error: {
    color: P.danger,
    fontSize: 13,
    lineHeight: 19,
    padding: 10,
    backgroundColor: "#F5ECE9",
    borderRadius: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#262F3155",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    minHeight: "42%",
    backgroundColor: P.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 12,
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: P.background,
    borderTopWidth: 1,
    borderColor: P.line,
    paddingTop: 10,
    paddingBottom: 8,
  },
  navItem: { alignItems: "center", gap: 5, minHeight: 44, minWidth: 54 },
});
