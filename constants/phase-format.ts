import type { PhaseStats, PhaseWithStats } from '@/types/experiment';

const DAY_MS = 24 * 60 * 60 * 1000;

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

export function formatPhaseRange(startedAt: string, endedAt: string | null) {
  const from = shortDate.format(new Date(startedAt));
  return `${from} — ${endedAt ? shortDate.format(new Date(endedAt)) : 'сейчас'}`;
}

export function phaseDays(startedAt: string, endedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

export function pluralDays(days: number) {
  const tail = days % 10;
  const teen = days % 100;
  if (teen >= 11 && teen <= 14) return `${days} дней`;
  if (tail === 1) return `${days} день`;
  if (tail >= 2 && tail <= 4) return `${days} дня`;
  return `${days} дней`;
}

export function pluralRecords(count: number) {
  const tail = count % 10;
  const teen = count % 100;
  if (teen >= 11 && teen <= 14) return `${count} записей`;
  if (tail === 1) return `${count} запись`;
  if (tail >= 2 && tail <= 4) return `${count} записи`;
  return `${count} записей`;
}

/** Общая база сравнения: все «чистые» периоды, взвешенные по количеству записей. */
export function cleanBaseline(phases: PhaseWithStats[]): PhaseStats | null {
  const clean = phases.filter((phase) => phase.kind === 'clean' && phase.stats.count > 0);
  const total = clean.reduce((sum, phase) => sum + phase.stats.count, 0);
  if (!total) return null;

  const weighted = (pick: (stats: PhaseStats) => number) =>
    clean.reduce((sum, phase) => sum + pick(phase.stats) * phase.stats.count, 0) / total;

  return {
    count: total,
    systolic: Math.round(weighted((stats) => stats.systolic)),
    diastolic: Math.round(weighted((stats) => stats.diastolic)),
    pulse: Math.round(weighted((stats) => stats.pulse)),
    wellbeing: Math.round(weighted((stats) => stats.wellbeing) * 10) / 10,
  };
}

export function formatDelta(delta: number, fractional = false) {
  const value = fractional ? Math.round(delta * 10) / 10 : Math.round(delta);
  if (value === 0) return 'без изменений';
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}
