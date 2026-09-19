import type { MeasurementReading, Reading } from '@/types/measurement';

export type MeasurementEntryDraft = { values: Partial<Reading>; measuredAt: Date };

export function emptyMeasurementEntry(): MeasurementEntryDraft {
  return { values: {}, measuredAt: new Date() };
}

export function isEntryComplete(entry: MeasurementEntryDraft) {
  const { systolic, diastolic, pulse } = entry.values;
  return systolic !== undefined && diastolic !== undefined && pulse !== undefined;
}

export function isEntryValid(entry: MeasurementEntryDraft): boolean {
  const { systolic, diastolic, pulse } = entry.values;
  return isEntryComplete(entry) &&
    Number.isInteger(systolic) && systolic! >= 60 && systolic! <= 260 &&
    Number.isInteger(diastolic) && diastolic! >= 35 && diastolic! <= 160 &&
    systolic! > diastolic! &&
    Number.isInteger(pulse) && pulse! >= 30 && pulse! <= 220 &&
    !Number.isNaN(entry.measuredAt.getTime());
}

export function readingsFromEntries(entries: MeasurementEntryDraft[]): MeasurementReading[] {
  if (!entries.length || entries.length > 3 || entries.some((entry) => !isEntryValid(entry))) {
    throw new Error('invalid measurement entries');
  }
  return entries.map((entry) => ({
    systolic: entry.values.systolic!,
    diastolic: entry.values.diastolic!,
    pulse: entry.values.pulse!,
    measuredAt: entry.measuredAt.toISOString(),
  }));
}
