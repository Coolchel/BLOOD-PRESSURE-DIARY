import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Spacing } from '@/constants/design';
import type { MeasurementSummary } from '@/types/measurement';

type MeasurementCardProps = {
  measurement: MeasurementSummary;
  onPress?: () => void;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function MeasurementCard({ measurement, onPress }: MeasurementCardProps) {
  return (
    <Pressable
      accessibilityHint={onPress ? 'Открывает подробности измерения' : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.main}>
        <View style={styles.pressure}>
          <Text style={styles.systolic}>{measurement.systolic}</Text>
          <Text style={styles.separator}>/</Text>
          <Text style={styles.diastolic}>{measurement.diastolic}</Text>
        </View>
        <Text style={styles.pressureUnit}>мм рт. ст.</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <IconSymbol name="waveform.path.ecg" size={18} color={Palette.coral} />
          <Text style={styles.detailStrong}>{measurement.pulse}</Text>
          <Text style={styles.detailMuted}>уд/мин</Text>
        </View>
        <Text style={styles.date}>{formatDate(measurement.measuredAt)}</Text>
        <View style={styles.badges}>
          <View style={styles.wellbeing}>
            <Text style={styles.wellbeingText}>Самочувствие {measurement.wellbeing}/10</Text>
          </View>
          {measurement.readingCount > 1 ? (
            <View style={styles.series}>
              <Text style={styles.seriesText}>Среднее из {measurement.readingCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {onPress ? (
        <View style={styles.openIcon}>
          <IconSymbol name="chevron.right" size={15} color={Palette.subtle} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceStrong,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  openIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  main: {
    width: 116,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  pressure: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  systolic: {
    color: Palette.coral,
    fontSize: 27,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    color: '#C7A2A0',
    fontSize: 19,
    fontWeight: '500',
    marginHorizontal: 3,
  },
  diastolic: {
    color: Palette.orange,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pressureUnit: {
    color: Palette.muted,
    fontSize: 10,
    marginTop: 3,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    gap: 7,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailStrong: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  detailMuted: {
    color: Palette.muted,
    fontSize: 12,
  },
  date: {
    color: Palette.muted,
    fontSize: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wellbeing: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: '#F1F2F5',
  },
  wellbeingText: {
    color: Palette.text,
    fontSize: 10,
    fontWeight: '600',
  },
  series: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.orangeSoft,
  },
  seriesText: {
    color: '#B9650B',
    fontSize: 10,
    fontWeight: '600',
  },
});
