import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  buildBackupPayload,
  countMeasurements,
  getSetting,
  setSetting,
} from '@/data/database';

const ENABLED_KEY = 'auto_backup_enabled';
const LAST_RUN_KEY = 'auto_backup_last_run';
const CURRENT_NAME = 'davlenie-autobackup.json';
const DATED_PREFIX = 'davlenie-autobackup-';
const KEEP_DATED_COPIES = 7;

export type AutoBackupResult = 'written' | 'disabled' | 'empty' | 'failed';

/** По умолчанию включено: смысл функции в том, чтобы копия существовала без участия человека. */
export async function isAutoBackupEnabled(db: SQLiteDatabase) {
  return (await getSetting(db, ENABLED_KEY)) !== 'off';
}

export async function setAutoBackupEnabled(db: SQLiteDatabase, enabled: boolean) {
  await setSetting(db, ENABLED_KEY, enabled ? 'on' : 'off');
}

export async function getLastAutoBackupAt(db: SQLiteDatabase) {
  const raw = await getSetting(db, LAST_RUN_KEY);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function datedName(date: Date) {
  return `${DATED_PREFIX}${date.toISOString().slice(0, 10)}.json`;
}

/** Оставляет только несколько самых свежих датированных копий, чтобы папка не разрасталась. */
function pruneDatedCopies() {
  const dated = Paths.document
    .list()
    .filter((item): item is File => item instanceof File)
    .filter((file) => file.name.startsWith(DATED_PREFIX) && file.name.endsWith('.json'))
    .sort((first, second) => second.name.localeCompare(first.name));

  for (const file of dated.slice(KEEP_DATED_COPIES)) {
    file.delete();
  }
}

/**
 * Пишет копию базы в папку приложения, видимую в «Файлах».
 * Никогда не бросает исключение: сбой копии не должен мешать сохранить измерение.
 */
export async function runAutoBackup(db: SQLiteDatabase): Promise<AutoBackupResult> {
  try {
    if (!(await isAutoBackupEnabled(db))) return 'disabled';

    // Пустой базой копию не затираем — иначе переустановка приложения уничтожит последний бэкап.
    if ((await countMeasurements(db)) === 0) return 'empty';

    const payload = await buildBackupPayload(db);
    const json = JSON.stringify(payload, null, 2);
    const now = new Date();

    new File(Paths.document, CURRENT_NAME).write(json);
    new File(Paths.document, datedName(now)).write(json);
    pruneDatedCopies();

    await setSetting(db, LAST_RUN_KEY, now.toISOString());
    return 'written';
  } catch (error) {
    console.error('Не удалось создать автоматическую копию:', error);
    return 'failed';
  }
}
