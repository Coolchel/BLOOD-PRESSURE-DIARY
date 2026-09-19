import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoralBackground } from '@/components/coral-background';
import { Palette, Spacing } from '@/constants/design';

type ScreenShellProps = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}>;

const MINIMUM_BOTTOM_SPACING = 116;

export function ScreenShell({ children, scroll = true, contentContainerStyle }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const requestedBottomSpacing = StyleSheet.flatten(contentContainerStyle)?.paddingBottom;
  const safeBottomSpacing = Math.max(
    MINIMUM_BOTTOM_SPACING,
    insets.bottom,
    typeof requestedBottomSpacing === 'number' ? requestedBottomSpacing : 0,
  );
  const content = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle, { paddingBottom: safeBottomSpacing }]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <CoralBackground />
      <KeyboardAvoidingView
        // На iOS вставки под клавиатуру берёт на себя сам ScrollView: он же поднимает
        // активное поле над ней. Дублировать это отступом контейнера нельзя — экран дёргается.
        behavior={Platform.OS === 'ios' && !scroll ? 'padding' : undefined}
        style={styles.fill}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: MINIMUM_BOTTOM_SPACING,
  },
});
