"use no memo";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "@/components/clarity/ui";
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <BottomNav
          selected={state.routes[state.index].name}
          bottom={insets.bottom}
          onSelect={(name) => {
            const route = state.routes.find((r) => r.name === name);
            if (!route) return;
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) navigation.navigate(route.name);
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#F6F3EC" },
        lazy: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="statistics" />
      <Tabs.Screen name="phases" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
