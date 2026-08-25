import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import {
  cleanBaseline,
  formatDelta,
  formatPhaseRange,
  phaseDays,
  pluralDays,
  pluralRecords,
} from '@/constants/phase-format';
import { usePhases } from '@/hooks/use-phases';
import type { PhaseStats, PhaseWithStats } from '@/types/experiment';
import { phaseKindInfo } from '@/types/experiment';

function toneFor(delta: number, higherIsBetter: boolean) {
  if (Math.round(delta * 10) === 0) return Palette.muted;
  const good = higherIsBetter ? delta > 0 : delta < 0;
  return good ? Palette.success : '#D93D43';
}

type ComparisonRowProps = {
  label: string;
  base: string;
  actual: string;
  delta: number;
  higherIsBetter: boolean;
  fractional?: boolean;
};

function ComparisonRow({
  label,
  base,
  actual,
  delta,
  higherIsBetter,
  fractional,
}: ComparisonRowProps) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareBase}>{base}</Text>
      <IconSymbol name="chevron.right" size={13} color={Palette.subtle} />
      <Text style={styles.compareActual}>{actual}</Text>
      <Text style={[styles.compareDelta, { color: toneFor(delta, higherIsBetter) }]}>
        {formatDelta(delta, fractional)}
      </Text>
    </View>
  );
}

function ComparisonBlock({ phase, baseline }: { phase: PhaseWithStats; baseline: PhaseStats }) {
  const info = phaseKindInfo(phase.kind);

  return (
    <View style={styles.compareBlock}>
      <View style={styles.compareHeader}>
        <View style={[styles.dot, { backgroundColor: info.color }]} />
        <Text style={styles.compareTitle}>{phase.title}</Text>
        <Text style={styles.compareCount}>{pluralRecords(phase.stats.count)}</Text>
      </View>
      <ComparisonRow
        actual={`${phase.stats.systolic}/${phase.stats.diastolic}`}
        base={`${baseline.systolic}/${baseline.diastolic}`}
        delta={phase.stats.systolic - baseline.systolic}
        higherIsBetter={false}
        label="Давление"
      />
      <ComparisonRow
        actual={String(phase.stats.pulse)}
        base={String(baseline.pulse)}
        delta={phase.stats.pulse - baseline.pulse}
        higherIsBetter={false}
        label="Пульс"
      />
      <ComparisonRow
        actual={String(phase.stats.wellbeing)}
        base={String(baseline.wellbeing)}
        delta={phase.stats.wellbeing - baseline.wellbeing}
        fractional
        higherIsBetter
        label="Самочувствие"
      />
    </View>
  );
}

function PhaseCard({ phase }: { phase: PhaseWithStats }) {
  const info = phaseKindInfo(phase.kind);
  const open = phase.endedAt === null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/phase/[id]', params: { id: String(phase.id) } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.stripe, { backgroundColor: info.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.kindChip, { backgroundColor: info.soft }]}>
            <Text style={[styles.kindChipText, { color: info.color }]}>{info.label}</Text>
          </View>
          {open ? (
            <View style={styles.liveChip}>
              <Text style={styles.liveChipText}>идёт сейчас</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.cardTitle}>{phase.title}</Text>
        <Text style={styles.cardMeta}>
          {formatPhaseRange(phase.startedAt, phase.endedAt)} ·{' '}
          {pluralDays(phaseDays(phase.startedAt, phase.endedAt))} ·{' '}
          {pluralRecords(phase.stats.count)}
        </Text>

        {phase.stats.count > 0 ? (
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>
                {phase.stats.systolic}/{phase.stats.diastolic}
              </Text>
              <Text style={styles.cardStatLabel}>мм рт. ст.</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{phase.stats.pulse}</Text>
              <Text style={styles.cardStatLabel}>пульс</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{phase.stats.wellbeing}</Text>
              <Text style={styles.cardStatLabel}>самочувствие</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.cardEmpty}>Пока нет измерений в этом периоде</Text>
        )}
      </View>
      <IconSymbol
        name="chevron.right"
        size={16}
        color={Palette.subtle}
        style={styles.cardChevron}
      />
    </Pressable>
  );
}

export default function PhasesScreen() {
  const { phases, loading } = usePhases();
  const baseline = cleanBaseline(phases);
  const compared = phases.filter((phase) => phase.kind !== 'clean' && phase.stats.count > 0);

  function startPhase() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/phase-editor');
  }

  return (
    <ScreenShell>
      <Text style={styles.eyebrow}>ЭКСПЕРИМЕНТЫ</Text>
      <Text style={styles.title}>Периоды</Text>
      <Text style={styles.subtitle}>
        История разбита на отрезки: что именно ты пил в это время. Общий список и графики от этого
        не меняются.
      </Text>

      {baseline && compared.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Сравнение</Text>
          <GlassCard contentStyle={styles.compareCard}>
            <Text style={styles.baselineText}>
              База — чистые периоды: {baseline.systolic}/{baseline.diastolic}, пульс {baseline.pulse}
              , самочувствие {baseline.wellbeing}
            </Text>
            <Text style={styles.baselineHint}>{pluralRecords(baseline.count)} без напитков</Text>
            {compared.map((phase) => (
              <ComparisonBlock baseline={baseline} key={phase.id} phase={phase} />
            ))}
          </GlassCard>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Все периоды</Text>
      <View style={styles.list}>
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </View>

      {!loading && phases.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Периодов пока нет</Text>
          <Text style={styles.emptyText}>
            Создай первый — например, «Без всего» — и история начнёт делиться на эксперименты.
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={startPhase}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <View style={styles.addIcon}>
          <IconSymbol name="plus" size={20} color={Palette.coral} weight="semibold" />
        </View>
        <Text style={styles.addText}>Начать новый период</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: Spacing.xl,
    marginBottom: 12,
  },
  compareCard: {
    padding: Spacing.md,
  },
  baselineText: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  baselineHint: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 3,
  },
  compareBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  compareTitle: {
    flex: 1,
    color: Palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  compareCount: {
    color: Palette.subtle,
    fontSize: 11,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
  },
  compareLabel: {
    flex: 1,
    color: Palette.muted,
    fontSize: 12,
  },
  compareBase: {
    color: Palette.subtle,
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  compareActual: {
    color: Palette.text,
    fontSize: 13.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  compareDelta: {
    minWidth: 74,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: 12,
  },
  card: {
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.large,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  stripe: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  kindChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  kindChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.coralSoft,
  },
  liveChipText: {
    color: Palette.coral,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardMeta: {
    color: Palette.muted,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 12,
  },
  cardStat: {
    flex: 1,
  },
  cardStatValue: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardStatLabel: {
    color: Palette.subtle,
    fontSize: 10,
    marginTop: 2,
  },
  cardEmpty: {
    color: Palette.subtle,
    fontSize: 12,
    marginTop: 10,
  },
  cardChevron: {
    alignSelf: 'center',
    marginRight: 10,
  },
  addButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.lg,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coral,
    ...Shadow.button,
  },
  addIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Palette.white,
  },
  addText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    maxWidth: 270,
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
});
