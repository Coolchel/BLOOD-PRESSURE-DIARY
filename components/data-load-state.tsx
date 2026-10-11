'use no memo'; // Re-evaluate shared locale formatters when the language changes.

import { tr } from '@/localization';
import { useLanguage } from '@/localization/provider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/design';

export function DataLoadState({ loading, error, onRetry, label = tr('данные') }: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  label?: string;
}) {
  useLanguage();
  if (!loading && !error) return null;
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.message}>
        {loading ? tr`Загружаем ${label}…` : tr`Не удалось загрузить ${label}.`}
      </Text>
      {!loading && error ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>{tr("Повторить")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, marginBottom: Spacing.md, borderRadius: Radius.medium, backgroundColor: Palette.surfaceStrong },
  message: { color: Palette.muted, fontSize: 14, lineHeight: 21 },
  retry: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 4, minHeight: 44 },
  retryText: { color: Palette.coral, fontSize: 14, fontWeight: '600' },
});
