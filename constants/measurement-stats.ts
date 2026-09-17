import type { PhaseStats } from '@/types/experiment';
import type { MeasurementSummary } from '@/types/measurement';

export function measurementStats(measurements: MeasurementSummary[]): PhaseStats {
  const mean = (pick: (item: MeasurementSummary) => number) =>
    measurements.length
      ? measurements.reduce((sum, item) => sum + pick(item), 0) / measurements.length
      : 0;

  const averages = {
    systolic: mean((item) => item.averages.systolic),
    diastolic: mean((item) => item.averages.diastolic),
    pulse: mean((item) => item.averages.pulse),
    wellbeing: mean((item) => item.wellbeing),
  };
  return {
    count: measurements.length,
    systolic: Math.round(averages.systolic),
    diastolic: Math.round(averages.diastolic),
    pulse: Math.round(averages.pulse),
    wellbeing: Math.round(averages.wellbeing * 10) / 10,
    averages,
  };
}
