import type { SQLiteDatabase } from "expo-sqlite";

// Keep the queue through Fast Refresh too: Expo may reuse the same SQLite connection.
const key = Symbol.for("blood-pressure-diary.sqlite-writes");
const queues = ((
  globalThis as unknown as Record<symbol, Map<unknown, Promise<unknown>>>
)[key] ||= new Map());
export function withDiaryWrite<T>(
  db: SQLiteDatabase,
  operation: () => Promise<T>,
): Promise<T> {
  const identity = db.databasePath || db;
  const result = (queues.get(identity) || Promise.resolve())
    .catch(() => {})
    .then(operation);
  queues.set(identity, result);
  void result
    .finally(() => {
      if (queues.get(identity) === result) queues.delete(identity);
    })
    .catch(() => {});
  return result;
}
export function withDiaryTransaction<T>(
  db: SQLiteDatabase,
  operation: () => Promise<T>,
): Promise<T> {
  return withDiaryWrite(db, async () => {
    let result: T;
    await db.withTransactionAsync(async () => {
      result = await operation();
    });
    return result!;
  });
}
