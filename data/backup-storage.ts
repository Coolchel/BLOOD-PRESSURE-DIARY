import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import DiaryBackup from '@/modules/diary-backup';

export const BACKUP_FILENAME = 'davlenie-autobackup.json';
export type BackupLocation =
  | { kind: 'default'; label: string }
  | { kind: 'android'; uri: string; label: string }
  | { kind: 'ios'; uri: string; label: string; bookmark: string };

export function defaultBackupLocation(): BackupLocation {
  return { kind: 'default', label: Platform.OS === 'ios' ? 'На iPhone / Давление' : 'На телефоне / Давление' };
}

export function parseBackupLocation(raw: string | null): BackupLocation {
  if (!raw) return defaultBackupLocation();
  const value = JSON.parse(raw) as Partial<BackupLocation> & { bookmark?: string; uri?: string };
  if (value.kind === 'default') return defaultBackupLocation();
  if (typeof value.label !== 'string' || !value.label.trim() || typeof value.uri !== 'string') {
    throw new Error('Не удалось прочитать папку копии. Выберите её снова.');
  }
  if (value.kind === 'android' && value.uri.startsWith('content://')) {
    return { kind: 'android', uri: value.uri, label: value.label };
  }
  if (value.kind === 'ios' && value.uri.startsWith('file://') && typeof value.bookmark === 'string' && value.bookmark) {
    return { kind: 'ios', uri: value.uri, label: value.label, bookmark: value.bookmark };
  }
  throw new Error('Не удалось прочитать папку копии. Выберите её снова.');
}

function iosStorage() {
  if (!DiaryBackup) throw new Error('Выбор постоянной папки на iPhone доступен в сборке приложения. В Expo Go используйте папку по умолчанию.');
  return DiaryBackup;
}

export async function pickBackupLocation(current: BackupLocation): Promise<BackupLocation | null> {
  if (Platform.OS === 'ios') {
    const picked = await iosStorage().pickDirectoryAsync(current.kind === 'default' ? null : current.uri);
    if (!picked) return null;
    if (picked.uri.replace(/\/$/, '') === Paths.document.uri.replace(/\/$/, '')) return defaultBackupLocation();
    return { kind: 'ios', ...picked };
  }
  if (Platform.OS !== 'android') throw new Error('Выбор папки доступен в приложении на телефоне.');
  try {
    const folder = await Directory.pickDirectoryAsync(current.kind === 'default' ? undefined : current.uri);
    let label = folder.uri;
    try { label = decodeURIComponent(folder.uri.split('/tree/')[1] || folder.uri).replace(/^primary:/, 'На телефоне / '); } catch {}
    return { kind: 'android', uri: folder.uri, label };
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return null;
    throw error;
  }
}

function androidFile(location: Extract<BackupLocation, { kind: 'android' }>): File | null {
  return new Directory(location.uri).list().find((item): item is File => item instanceof File && item.name === BACKUP_FILENAME) ?? null;
}

/** Opening the folder must also work when its JSON file cannot be parsed. */
export async function hasBackupFile(location: BackupLocation): Promise<boolean> {
  if (location.kind === 'ios') return iosStorage().existsAsync(location.bookmark);
  const file = location.kind === 'default' ? new File(Paths.document, BACKUP_FILENAME) : androidFile(location);
  return file?.exists ?? false;
}

export async function readBackupFile(location: BackupLocation): Promise<string | null> {
  if (location.kind === 'ios') return iosStorage().readAsync(location.bookmark);
  const file = location.kind === 'default' ? new File(Paths.document, BACKUP_FILENAME) : androidFile(location);
  return file?.exists ? file.text() : null;
}

export async function writeBackupFile(location: BackupLocation, content: string): Promise<void> {
  if (location.kind === 'ios') return iosStorage().writeAsync(location.bookmark, content);
  let file = location.kind === 'default' ? new File(Paths.document, BACKUP_FILENAME) : androidFile(location);
  const previous = file?.exists ? await file.text() : null;
  if (!file && location.kind === 'android') file = new Directory(location.uri).createFile(BACKUP_FILENAME, 'application/json');
  if (!file) throw new Error('Папка копии недоступна.');
  try {
    file.write(content);
  } catch (error) {
    // A provider error must not turn the only good copy into a partial JSON.
    try { if (previous !== null) file.write(previous); else if (file.exists) file.delete(); } catch {}
    throw error;
  }
}

export async function deleteBackupFile(location: BackupLocation): Promise<void> {
  if (location.kind === 'ios') return iosStorage().deleteAsync(location.bookmark);
  const file = location.kind === 'default' ? new File(Paths.document, BACKUP_FILENAME) : androidFile(location);
  if (file?.exists) file.delete();
}

/** Remove only app-owned backup names; the returned rollback restores exact snapshot bytes. */
export async function clearBackupFiles(location: BackupLocation): Promise<() => Promise<void>> {
  const managed = [
    ...Paths.document.list().filter((item): item is File => item instanceof File
      && (item.name === BACKUP_FILENAME || /^davlenie-autobackup-\d{4}-\d{2}-\d{2}\.json$/.test(item.name))),
    ...Paths.cache.list().filter((item): item is File => item instanceof File
      && (item.name === BACKUP_FILENAME || /^davlenie-export-\d{4}-\d{2}-\d{2}(?:-\d+)?\.(?:xlsx|json)$/.test(item.name))),
  ];
  const snapshots = await Promise.all(managed.map(async file => ({
    file,
    content: file.name.endsWith('.xlsx') ? await file.bytes() : await file.text(),
  })));
  const external = location.kind === 'default' ? null : await readBackupFile(location);
  const deleted: typeof snapshots = [];
  let deletedExternal = false;
  const rollback = async () => {
    if (deletedExternal && external !== null) await writeBackupFile(location, external);
    for (const item of deleted) item.file.write(item.content);
  };
  try {
    for (const item of snapshots) { item.file.delete(); deleted.push(item); }
    if (external !== null) { await deleteBackupFile(location); deletedExternal = true; }
  } catch (error) { await rollback(); throw error; }
  return rollback;
}

export function sameBackupLocation(first: BackupLocation, second: BackupLocation): boolean {
  return first.kind === 'default' && second.kind === 'default'
    || first.kind !== 'default' && second.kind !== 'default' && first.uri.replace(/\/$/, '') === second.uri.replace(/\/$/, '');
}

/** Consolidate only the files previously managed by this app, after retaining their latest snapshot. */
export async function consolidateLegacyBackupFiles(): Promise<string | null> {
  const dated = Paths.document.list()
    .filter((item): item is File => item instanceof File && /^davlenie-autobackup-\d{4}-\d{2}-\d{2}\.json$/.test(item.name))
    .sort((a, b) => b.name.localeCompare(a.name));
  if (!dated.length) return null;
  const current = new File(Paths.document, BACKUP_FILENAME);
  const content = current.exists ? await current.text() : await dated[0].text();
  const payload = JSON.parse(content) as { app?: string; exportedAt?: string };
  if (payload.app !== 'Давление') throw new Error('Не удалось прочитать прежнюю копию.');
  if (!current.exists) current.write(content);
  for (const file of dated) file.delete();
  return payload.exportedAt ?? null;
}
