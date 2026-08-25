import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/design';

type SaveSuccessOverlayProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onDone: () => void;
};

const VISIBLE_MS = 1250;

export function SaveSuccessOverlay({
  visible,
  title = 'Сохранено',
  subtitle = 'Измерение добавлено в дневник',
  onDone,
}: SaveSuccessOverlayProps) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const circle = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const caption = useRef(new Animated.Value(0)).current;
  const finish = useRef(onDone);

  // Колбэк держим в ref: пересоздание функции родителем не должно перезапускать анимацию.
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!visible) return;

    backdrop.setValue(0);
    circle.setValue(0);
    mark.setValue(0);
    ring.setValue(0);
    caption.setValue(0);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.spring(circle, {
          toValue: 1,
          damping: 12,
          stiffness: 190,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(mark, {
          toValue: 1,
          damping: 10,
          stiffness: 230,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 1,
          duration: 640,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(caption, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Вторая, более мягкая отдача в момент расхождения кольца — «печать поставлена».
    const echo = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 260);
    const timer = setTimeout(() => finish.current(), VISIBLE_MS);

    return () => {
      clearTimeout(echo);
      clearTimeout(timer);
    };
  }, [backdrop, caption, circle, mark, ring, visible]);

  return (
    <Modal animationType="none" statusBarTranslucent transparent visible={visible}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [
                  { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.15] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              {
                opacity: circle,
                transform: [
                  { scale: circle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
                ],
              },
            ]}>
            <Animated.View style={{ transform: [{ scale: mark }] }}>
              <IconSymbol name="checkmark" size={48} color={Palette.white} weight="bold" />
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              styles.captionWrap,
              {
                opacity: caption,
                transform: [
                  { translateY: caption.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                ],
              },
            ]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 32, 47, 0.34)',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: Palette.coral,
  },
  circle: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 58,
    backgroundColor: Palette.coral,
    shadowColor: Palette.coral,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 12,
  },
  captionWrap: {
    alignItems: 'center',
    marginTop: 26,
  },
  title: {
    color: Palette.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 5,
  },
});
