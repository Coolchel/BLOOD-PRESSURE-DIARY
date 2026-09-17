export type PhaseKind = 'clean' | 'coffee' | 'energy' | 'alcohol' | 'mixed';

export type ExperimentPhase = {
  id: number;
  kind: PhaseKind;
  title: string;
  startedAt: string;
  endedAt: string | null;
  note: string;
};

export type PhaseStats = {
  count: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  wellbeing: number;
  averages: { systolic: number; diastolic: number; pulse: number; wellbeing: number };
};

export type PhaseWithStats = ExperimentPhase & { stats: PhaseStats };

export const PHASE_KINDS: {
  kind: PhaseKind;
  label: string;
  hint: string;
  color: string;
  soft: string;
}[] = [
  {
    kind: 'clean',
    label: 'Без всего',
    hint: 'Ни кофе, ни энергетиков, ни алкоголя',
    color: '#2AAE8C',
    soft: 'rgba(42,174,140,0.12)',
  },
  {
    kind: 'coffee',
    label: 'Кофе',
    hint: 'Кофе без остального',
    color: '#8B5E3C',
    soft: 'rgba(139,94,60,0.12)',
  },
  {
    kind: 'energy',
    label: 'Энергетик',
    hint: 'Энергетические напитки',
    color: '#E7A82F',
    soft: 'rgba(231,168,47,0.15)',
  },
  {
    kind: 'alcohol',
    label: 'Алкоголь',
    hint: 'Спиртное без остального',
    color: '#7A6BD6',
    soft: 'rgba(122,107,214,0.13)',
  },
  {
    kind: 'mixed',
    label: 'Всё вместе',
    hint: 'Кофе, энергетик и алкоголь',
    color: '#FF5E57',
    soft: 'rgba(255,94,87,0.12)',
  },
];

export function phaseKindInfo(kind: PhaseKind) {
  return PHASE_KINDS.find((item) => item.kind === kind) ?? PHASE_KINDS[0];
}

/** Измерение принадлежит периоду, если попало в его интервал; открытый период не имеет конца. */
export function isInsidePhase(measuredAt: string, phase: ExperimentPhase) {
  if (measuredAt < phase.startedAt) return false;
  return phase.endedAt === null || measuredAt < phase.endedAt;
}

export function findPhaseFor(measuredAt: string, phases: ExperimentPhase[]) {
  return phases.find((phase) => isInsidePhase(measuredAt, phase)) ?? null;
}
