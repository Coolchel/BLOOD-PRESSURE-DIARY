export type MeasurementMode = 'single' | 'series';

export type MeasurementSort =
  | 'newest' | 'oldest'
  | 'systolic-desc' | 'systolic-asc'
  | 'diastolic-desc' | 'diastolic-asc'
  | 'pulse-desc' | 'pulse-asc';

export type MeasurementQuery = {
  sort?: MeasurementSort;
  from?: string;
  until?: string;
};

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
  averages: Reading;
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
