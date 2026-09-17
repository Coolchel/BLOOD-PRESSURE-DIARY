import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { countMeasurements, getMeasurements } from '@/data/database';
import type { MeasurementSummary } from '@/types/measurement';

export function useMeasurements(limit = 60) {
  const db = useSQLiteContext();
  const [measurements, setMeasurements] = useState<MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [items, count] = await Promise.all([getMeasurements(db, limit), countMeasurements(db)]);
      setMeasurements(items);
      setTotal(count);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [db, limit]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { measurements, loading, total, error, refresh };
}
