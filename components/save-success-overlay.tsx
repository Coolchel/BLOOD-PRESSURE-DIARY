'use no memo'; // Re-evaluate shared locale formatters when the language changes.

import { tr } from '@/localization';
import { useLanguage } from '@/localization/provider';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/clarity/ui';
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
  title = tr('Сохранено'),
  subtitle = tr('Измерение добавлено в дневник'),
  onDone,
}: SaveSuccessOverlayProps) {
  useLanguage();
  const [backdrop] = useState(() => new Animated.Value(0));
  const [circle] = useState(() => new Animated.Value(0));
  const [mark] = useState(() => new Animated.Value(0));
  const [ring] = useState(() => new Animated.Value(0));
  const [caption] = useState(() => new Animated.Value(0));
  const finish = useRef(onDone);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

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

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    let completed = false;
    const completeFeedback = () => {
      if (completed) return;
      completed = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    };
    const done = () => { completeFeedback(); finish.current(); };
    if (reduceMotion) {
      backdrop.setValue(1); circle.setValue(1); mark.setValue(1); caption.setValue(1); ring.setValue(0);
      const timer = setTimeout(done, VISIBLE_MS);
      return () => clearTimeout(timer);
    }

    const animation = Animated.sequence([
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
    ]);
    animation.start(({ finished }) => { if (finished) completeFeedback(); });
    const timer = setTimeout(done, VISIBLE_MS);

    return () => {
      completed = true;
      animation.stop();
      clearTimeout(timer);
    };
  }, [backdrop, caption, circle, mark, ring, visible, reduceMotion]);

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
              <Icon name="check" size={48} color={Palette.white} />
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
    fontFamily: 'Manrope',
    color: Palette.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Manrope',
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 5,
  },
});
