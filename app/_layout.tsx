import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Palette } from '@/constants/design';
import { initializeDatabase } from '@/data/database';

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
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
