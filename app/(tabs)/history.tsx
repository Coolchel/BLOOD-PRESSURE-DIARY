import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MeasurementCard } from '@/components/measurement-card';
import { HistoryFilters } from '@/components/history-filters';
import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Shadow, Spacing } from '@/constants/design';
import { pluralRecords } from '@/constants/phase-format';
import { DEFAULT_HISTORY_FILTERS, historyFilterLabel, historyQuery } from '@/constants/history-filters';
import type { HistoryFilterState } from '@/constants/history-filters';
import { useMeasurements } from '@/hooks/use-measurements';
import { usePhaseList } from '@/hooks/use-phases';
import { findPhaseFor } from '@/types/experiment';

export default function HistoryScreen() {
  const [limit, setLimit] = useState(200);
  const [filters, setFilters] = useState<HistoryFilterState>(DEFAULT_HISTORY_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const { measurements, loading, total, error, refresh } = useMeasurements(limit, historyQuery(filters));
  const hasFilters = filters.sort !== 'newest' || filters.startDate !== null || filters.endDate !== null;
  const phases = usePhaseList();

  return (
    <>
      <ScreenShell>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ВСЕ ЗАПИСИ</Text>
            <Text style={styles.title}>История</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Фильтры истории"
              accessibilityState={{ expanded: filtersVisible }}
              onPress={() => setFiltersVisible(true)}
              style={({ pressed }) => [styles.filterButton, hasFilters && styles.filterActive, pressed && styles.pressed]}>
              <IconSymbol name="line.3.horizontal.decrease" size={23} color={Palette.coral} />
            </Pressable>
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
        </View>

        <View style={styles.summary}>
          <Text style={styles.count}>{pluralRecords(total)}</Text>
          <Text style={styles.countLabel}>{hasFilters ? 'по фильтрам' : 'сохранено'}</Text>
        </View>
        {hasFilters ? <Text style={styles.filterCaption}>{historyFilterLabel(filters)}</Text> : null}

        <View style={styles.list}>
          {measurements.map((measurement) => (
            <MeasurementCard
              key={measurement.id}
              measurement={measurement}
              phase={findPhaseFor(measurement.measuredAt, phases)}
              onPress={() =>
                router.push({
                  pathname: '/measurement/[id]',
                  params: { id: String(measurement.id) },
                })
              }
            />
          ))}
        </View>

        {error ? (
          <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.loadMore}>
            <Text style={styles.emptyText}>Не удалось загрузить записи. Повторить</Text>
          </Pressable>
        ) : measurements.length < total ? (
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => setLimit((current) => current + 200)}
            style={styles.loadMore}>
            <Text style={styles.emptyText}>
              {loading ? 'Загружаем…' : `Показать ещё · ${measurements.length} из ${total}`}
            </Text>
          </Pressable>
        ) : null}

        {!loading && !error && measurements.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{hasFilters ? 'Нет записей по выбранным фильтрам' : 'История пока пустая'}</Text>
            <Text style={styles.emptyText}>{hasFilters ? 'Измени период в фильтрах истории.' : 'Добавь первое измерение, и оно появится здесь.'}</Text>
          </View>
        ) : null}
      </ScreenShell>
      <HistoryFilters
        visible={filtersVisible}
        value={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={(next) => {
          setLimit(200);
          setFilters(next);
          setFiltersVisible(false);
        }}
      />
    </>
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
  actions: { flexDirection: 'row', gap: 10 },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(72,82,102,0.04)',
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  filterActive: { backgroundColor: Palette.coralSoft, borderColor: 'rgba(255,94,87,0.06)' },
  filterCaption: { color: Palette.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
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
  loadMore: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
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
