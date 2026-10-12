"use no memo";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { Palette as P } from "@/constants/design";
import { appLocale, tr } from "@/localization";
import * as M from "../../design-lab/model";
import { CText as Text, Empty, styles, moment, time } from "./ui";

export function axisLabels(labels: string[], positions: number[]) {
  if (!labels.length) return [];
  const last = labels.length - 1;
  const bounds = (index: number) => {
    const width = Math.max(30, labels[index].length * 6.5);
    const left = positions[index] - (index === 0 ? 0 : index === last ? width : width / 2);
    return { left, right: left + width };
  };
  const result = [0];
  if (!last) return result;
  let right = bounds(0).right;
  const end = bounds(last).left;
  const step = Math.ceil(labels.length / 4);
  for (let index = step; index < last; index += step) {
    const label = bounds(index);
    if (label.left >= right + 12 && label.right <= end - 12) {
      result.push(index);
      right = label.right;
    }
  }
  result.push(last);
  return result;
}

export function Chart({
  sessions,
  metric = "pressure",
  onOpen,
}: {
  sessions: M.Session[];
  metric?: M.Preferences["chartMetric"];
  onOpen: (id: number) => void;
}) {
  if (!sessions.length)
    return <Empty title={tr("Нет записей в этом интервале")} />;
  const points = M.statisticsChartPoints(sessions),
    keys: ("systolic" | "diastolic" | "pulse")[] =
      metric === "pressure"
        ? ["systolic", "diastolic"]
        : metric === "combined"
          ? ["systolic", "diastolic", "pulse"]
          : [metric];
  const values = points.flatMap((p) => keys.map((k) => p[k])),
    low = Math.floor((Math.min(...values) - 5) / 10) * 10,
    high = Math.ceil((Math.max(...values) + 5) / 10) * 10;
  const x = (i: number) =>
      points.length === 1 ? 182 : 34 + (i * 300) / (points.length - 1),
    y = (value: number) => 205 - ((value - low) * 170) / (high - low);
  const color = { systolic: P.coral, diastolic: P.orange, pulse: P.pulse };
  const label = { systolic: "Верхнее", diastolic: "Нижнее", pulse: "Пульс" };
  const sameDay = points.every(
    (p) => moment(p.measuredAt) === moment(points[0].measuredAt),
  );
  const dates = points.map((p) => sameDay ? time(p.measuredAt) : appLocale.date(p.measuredAt, { day: "numeric", month: "short" }));
  const labels = axisLabels(dates, points.map((_, i) => x(i)));
  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.row, { justifyContent: "center" }]}>
        {keys.map((key) => (
          <View key={key} style={styles.row}>
            <View
              style={{ width: 15, height: 2, backgroundColor: color[key] }}
            />
            <Text style={{ fontSize: 11, color: P.muted }}>
              {tr(label[key])}
            </Text>
          </View>
        ))}
      </View>
      <Svg width="100%" height={254} viewBox="0 0 350 254">
        {Array.from({ length: 5 }, (_, i) => {
          const value = low + ((high - low) * i) / 4;
          return (
            <G key={i}>
              <Line
                x1={34}
                x2={334}
                y1={y(value)}
                y2={y(value)}
                stroke={P.line}
                strokeWidth={0.7}
              />
              <SvgText
                x={26}
                y={y(value) + 4}
                fontSize={10}
                fill={P.muted}
                textAnchor="end"
              >
                {appLocale.number(value)}
              </SvgText>
            </G>
          );
        })}
        {keys.map((key) => (
          <Path
            key={key}
            d={points
              .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`)
              .join(" ")}
            fill="none"
            stroke={color[key]}
            strokeWidth={1.8}
          />
        ))}
        {points.map((point, i) => (
          <G key={point.id}>
            {keys.map((key) => (
              <Circle
                key={key}
                cx={x(i)}
                cy={y(point[key])}
                r={3}
                fill={P.surface}
                stroke={color[key]}
                strokeWidth={1.5}
              />
            ))}
            {keys.map((key) => (
              <Circle
                key={"hit-" + key}
                testID={"chart-point-" + point.id + "-" + key}
                accessibilityLabel={
                  moment(point.measuredAt) + " " + time(point.measuredAt)
                }
                onPress={() => onOpen(point.id)}
                cx={x(i)}
                cy={y(point[key])}
                r={12}
                fill="transparent"
              />
            ))}
          </G>
        ))}
        {labels.map((i) => {
            const p = points[i];
            return (
              <SvgText
                key={p.id}
                x={x(i)}
                y={234}
                textAnchor={
                  i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
                }
                fontSize={10}
                fontFamily="Manrope"
                fill={P.muted}
              >
                {dates[i]}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
}
