import { Paths } from 'expo-file-system';
import DiaryBackup from '@/modules/diary-backup';
import type { BackupLocation } from '@/data/backup-storage';

function fileManager() {
  if (!DiaryBackup) throw new Error('Системное сохранение и просмотр папки доступны в сборке приложения на телефоне.');
  return DiaryBackup;
}

export async function saveExcelFile(uri: string, name: string) {
  return fileManager().saveExcelAsync(uri, name);
}

export async function openBackupDirectory(location: BackupLocation) {
  await fileManager().openDirectoryAsync(location.kind === 'default' ? Paths.document.uri : location.uri,
    location.kind === 'ios' ? location.bookmark : null);
}
