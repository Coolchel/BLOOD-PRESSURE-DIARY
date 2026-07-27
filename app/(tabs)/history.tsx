import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MeasurementCard } from '@/components/measurement-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Shadow, Spacing } from '@/constants/design';
import { useMeasurements } from '@/hooks/use-measurements';

export default function HistoryScreen() {
  const { measurements, loading } = useMeasurements(200);

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ВСЕ ЗАПИСИ</Text>
          <Text style={styles.title}>История</Text>
        </View>
        <Pressable
          accessibilityLabel="Добавить измерение"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/new-measurement');
          }}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
          <IconSymbol name="plus" size={24} color={Palette.white} weight="semibold" />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.count}>{measurements.length}</Text>
        <Text style={styles.countLabel}>
          {measurements.length === 1 ? 'измерение' : 'измерений'} сохранено
        </Text>
      </View>

      <View style={styles.list}>
        {measurements.map((measurement) => (
          <MeasurementCard
            key={measurement.id}
            measurement={measurement}
            onPress={() =>
              router.push({
                pathname: '/measurement/[id]',
                params: { id: String(measurement.id) },
              })
            }
          />
        ))}
      </View>

      {!loading && measurements.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>История пока пустая</Text>
          <Text style={styles.emptyText}>Добавь первое измерение, и оно появится здесь.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Palette.coral,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  title: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.1,
    marginTop: 2,
  },
  add: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Palette.coral,
    ...Shadow.button,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginBottom: 12,
  },
  count: {
    color: Palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  countLabel: {
    color: Palette.muted,
    fontSize: 13,
  },
  list: {
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 70,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 7,
  },
});
