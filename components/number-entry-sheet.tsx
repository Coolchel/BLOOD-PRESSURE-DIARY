import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Radius, Spacing } from '@/constants/design';

type NumberEntrySheetProps = {
  visible: boolean;
  title: string;
  unit: string;
  initialValue?: number;
  min: number;
  max: number;
  actionLabel: string;
  onCancel: () => void;
  onSubmit: (value: number) => void;
};

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'] as const;

export function NumberEntrySheet({
  visible,
  title,
  unit,
  initialValue,
  min,
  max,
  actionLabel,
  onCancel,
  onSubmit,
}: NumberEntrySheetProps) {
  const [value, setValue] = useState('');
  const [replaceOnNextKey, setReplaceOnNextKey] = useState(false);
  const translateY = useRef(new Animated.Value(520)).current;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      setValue(initialValue ? String(initialValue) : '');
      setReplaceOnNextKey(initialValue !== undefined);
    }
  }, [initialValue, title, visible]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(520);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 25,
        stiffness: 240,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    }
  }, [translateY, visible]);

  const numericValue = Number(value);
  const isValid = value.length > 0 && numericValue >= min && numericValue <= max;
  const keyWidth = useMemo(() => Math.min(88, (width - 88) / 3), [width]);

  function handleKey(key: (typeof keys)[number]) {
    if (key === '') return;
    void Haptics.selectionAsync();

    if (key === 'delete') {
      setValue((current) => (replaceOnNextKey ? '' : current.slice(0, -1)));
      setReplaceOnNextKey(false);
      return;
    }

    setValue((current) => {
      const next = `${replaceOnNextKey ? '' : current}${key}`.replace(/^0+/, '');
      return next.slice(0, 3);
    });
    setReplaceOnNextKey(false);
  }

  function submit() {
    if (!isValid) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(numericValue);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}>
      <View style={styles.modal}>
        <Pressable accessibilityLabel="Закрыть" onPress={onCancel} style={styles.backdrop} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, Spacing.md), transform: [{ translateY }] },
          ]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Pressable onPress={onCancel} hitSlop={12}>
              <Text style={styles.cancel}>Отмена</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.display}>
            <Text style={[styles.displayValue, !value && styles.displayEmpty]}>{value || '—'}</Text>
            <Text style={styles.unit}>{unit}</Text>
          </View>
          <Text style={[styles.range, value.length > 0 && !isValid && styles.rangeError]}>
            Допустимо: {min}–{max}
          </Text>

          <View style={styles.keypad}>
            {keys.map((key, index) =>
              key === '' ? (
                <View key={`empty-${index}`} style={{ width: keyWidth, height: 58 }} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={key === 'delete' ? 'Удалить цифру' : key}
                  key={key}
                  onPress={() => handleKey(key)}
                  style={({ pressed }) => [
                    styles.key,
                    { width: keyWidth },
                    pressed && styles.keyPressed,
                  ]}>
                  {key === 'delete' ? (
                    <IconSymbol name="delete.left" size={25} color={Palette.text} />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </Pressable>
              ),
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!isValid}
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              !isValid && styles.submitDisabled,
              pressed && isValid && styles.submitPressed,
            ]}>
            <Text style={styles.submitText}>{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 32, 47, 0.26)',
  },
  sheet: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#F9FAFC',
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    shadowColor: '#253047',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8DBE1',
    marginBottom: 13,
  },
  sheetHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancel: {
    width: 68,
    color: Palette.coral,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 68,
  },
  display: {
    height: 82,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 11,
  },
  displayValue: {
    color: Palette.text,
    fontSize: 58,
    fontWeight: '700',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  displayEmpty: {
    color: '#C7CBD2',
  },
  unit: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  range: {
    alignSelf: 'center',
    height: 20,
    color: Palette.subtle,
    fontSize: 12,
  },
  rangeError: {
    color: Palette.coral,
  },
  keypad: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 330,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 1,
    marginBottom: 14,
  },
  key: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    backgroundColor: '#F0F1F4',
  },
  keyPressed: {
    backgroundColor: '#E2E4E9',
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    color: Palette.text,
    fontSize: 27,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  submit: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    backgroundColor: Palette.coral,
  },
  submitDisabled: {
    backgroundColor: '#E2E4E8',
  },
  submitPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  submitText: {
    color: Palette.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
