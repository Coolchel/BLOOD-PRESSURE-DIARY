import type { MeasurementQuery, MeasurementSort } from '@/types/measurement';

export type HistoryFilterState = {
  sort: MeasurementSort;
  startDate: Date | null;
  endDate: Date | null;
};

export const DEFAULT_HISTORY_FILTERS: HistoryFilterState = {
  sort: 'newest', startDate: null, endDate: null,
};

export const HISTORY_SORTS: { key: MeasurementSort; label: string }[] = [
  { key: 'newest', label: 'От нового к старому' },
  { key: 'oldest', label: 'От старого к новому' },
  { key: 'systolic-desc', label: 'Систолическое: сначала наибольшее' },
  { key: 'systolic-asc', label: 'Систолическое: сначала наименьшее' },
  { key: 'diastolic-desc', label: 'Диастолическое: сначала наибольшее' },
  { key: 'diastolic-asc', label: 'Диастолическое: сначала наименьшее' },
  { key: 'pulse-desc', label: 'Пульс: сначала наибольший' },
  { key: 'pulse-asc', label: 'Пульс: сначала наименьший' },
];

export function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function historyQuery(filters: HistoryFilterState): MeasurementQuery {
  const end = filters.endDate ? startOfDay(filters.endDate) : null;
  if (end) end.setDate(end.getDate() + 1);
  return {
    sort: filters.sort,
    from: filters.startDate ? startOfDay(filters.startDate).toISOString() : undefined,
    until: end?.toISOString(),
  };
}

export function historyFilterLabel(filters: HistoryFilterState) {
  const date = (value: Date) => new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(value);
  const period = filters.startDate && filters.endDate
    ? `${date(filters.startDate)} — ${date(filters.endDate)}`
    : filters.startDate ? `С ${date(filters.startDate)}`
    : filters.endDate ? `По ${date(filters.endDate)}` : 'Все даты';
  return `${HISTORY_SORTS.find((item) => item.key === filters.sort)?.label} · ${period}`;
}
