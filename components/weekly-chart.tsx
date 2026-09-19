import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgGradient,
  Line,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Palette } from '@/constants/design';
import { chartTimeline } from '@/constants/chart-data';
import { formatPhaseRange } from '@/constants/phase-format';
import type { TimeWindow } from '@/constants/statistics-data';
import type { ExperimentPhase } from '@/types/experiment';
import { phaseKindInfo } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export type ChartMetric = 'pressure' | 'pulse' | 'wellbeing';

type WeeklyChartProps = {
  measurements: MeasurementSummary[];
  metric?: ChartMetric;
  maxPoints?: number;
  phases?: ExperimentPhase[];
  pointSpacing?: 'time' | 'uniform';
  window?: TimeWindow;
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
  phases,
  pointSpacing = 'time',
  window,
}: WeeklyChartProps) {
  const { points, from, until, fraction, bands } = chartTimeline(measurements, phases, maxPoints, window);
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
  const xAt = (part: number) => PLOT_LEFT + part * (PLOT_RIGHT - PLOT_LEFT);
  const xFor = (index: number) =>
    xAt(
      pointSpacing === 'uniform'
        ? points.length === 1 ? 0.5 : index / (points.length - 1)
        : fraction(Date.parse(points[index].measuredAt)),
    );
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
  // Чем плотнее точки, тем меньше украшений: иначе линия превращается в кашу.
  const dense = points.length > 40;
  const compact = points.length > 14;
  const dotRadius = dense ? 0 : compact ? 2.2 : 3.8;
  const labelCount = Math.min(5, points.length);
  const axisLabels = Array.from({ length: labelCount }, (_, position) => {
    if (pointSpacing === 'uniform') {
      const pointIndex = labelCount === 1 ? 0 : Math.round(position * (points.length - 1) / (labelCount - 1));
      return {
        part: points.length === 1 ? 0.5 : pointIndex / (points.length - 1),
        time: Date.parse(points[pointIndex].measuredAt),
      };
    }
    const time = labelCount === 1
      ? Date.parse(points[0].measuredAt)
      : from + position * (until - from) / (labelCount - 1);
    return { part: fraction(time), time };
  });
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

        {bands.map((band) => {
          const left = xAt(band.start);
          const width = Math.max(1, xAt(band.end) - left);
          const info = phaseKindInfo(band.phase.kind);
          return (
            <G key={band.phase.id}>
              <Rect
                fill={info.soft}
                height={CHART_BOTTOM - CHART_TOP + 18}
                width={width}
                x={left}
                y={CHART_TOP - 10}
              />
              <Rect fill={info.color} height={2.5} width={width} x={left} y={CHART_BOTTOM + 6} />
            </G>
          );
        })}

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
              strokeWidth={dense ? 2 : 3}
            />
            {dotRadius > 0
              ? item.values.map((value, index) => (
                  <Circle
                    cx={xFor(index)}
                    cy={yFor(value)}
                    fill={Palette.white}
                    key={`${item.key}-${points[index].id}`}
                    r={dotRadius}
                    stroke={item.color}
                    strokeWidth={compact ? 1.6 : 2.4}
                  />
                ))
              : null}
          </G>
        ))}

        {axisLabels.map(({ part, time }, index) => {
          const label = formatAxisDate(new Date(time).toISOString());
          const anchor = index === 0 ? 'start' : index === axisLabels.length - 1 ? 'end' : 'middle';
          return (
            <G key={`label-${index}`}>
              <SvgText
                fill={Palette.muted}
                fontSize={8.5}
                fontWeight="600"
                textAnchor={anchor}
                x={xAt(part)}
                y={158}>
                {label.date}
              </SvgText>
              {compact ? null : (
                <SvgText
                  fill={Palette.subtle}
                  fontSize={8}
                  textAnchor={anchor}
                  x={xAt(part)}
                  y={172}>
                  {label.time}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
      {bands.length ? (
        <View style={styles.phaseLegend}>
          {bands.map(({ phase }) => (
            <View key={phase.id} style={styles.phaseLegendItem}>
              <View style={[styles.dot, { backgroundColor: phaseKindInfo(phase.kind).color }]} />
              <View style={styles.phaseLegendCopy}>
                <Text style={styles.legendText}>{phase.title}</Text>
                <Text style={styles.phaseRange}>{formatPhaseRange(phase.startedAt, phase.endedAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
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
  phaseLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 6, paddingBottom: 12 },
  phaseLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  phaseLegendCopy: { flexShrink: 1 },
  phaseRange: { color: Palette.subtle, fontSize: 10, marginTop: 2 },
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
