export type MeasurementMode = 'single' | 'series';

export type Reading = {
  systolic: number;
  diastolic: number;
  pulse: number;
};

export type MeasurementReading = Reading & { measuredAt?: string };

export type MeasurementDraft = {
  measuredAt: Date;
  wellbeing: number;
  tags: string[];
  note: string;
  mode: MeasurementMode;
  readings: MeasurementReading[];
};
