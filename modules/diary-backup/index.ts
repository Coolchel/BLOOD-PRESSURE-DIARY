import { requireOptionalNativeModule } from 'expo-modules-core';

export type PickedBackupDirectory = { uri: string; label: string; bookmark: string };
type DiaryBackupModule = {
  pickDirectoryAsync(initialUri: string | null): Promise<PickedBackupDirectory | null>;
  readAsync(bookmark: string): Promise<string | null>;
  existsAsync(bookmark: string): Promise<boolean>;
  writeAsync(bookmark: string, content: string): Promise<void>;
  deleteAsync(bookmark: string): Promise<void>;
  saveExcelAsync(uri: string, name: string): Promise<boolean>;
  openDirectoryAsync(uri: string, bookmark: string | null): Promise<void>;
};

// Expo Go can keep using the default folder; persistent external access requires a native build.
export default requireOptionalNativeModule<DiaryBackupModule>('DiaryBackup');
