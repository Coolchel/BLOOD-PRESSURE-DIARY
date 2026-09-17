import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { countMeasurements, getMeasurements } from '@/data/database';
import type { MeasurementQuery, MeasurementSummary } from '@/types/measurement';

export function useMeasurements(limit = 60, { sort, from, until }: MeasurementQuery = {}) {
  const db = useSQLiteContext();
  const [measurements, setMeasurements] = useState<MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const query = { sort, from, until };
      const [items, count] = await Promise.all([getMeasurements(db, limit, query), countMeasurements(db, query)]);
      if (currentRequest !== requestId.current) return;
      setMeasurements(items);
      setTotal(count);
    } catch {
      if (currentRequest === requestId.current) setError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [db, limit, sort, from, until]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => { requestId.current += 1; };
    }, [refresh]),
  );

  return { measurements, loading, total, error, refresh };
}
