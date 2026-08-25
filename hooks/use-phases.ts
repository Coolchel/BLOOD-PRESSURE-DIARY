import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getPhases, getPhasesWithStats } from '@/data/database';
import type { ExperimentPhase, PhaseWithStats } from '@/types/experiment';

export function usePhases() {
  const db = useSQLiteContext();
  const [phases, setPhases] = useState<PhaseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setPhases(await getPhasesWithStats(db));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { phases, loading, refresh };
}

/** Только сами периоды, без агрегатов — для меток на карточках измерений. */
export function usePhaseList() {
  const db = useSQLiteContext();
  const [phases, setPhases] = useState<ExperimentPhase[]>([]);

  const refresh = useCallback(async () => {
    setPhases(await getPhases(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return phases;
}
