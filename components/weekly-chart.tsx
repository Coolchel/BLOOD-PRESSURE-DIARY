import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Palette } from '@/constants/design';
import type { MeasurementSummary } from '@/types/measurement';

export type ChartMetric = 'pressure' | 'pulse' | 'wellbeing';

type WeeklyChartProps = {
  measurements: MeasurementSummary[];
  metric?: ChartMetric;
  maxPoints?: number;
};

type Series = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

const WIDTH = 340;
const HEIGHT = 190;
const PLOT_LEFT = 42;
const PLOT_RIGHT = 328;
const CHART_TOP = 18;
const CHART_BOTTOM = 132;

function makeDomain(values: number[], metric: ChartMetric) {
  if (metric === 'wellbeing') {
    return { min: 1, max: 10, ticks: [1, 5, 10] };
  }

  const step = 10;
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let min = Math.max(0, Math.floor((rawMin - step) / step) * step);
  let max = Math.ceil((rawMax + step) / step) * step;
  if (max - min < 40) max = min + 40;
  const middle = Math.round((min + (max - min) / 2) / step) * step;
  return { min, max, ticks: [min, middle, max] };
}

function formatAxisDate(iso: string) {
  const date = new Date(iso);
  return {
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date),
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
}

export function WeeklyChart({
  measurements,
  metric = 'pressure',
  maxPoints,
}: WeeklyChartProps) {
  const selected = maxPoints ? measurements.slice(0, maxPoints) : measurements;
  const points = selected.slice().reverse();
  const series: Series[] =
    metric === 'pressure'
      ? [
          {
            key: 'systolic',
            label: 'Систолическое',
            color: Palette.coral,
            values: points.map((item) => item.systolic),
          },
          {
            key: 'diastolic',
            label: 'Диастолическое',
            color: Palette.orange,
            values: points.map((item) => item.diastolic),
          },
        ]
      : metric === 'pulse'
        ? [
            {
              key: 'pulse',
              label: 'Пульс',
              color: '#6D78A8',
              values: points.map((item) => item.pulse),
            },
          ]
        : [
            {
              key: 'wellbeing',
              label: 'Самочувствие',
              color: '#E7A82F',
              values: points.map((item) => item.wellbeing),
            },
          ];

  if (!points.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Добавьте измерение, чтобы увидеть динамику</Text>
      </View>
    );
  }

  const domain = makeDomain(
    series.flatMap((item) => item.values),
    metric,
  );
  const xStep = (PLOT_RIGHT - PLOT_LEFT) / Math.max(points.length - 1, 1);
  const xFor = (index: number) =>
    points.length === 1 ? (PLOT_LEFT + PLOT_RIGHT) / 2 : PLOT_LEFT + index * xStep;
  const yFor = (value: number) =>
    CHART_BOTTOM -
    ((Math.min(domain.max, Math.max(domain.min, value)) - domain.min) /
      (domain.max - domain.min)) *
      (CHART_BOTTOM - CHART_TOP);
  const pathFor = (values: number[]) =>
    values
      .map(
        (value, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`,
      )
      .join(' ');
  const labelEvery = Math.max(1, Math.ceil((points.length - 1) / 4));
  const unit = metric === 'pressure' ? 'мм' : metric === 'pulse' ? 'уд/м' : 'балл';

  return (
    <View>
      <View style={styles.legend}>
        {series.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Svg
        accessibilityLabel={`График: ${series.map((item) => item.label).join(', ')}`}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%">
        <Defs>
          <SvgGradient id={`area-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={series[0].color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={series[0].color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        <SvgText fill={Palette.subtle} fontSize={8} textAnchor="end" x={34} y={10}>
          {unit}
        </SvgText>
        {domain.ticks.map((tick) => (
          <G key={tick}>
            <Line
              stroke="rgba(112,120,136,0.14)"
              strokeDasharray="4 6"
              x1={PLOT_LEFT}
              x2={PLOT_RIGHT}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <SvgText
              fill={Palette.muted}
              fontSize={9}
              fontWeight="500"
              textAnchor="end"
              x={34}
              y={yFor(tick) + 3}>
              {tick}
            </SvgText>
          </G>
        ))}

        {series[0].values.length > 1 ? (
          <Path
            d={`${pathFor(series[0].values)} L ${xFor(series[0].values.length - 1)} ${CHART_BOTTOM} L ${xFor(0)} ${CHART_BOTTOM} Z`}
            fill={`url(#area-${metric})`}
          />
        ) : null}

        {series.map((item) => (
          <G key={item.key}>
            <Path
              d={pathFor(item.values)}
              fill="none"
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
            />
            {item.values.map((value, index) => (
              <Circle
                cx={xFor(index)}
                cy={yFor(value)}
                fill={Palette.white}
                key={`${item.key}-${points[index].id}`}
                r={points.length > 14 ? 2.2 : 3.8}
                stroke={item.color}
                strokeWidth={points.length > 14 ? 1.6 : 2.4}
              />
            ))}
          </G>
        ))}

        {points.map((item, index) => {
          const shouldLabel =
            index === 0 || index === points.length - 1 || index % labelEvery === 0;
          if (!shouldLabel) return null;
          const label = formatAxisDate(item.measuredAt);
          return (
            <G key={`label-${item.id}`}>
              <SvgText
                fill={Palette.muted}
                fontSize={8.5}
                fontWeight="600"
                textAnchor="middle"
                x={xFor(index)}
                y={158}>
                {label.date}
              </SvgText>
              <SvgText
                fill={Palette.subtle}
                fontSize={8}
                textAnchor="middle"
                x={xFor(index)}
                y={172}>
                {label.time}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 5,
    marginLeft: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  empty: {
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 14,
  },
});
