import type { SQLiteDatabase } from 'expo-sqlite';

import { getSetting, setSetting } from '@/data/database';
import { languages, savedLanguage, systemLanguage, type LanguageCode } from '../design-lab/i18n';

export const LANGUAGE_SETTING = 'interface_language';

export async function loadAppLanguage(db: SQLiteDatabase, systemLocale?: string | null) {
  const saved = savedLanguage(await getSetting(db, LANGUAGE_SETTING));
  return { language: saved ?? systemLanguage(systemLocale), manual: saved !== null };
}

export async function saveAppLanguage(db: SQLiteDatabase, language: LanguageCode) {
  if (!languages.some(option => option.code === language)) throw new Error('Unsupported language');
  await setSetting(db, LANGUAGE_SETTING, JSON.stringify({ version: 1, language }));
}
