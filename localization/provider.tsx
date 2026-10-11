import { useLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Palette } from '@/constants/design';
import { create, systemLanguage, type LanguageCode } from '../design-lab/i18n';
import { appLocale } from './index';
import { loadAppLanguage, saveAppLanguage } from './preferences';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  resetLanguage: () => void;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const systemLocale = useLocales()[0]?.languageTag;
  const [language, updateLanguage] = useState(() => systemLanguage(systemLocale));
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const activate = useCallback((code: LanguageCode) => {
    appLocale.setLanguage(code);
    updateLanguage(code);
  }, []);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const preference = await loadAppLanguage(db, systemLocale);
      activate(preference.language);
      setReady(true);
    } catch { setFailed(true); }
  }, [db, systemLocale, activate]);

  useEffect(() => { void load(); }, [load]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    // Change the visible interface only after the explicit preference is saved.
    await saveAppLanguage(db, code);
    activate(code);
  }, [db, activate]);
  const resetLanguage = useCallback(() => activate(systemLanguage(systemLocale)), [activate, systemLocale]);

  if (!ready) {
    const initial = create(systemLanguage(systemLocale));
    return <View style={{ flex: 1, backgroundColor: Palette.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {failed ? <Pressable accessibilityRole="button" onPress={() => void load()}>
        <Text style={{ color: Palette.text }}>{initial.text('Не удалось загрузить настройки. Повторить')}</Text>
      </Pressable> : <ActivityIndicator color={Palette.coral} />}
    </View>;
  }
  return <LanguageContext.Provider value={{ language, setLanguage, resetLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  return context;
}
