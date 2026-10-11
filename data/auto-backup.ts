import type { SQLiteDatabase } from 'expo-sqlite';

import { buildBackupPayload, countMeasurements, getSetting, resetDiaryData, setSetting } from '@/data/database';
import {
  clearBackupFiles, consolidateLegacyBackupFiles, defaultBackupLocation, deleteBackupFile, parseBackupLocation,
  readBackupFile, sameBackupLocation, writeBackupFile, type BackupLocation,
} from '@/data/backup-storage';

const ENABLED_KEY = 'auto_backup_enabled';
const LAST_RUN_KEY = 'auto_backup_last_run';
const LOCATION_KEY = 'auto_backup_location';
const ERROR_KEY = 'auto_backup_error';
export const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type AutoBackupResult = 'written' | 'disabled' | 'empty' | 'recent' | 'failed';
let pending: Promise<unknown> = Promise.resolve();

// Launch, foreground and folder changes share one queue: a second opening cannot pass the same gate.
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const task = pending.then(work, work);
  pending = task.catch(() => undefined);
  return task;
}

export function waitForBackupOperations(): Promise<unknown> { return pending; }

export function factoryResetDiary(db: SQLiteDatabase) {
  return serialize(async () => {
    const rollback = await clearBackupFiles(await getBackupLocation(db));
    try { await resetDiaryData(db); }
    catch (error) { await rollback(); throw error; }
  });
}

export async function isAutoBackupEnabled(db: SQLiteDatabase) {
  return (await getSetting(db, ENABLED_KEY)) !== 'off';
}

export function setAutoBackupEnabled(db: SQLiteDatabase, enabled: boolean) {
  return serialize(() => setSetting(db, ENABLED_KEY, enabled ? 'on' : 'off'));
}

export async function getLastAutoBackupAt(db: SQLiteDatabase) {
  const raw = await getSetting(db, LAST_RUN_KEY);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getBackupLocation(db: SQLiteDatabase): Promise<BackupLocation> {
  return parseBackupLocation(await getSetting(db, LOCATION_KEY));
}

export async function getBackupError(db: SQLiteDatabase) {
  return await getSetting(db, ERROR_KEY);
}

export async function readStoredBackup(db: SQLiteDatabase) {
  const content = await readBackupFile(await getBackupLocation(db));
  return content === null ? null : JSON.parse(content) as unknown;
}

/** Called only on launch / foreground, counting full 24 hours since the last successful write. */
export function runAutoBackup(db: SQLiteDatabase, now = Date.now()): Promise<AutoBackupResult> {
  return serialize(async () => {
    try {
      const legacyAt = await consolidateLegacyBackupFiles();
      if (legacyAt && !(await getLastAutoBackupAt(db))) await setSetting(db, LAST_RUN_KEY, legacyAt);
      if (!(await isAutoBackupEnabled(db))) return 'disabled';
      const previousAt = await getLastAutoBackupAt(db);
      if (previousAt && now - previousAt.getTime() < BACKUP_INTERVAL_MS) return 'recent';
      if ((await countMeasurements(db)) === 0) return 'empty';

      const payload = { ...await buildBackupPayload(db), exportedAt: new Date(now).toISOString() };
      const location = await getBackupLocation(db);
      const previousCopy = await readBackupFile(location);
      await writeBackupFile(location, JSON.stringify(payload, null, 2));
      try {
        await setSetting(db, LAST_RUN_KEY, payload.exportedAt);
      } catch (error) {
        // The file and its schedule must advance together, including a settings write failure.
        if (previousCopy !== null) await writeBackupFile(location, previousCopy);
        else await deleteBackupFile(location);
        throw error;
      }
      await setSetting(db, ERROR_KEY, '');
      return 'written';
    } catch {
      // Keep the timestamp unchanged on failure, so the next opening can retry.
      try { await setSetting(db, ERROR_KEY, 'Не удалось обновить копию. Проверьте доступ к выбранной папке.'); } catch {}
      return 'failed';
    }
  });
}

export class BackupDestinationExistsError extends Error {
  constructor() { super('В выбранной папке уже есть резервная копия.'); }
}

/** Move the saved snapshot without rebuilding it or resetting the 24-hour timestamp. */
export function changeBackupLocation(db: SQLiteDatabase, destination: BackupLocation, overwrite = false) {
  return serialize(async () => {
    const source = await getBackupLocation(db);
    if (sameBackupLocation(source, destination)) {
      // Reselecting an iOS folder renews its bookmark without touching the snapshot.
      await setSetting(db, LOCATION_KEY, JSON.stringify(destination));
      await setSetting(db, ERROR_KEY, '');
      return;
    }
    const current = await readBackupFile(source);
    const existing = await readBackupFile(destination);
    if (current !== null && existing !== null && !overwrite) throw new BackupDestinationExistsError();
    let wroteDestination = false, removedSource = false;
    try {
      if (current !== null) {
        await writeBackupFile(destination, current);
        wroteDestination = true;
        await deleteBackupFile(source);
        removedSource = true;
      }
      await setSetting(db, LOCATION_KEY, JSON.stringify(destination));
      if (current === null && existing !== null) {
        const at = (JSON.parse(existing) as { exportedAt?: string }).exportedAt;
        if (at && !Number.isNaN(Date.parse(at))) await setSetting(db, LAST_RUN_KEY, at);
      }
      await setSetting(db, ERROR_KEY, '');
    } catch (error) {
      // Failed moves preserve the old folder selection and both pre-existing files.
      if (removedSource && current !== null) await writeBackupFile(source, current);
      if (wroteDestination) {
        if (existing !== null) await writeBackupFile(destination, existing);
        else await deleteBackupFile(destination);
      }
      await setSetting(db, LOCATION_KEY, JSON.stringify(source.kind === 'default' ? defaultBackupLocation() : source));
      throw error;
    }
  });
}
