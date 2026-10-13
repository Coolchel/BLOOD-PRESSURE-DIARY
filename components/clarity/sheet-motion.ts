import { Animated, Easing } from "react-native";

// The platform Modal stays still. Only the sheet moves; the backdrop fades in
// the same animation, including a dismissal requested by the parent.
export function createSheetMotion(windowHeight: number, present: (value: boolean) => void, onClose = () => {}) {
  const offset = new Animated.Value(windowHeight);
  const shade = new Animated.Value(0);
  let height = windowHeight;
  let measured = false;
  let alive = true;
  let visible = false;
  let shown = false;
  let openingPending = false;
  let origin = 0;
  let generation = 0;
  let animation: Animated.CompositeAnimation | undefined;
  let afterClose: (() => void) | undefined;

  const hidden = () => {
    shown = false;
    openingPending = false;
    const onClose = afterClose;
    afterClose = undefined;
    present(false);
    onClose?.();
  };

  const cancel = () => {
    generation++;
    animation?.stop();
    animation = undefined;
  };
  const animate = (opening: boolean) => {
    cancel();
    const token = generation;
    const config = {
      duration: opening ? 240 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    };
    animation = Animated.parallel([
      Animated.timing(offset, { ...config, toValue: opening ? 0 : height }),
      Animated.timing(shade, { ...config, toValue: opening ? 1 : 0 }),
    ]);
    animation.start(({ finished }) => {
      if (!finished || !alive || token !== generation) return;
      animation = undefined;
      if (!opening) hidden();
    });
  };
  const setVisible = (next: boolean) => {
    if (!alive || next === visible) return;
    visible = next;
    if (next) {
      afterClose = undefined;
      if (shown) animate(true);
      else {
        cancel();
        openingPending = true;
        offset.setValue(height);
        shade.setValue(0);
        present(true);
      }
    } else if (shown && !openingPending) animate(false);
    else {
      cancel();
      hidden();
    }
  };

  return {
    offset,
    shade,
    activate() { alive = true; },
    dispose() {
      alive = false;
      visible = false;
      shown = false;
      openingPending = false;
      afterClose = undefined;
      cancel();
    },
    setVisible,
    setOnClose(callback: () => void) { onClose = callback; },
    setWindowHeight(value: number) {
      if (!measured) height = value;
    },
    measure(value: number) {
      if (value <= 0) return;
      height = value;
      measured = true;
      if (!shown || openingPending) offset.setValue(height);
      if (shown && visible && openingPending) {
        openingPending = false;
        animate(true);
      }
    },
    show() {
      if (!alive || !visible || shown) return;
      shown = true;
      // onShow can precede the first onLayout. Starting with the screen height
      // would make a short sheet arrive later than its backdrop.
      if (measured) {
        openingPending = false;
        animate(true);
      }
    },
    dismiss() {
      if (!alive || !visible) return;
      // A parent may unmount the entire picker from its onClose callback.
      // Notify it only after both visual layers have finished disappearing.
      afterClose = () => onClose();
      setVisible(false);
    },
    grab() {
      if (!alive || !visible || !shown) return;
      cancel();
      offset.stopAnimation(value => { origin = value; });
      shade.stopAnimation();
    },
    move(dy: number) {
      if (!alive || !visible || !shown) return;
      const value = Math.max(0, origin + dy);
      offset.setValue(value);
      shade.setValue(Math.max(0, 1 - value / height));
    },
    restore() {
      if (!alive || !visible || !shown) return;
      cancel();
      animation = Animated.parallel([
        Animated.spring(offset, { toValue: 0, useNativeDriver: true }),
        Animated.spring(shade, { toValue: 1, useNativeDriver: true }),
      ]);
      animation.start();
    },
  };
}
