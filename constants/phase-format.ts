import type { PhaseStats, PhaseWithStats } from '@/types/experiment';
import { appLocale, tr, getLocale, formatNumber } from '@/localization';

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatPhaseRange(startedAt: string, endedAt: string | null) {
  const shortDate = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' });
  const from = shortDate.format(new Date(startedAt));
  return `${from} — ${endedAt ? shortDate.format(new Date(endedAt)) : tr('сейчас')}`;
}

export function phaseDays(startedAt: string, endedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

export function pluralDays(days: number) {
  if (appLocale.language !== 'ru') {
    const words = { en: ['day', 'days'], fr: ['jour', 'jours'], es: ['día', 'días'], de: ['Tag', 'Tage'] };
    return formatNumber(days) + ' ' + words[appLocale.language][new Intl.PluralRules(getLocale()).select(days) === 'one' ? 0 : 1];
  }
  const tail = days % 10;
  const teen = days % 100;
  if (teen >= 11 && teen <= 14) return `${days} дней`;
  if (tail === 1) return `${days} день`;
  if (tail >= 2 && tail <= 4) return `${days} дня`;
  return `${days} дней`;
}

export function pluralRecords(count: number) {
  return appLocale.count(count, 'records');
}

/** Общая база сравнения: все «чистые» периоды, взвешенные по количеству записей. */
export function cleanBaseline(phases: PhaseWithStats[]): PhaseStats | null {
  const clean = phases.filter((phase) => phase.kind === 'clean' && phase.stats.count > 0);
  const total = clean.reduce((sum, phase) => sum + phase.stats.count, 0);
  if (!total) return null;

  const weighted = (pick: (stats: PhaseStats) => number) =>
    clean.reduce((sum, phase) => sum + pick(phase.stats) * phase.stats.count, 0) / total;

  const averages = {
    systolic: weighted((stats) => stats.averages.systolic),
    diastolic: weighted((stats) => stats.averages.diastolic),
    pulse: weighted((stats) => stats.averages.pulse),
    wellbeing: weighted((stats) => stats.averages.wellbeing),
  };
  return {
    count: total,
    systolic: Math.round(averages.systolic),
    diastolic: Math.round(averages.diastolic),
    pulse: Math.round(averages.pulse),
    wellbeing: Math.round(averages.wellbeing * 10) / 10,
    averages,
  };
}

export function formatDelta(delta: number, fractional = false) {
  const value = fractional ? Math.round(delta * 10) / 10 : Math.round(delta);
  if (value === 0) return tr('без изменений');
  return `${value > 0 ? '+' : '−'}${formatNumber(Math.abs(value), fractional ? 1 : 0)}`;
}
