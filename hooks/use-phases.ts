import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getPhases, getPhasesWithStats } from '@/data/database';
import type { ExperimentPhase, PhaseWithStats } from '@/types/experiment';

function usePhaseData<T>(load: (db: SQLiteDatabase) => Promise<T[]>) {
  const db = useSQLiteContext();
  const [phases, setPhases] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const result = await load(db);
      if (currentRequest === requestId.current) setPhases(result);
    } catch {
      if (currentRequest === requestId.current) setError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [db, load]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => { requestId.current += 1; };
    }, [refresh]),
  );

  return { phases, loading, error, refresh };
}

export function usePhases() {
  return usePhaseData<PhaseWithStats>(getPhasesWithStats);
}

/** Только сами периоды, без агрегатов — для меток на карточках измерений. */
export function usePhaseList() {
  return usePhaseData<ExperimentPhase>(getPhases);
}
