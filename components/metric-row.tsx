import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { AppSymbolName } from '@/components/ui/icon-types';
import { Palette, Radius, Spacing } from '@/constants/design';

type MetricRowProps = {
  icon: AppSymbolName;
  iconColor: string;
  label: string;
  value?: number;
  unit: string;
  onPress: () => void;
};

export function MetricRow({ icon, iconColor, label, value, unit, onPress }: MetricRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${value ?? 'Добавить'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: `${iconColor}14` }]}>
        <IconSymbol name={icon} size={23} color={iconColor} weight="semibold" />
      </View>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={[styles.value, value === undefined && styles.placeholder]}>
        {value ?? 'Добавить'}
      </Text>
      <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 13,
    borderRadius: Radius.medium,
  },
  pressed: {
    backgroundColor: 'rgba(255, 94, 87, 0.06)',
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  labelWrap: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  unit: {
    color: Palette.muted,
    fontSize: 12,
  },
  value: {
    color: Palette.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  placeholder: {
    color: Palette.coral,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
  },
});

