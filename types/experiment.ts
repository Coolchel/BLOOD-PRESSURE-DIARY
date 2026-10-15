export type PhaseKind = 'clean' | 'coffee' | 'energy' | 'alcohol' | 'mixed' | 'custom';

export type ExperimentPhase = {
  id: number;
  kind: PhaseKind;
  title: string;
  icon?: string;
  color?: string;
  startedAt: string;
  endedAt: string | null;
  note: string;
};
