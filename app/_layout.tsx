import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { AppState, Platform, Pressable, Text, View } from "react-native";
import * as SystemUI from "expo-system-ui";
import "react-native-reanimated";

import { Palette } from "@/constants/design";
import { runAutoBackup } from "@/data/auto-backup";
import { initializeDatabase } from "@/data/database";
import { LanguageProvider } from "@/localization/provider";
import { DiaryProvider, useDiary } from "@/components/clarity/diary-provider";
import { tr } from "@/localization";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Palette.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Pressable accessibilityRole="button" onPress={retry}>
        <Text style={{ fontFamily: "Manrope", color: Palette.coral }}>
          {tr("Не удалось загрузить записи. Повторить")}
        </Text>
      </Pressable>
    </View>
  );
}

/** Проверяет суточный интервал при запуске и возвращении в приложение. */
function AutoBackupOnLaunch() {
  const db = useSQLiteContext();
  const { flush } = useDiary();

  useEffect(() => {
    const run = () => {
      void flush()
        .then(() => runAutoBackup(db))
        .catch(() => {});
    };
    run();
    let previous = AppState.currentState;
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active" && previous !== "active") run();
      previous = next;
    });
    return () => listener.remove();
  }, [db, flush]);

  return null;
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Palette.background);
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    Manrope: require("../design-lab/vendor/fonts/manrope.ttf"),
  });
  if (!fontsLoaded && !fontError) return null;
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
    <SQLiteProvider
      databaseName="blood-pressure-diary.db"
      onInit={initializeDatabase}
    >
      <LanguageProvider>
        <DiaryProvider>
          <AutoBackupOnLaunch />
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: Palette.background },
                animation: "default",
                // Only iOS uses a navigator gesture; Android keeps its system Back action.
                ...(Platform.OS === "ios"
                  ? {
                      gestureEnabled: true,
                      gestureDirection: "horizontal" as const,
                      fullScreenGestureEnabled: false,
                    }
                  : {}),
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="comparison"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="new-measurement"
                options={{
                  animation:
                    Platform.OS === "ios" ? "default" : "slide_from_bottom",
                  headerShown: false,
                  // A pushed screen supports the left-edge Back gesture on iOS.
                  presentation: Platform.OS === "ios" ? "card" : "modal",
                }}
              />
              <Stack.Screen
                name="measurement/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="phase/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="phase-editor"
                options={{
                  animation:
                    Platform.OS === "ios" ? "default" : "slide_from_bottom",
                  headerShown: false,
                  presentation: Platform.OS === "ios" ? "card" : "modal",
                }}
              />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </DiaryProvider>
      </LanguageProvider>
    </SQLiteProvider>
  );
}
