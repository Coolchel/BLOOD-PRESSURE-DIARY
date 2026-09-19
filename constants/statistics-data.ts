import { measurementStats } from '@/constants/measurement-stats';
import type { ExperimentPhase } from '@/types/experiment';
import { isInsidePhase } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export type StatisticsInterval = 'week' | 'month' | 'quarter' | 'all';
export type TimeWindow = { from: number; until: number };

export const STATISTICS_INTERVALS: { key: StatisticsInterval; label: string; days: number | null }[] = [
  { key: 'week', label: 'Неделя', days: 7 },
  { key: 'month', label: 'Месяц', days: 30 },
  { key: 'quarter', label: '3 месяца', days: 90 },
  { key: 'all', label: 'Всё', days: null },
];

export function statisticsWindow(interval: StatisticsInterval, now: number): TimeWindow | undefined {
  const days = STATISTICS_INTERVALS.find((item) => item.key === interval)?.days;
  return days == null ? undefined : { from: now - days * 86400000, until: now };
}

export function measurementsInWindow(measurements: MeasurementSummary[], window?: TimeWindow) {
  return window ? measurements.filter((item) => {
    const time = Date.parse(item.measuredAt);
    return time >= window.from && time <= window.until;
  }) : measurements;
}

export function statisticsForPhase(measurements: MeasurementSummary[], phase: ExperimentPhase) {
  return measurementStats(measurements.filter((item) => isInsidePhase(item.measuredAt, phase)));
}
