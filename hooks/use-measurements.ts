import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getMeasurements } from '@/data/database';
import type { MeasurementSummary } from '@/types/measurement';

export function useMeasurements(limit = 60) {
  const db = useSQLiteContext();
  const [measurements, setMeasurements] = useState<MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMeasurements(await getMeasurements(db, limit));
    } finally {
      setLoading(false);
    }
  }, [db, limit]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { measurements, loading, refresh };
}
