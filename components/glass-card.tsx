import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/design';

type GlassCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
}>;

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 36,
}: GlassCardProps) {
  return (
    <View style={[styles.shell, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? intensity : 20}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tint} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surface,
    ...Shadow.card,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});
