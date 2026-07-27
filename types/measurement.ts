export type MeasurementMode = 'single' | 'series';

export type Reading = {
  systolic: number;
  diastolic: number;
  pulse: number;
};

export type MeasurementDraft = {
  measuredAt: Date;
  wellbeing: number;
  tags: string[];
  note: string;
  mode: MeasurementMode;
  readings: Reading[];
};

export type MeasurementSummary = Reading & {
  id: number;
  measuredAt: string;
  wellbeing: number;
  tags: string[];
  note: string;
  mode: MeasurementMode;
  readingCount: number;
};

export type MeasurementDetails = MeasurementSummary & {
  readings: Reading[];
};

export const WELLBEING_TAGS = [
  'Нормально',
  'Спокойно',
  'Бодрость',
  'Усталость',
  'Слабость',
  'Сонливость',
  'Головная боль',
  'Головокружение',
  'Тошнота',
  'Одышка',
  'Сердцебиение',
  'Боль в груди',
  'Стресс',
  'После кофе',
  'После лекарства',
  'После нагрузки',
] as const;
