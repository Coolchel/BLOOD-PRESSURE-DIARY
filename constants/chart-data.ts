import type { TimeWindow } from '@/constants/statistics-data';
import type { ExperimentPhase } from '@/types/experiment';
import { isInsidePhase } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export function chartTimeline(
  measurements: MeasurementSummary[],
  phases: ExperimentPhase[] = [],
  maxPoints?: number,
  window?: TimeWindow,
) {
  const ordered = measurements.filter((item) => {
    const time = Date.parse(item.measuredAt);
    return !window || (time >= window.from && time <= window.until);
  }).sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt) || b.id - a.id);
  const points = (maxPoints ? ordered.slice(0, maxPoints) : ordered).reverse();
  let from = window?.from ?? (points.length ? Date.parse(points[0].measuredAt) : 0);
  let until = window?.until ?? (points.length ? Date.parse(points[points.length - 1].measuredAt) : 1);
  if (until <= from) { from -= 43200000; until += 43200000; }
  const fraction = (time: number) => (time - from) / (until - from);
  const bands = phases.flatMap((phase) => {
    const start = Math.max(from, Date.parse(phase.startedAt));
    const end = Math.min(until, phase.endedAt === null ? until : Date.parse(phase.endedAt));
    const boundaryPoint = end === start && points.some((point) =>
      Date.parse(point.measuredAt) === start && isInsidePhase(point.measuredAt, phase));
    return end > start || boundaryPoint ? [{ phase, start: fraction(start), end: fraction(end) }] : [];
  }).sort((a, b) => a.start - b.start || a.phase.id - b.phase.id);
  return { points, from, until, fraction, bands };
}
