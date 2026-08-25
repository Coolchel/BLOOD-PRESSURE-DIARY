import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Palette } from '@/constants/design';
import { runAutoBackup } from '@/data/auto-backup';
import { initializeDatabase } from '@/data/database';

/** Обновляет копию в «Файлах» при каждом запуске — на случай, если измерения добавляли давно. */
function AutoBackupOnLaunch() {
  const db = useSQLiteContext();

  useEffect(() => {
    void runAutoBackup(db);
  }, [db]);

  return null;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Palette.background,
      card: Palette.background,
      primary: Palette.coral,
      text: Palette.text,
      border: Palette.line,
    },
  };

  return (
    <SQLiteProvider databaseName="blood-pressure-diary.db" onInit={initializeDatabase}>
      <AutoBackupOnLaunch />
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: Palette.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="new-measurement"
            options={{
              animation: 'slide_from_bottom',
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="measurement/[id]"
            options={{ animation: 'slide_from_right', headerShown: false }}
          />
          <Stack.Screen
            name="phase/[id]"
            options={{ animation: 'slide_from_right', headerShown: false }}
          />
          <Stack.Screen
            name="phase-editor"
            options={{
              animation: 'slide_from_bottom',
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
