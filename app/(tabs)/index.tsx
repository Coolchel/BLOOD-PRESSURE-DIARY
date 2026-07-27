import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { MeasurementCard } from '@/components/measurement-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeeklyChart } from '@/components/weekly-chart';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { useMeasurements } from '@/hooks/use-measurements';

export default function HomeScreen() {
  const { measurements, loading } = useMeasurements(30);
  const latest = measurements[0];
  const recent = measurements.slice(0, 7);
  const average =
    recent.length > 0
      ? {
          systolic: Math.round(recent.reduce((sum, item) => sum + item.systolic, 0) / recent.length),
          diastolic: Math.round(
            recent.reduce((sum, item) => sum + item.diastolic, 0) / recent.length,
          ),
          pulse: Math.round(recent.reduce((sum, item) => sum + item.pulse, 0) / recent.length),
        }
      : undefined;

  function addMeasurement() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/new-measurement');
  }

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ДНЕВНИК ЗДОРОВЬЯ</Text>
          <Text style={styles.title}>Давление</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Последнее измерение</Text>
        {latest ? (
          <Text style={styles.sectionMeta}>
            {new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
              new Date(latest.measuredAt),
            )}
          </Text>
        ) : null}
      </View>

      {latest ? (
        <MeasurementCard
          measurement={latest}
          onPress={() =>
            router.push({ pathname: '/measurement/[id]', params: { id: String(latest.id) } })
          }
        />
      ) : (
        <GlassCard contentStyle={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{loading ? 'Загружаем…' : 'Пока нет измерений'}</Text>
          <Text style={styles.emptyText}>Добавьте первую запись — это займёт меньше минуты.</Text>
        </GlassCard>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={addMeasurement}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <View style={styles.addIcon}>
          <IconSymbol name="plus" size={22} color={Palette.coral} weight="semibold" />
        </View>
        <Text style={styles.addText}>Новое измерение</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Динамика</Text>
        <Text style={styles.sectionMeta}>{recent.length} измерений</Text>
      </View>
      <GlassCard contentStyle={styles.chartCard}>
        <WeeklyChart maxPoints={7} measurements={measurements} />
      </GlassCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Средние значения</Text>
        <Text style={styles.sectionMeta}>последние 7</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCoral]}>
          <IconSymbol name="arrow.up.circle" size={20} color={Palette.coral} />
          <Text style={styles.statValue}>{average?.systolic ?? '—'}</Text>
          <Text style={styles.statLabel}>Систолическое</Text>
        </View>
        <View style={[styles.statCard, styles.statOrange]}>
          <IconSymbol name="arrow.down.circle" size={20} color={Palette.orange} />
          <Text style={styles.statValue}>{average?.diastolic ?? '—'}</Text>
          <Text style={styles.statLabel}>Диастолическое</Text>
        </View>
        <View style={styles.statCard}>
          <IconSymbol name="waveform.path.ecg" size={20} color="#6D78A8" />
          <Text style={styles.statValue}>{average?.pulse ?? '—'}</Text>
          <Text style={styles.statLabel}>Пульс</Text>
        </View>
      </View>
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
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionMeta: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyCard: {
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '600',
  },
  emptyText: {
    maxWidth: 250,
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  addButton: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: Spacing.lg,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coral,
    ...Shadow.button,
  },
  addIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: Palette.white,
  },
  addText: {
    color: Palette.white,
    fontSize: 17,
    fontWeight: '700',
  },
  chartCard: {
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
  },
  statCard: {
    flex: 1,
    minHeight: 126,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 13,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(244,245,248,0.9)',
    ...Shadow.card,
  },
  statCoral: {
    backgroundColor: Palette.coralSoft,
  },
  statOrange: {
    backgroundColor: Palette.orangeSoft,
  },
  statValue: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 10,
    lineHeight: 13,
  },
});
