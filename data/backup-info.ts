export function backupFacts(payload: unknown) {
  const copy = payload as { app?: string; exportedAt?: string; sessions?: { mode: string; measured_at: string }[]; readings?: unknown[]; phases?: unknown[] } | null;
  if (!copy || copy.app !== 'Давление' || !Array.isArray(copy.sessions) || !Array.isArray(copy.readings)
    || !copy.exportedAt || Number.isNaN(Date.parse(copy.exportedAt))) throw new Error('Не удалось прочитать сохранённую копию.');
  const days = new Set(copy.sessions.map(item => {
    const date = new Date(item.measured_at);
    if (Number.isNaN(date.getTime())) throw new Error('В копии некорректная дата.');
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }));
  return { at: new Date(copy.exportedAt), records: copy.sessions.length, readings: copy.readings.length,
    series: copy.sessions.filter(item => item.mode === 'series').length, days: days.size, periods: copy.phases?.length ?? 0 };
}
