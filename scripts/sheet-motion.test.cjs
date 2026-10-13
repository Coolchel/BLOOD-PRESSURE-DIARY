const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the real shared sheet lifecycle. Animated is a controllable OS
// substitute, so these checks do not establish frame timing on a physical phone.
function fixture() {
  const groups = [], presence = [];
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    stopAnimation(callback) { callback?.(this.value); }
  }
  const animation = (value, config) => ({ value, config, from: value.value });
  const native = {
    Easing: { out: value => value, cubic: value => value ** 3 },
    Animated: {
      Value, timing: animation, spring: animation,
      parallel: animations => {
        const group = {
          animations, stopped: false,
          start(callback) { this.callback = callback; groups.push(this); },
          stop() { this.stopped = true; this.callback?.({ finished: false }); },
          frame(progress) {
            assert.equal(this.stopped, false);
            for (const a of animations) a.value.setValue(a.from + (a.config.toValue - a.from) * progress);
          },
          finish() { this.frame(1); this.callback?.({ finished: true }); },
        };
        return group;
      },
    },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../components/clarity/sheet-motion.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'require', 'module', code)(module.exports, name => {
    assert.equal(name, 'react-native'); return native;
  }, module);
  const motion = module.exports.createSheetMotion(852, value => presence.push(value));
  const open = () => { motion.setVisible(true); motion.measure(480); motion.show(); groups.at(-1).finish(); };
  return { motion, groups, presence, open };
}

function assertSynchronized(group, motion, height = 480) {
  const [sheet, backdrop] = group.animations;
  assert.equal(sheet.config.duration, backdrop.config.duration);
  assert.equal(sheet.config.easing, backdrop.config.easing);
  assert.equal(sheet.config.useNativeDriver, true);
  assert.equal(backdrop.config.useNativeDriver, true);
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    group.frame(progress);
    assert.ok(Math.abs(motion.shade.value - (1 - motion.offset.value / height)) < 1e-8);
  }
}

test('sheet opening waits for Modal onShow, then moves and fades together over its measured height', () => {
  const h = fixture(), m = h.motion;
  m.setVisible(true);
  assert.deepEqual(h.presence, [true]); assert.equal(h.groups.length, 0);
  assert.equal(m.offset.value, 852); assert.equal(m.shade.value, 0);
  m.measure(480); assert.equal(m.offset.value, 480);
  m.show(); m.show(); assert.equal(h.groups.length, 1);
  assertSynchronized(h.groups[0], m);
  h.groups[0].finish(); assert.deepEqual(h.presence, [true]);
});

test('parent dismissal keeps the Modal mounted until both the sheet and backdrop have finished', () => {
  const h = fixture(); h.open();
  h.motion.setVisible(false);
  const close = h.groups.at(-1);
  assert.equal(close.animations[0].config.duration, 180);
  assertSynchronized(close, h.motion);
  assert.deepEqual(h.presence, [true]);
  close.finish(); assert.deepEqual(h.presence, [true, false]);
  h.motion.setVisible(false); assert.equal(h.groups.length, 2);
});

test('onShow before the first layout waits for the sheet size, avoiding a late entrance of short sheets', () => {
  const h = fixture(), m = h.motion;
  m.setVisible(true); m.show();
  assert.equal(h.groups.length, 0); assert.equal(m.shade.value, 0);
  m.measure(360);
  assert.equal(h.groups.length, 1); assert.equal(m.offset.value, 360);
  assertSynchronized(h.groups[0], m, 360); h.groups[0].finish();
});

test('an onShow delivered before visibility initialization cannot consume a subsequent opening', () => {
  const h = fixture(), m = h.motion;
  m.show(); m.measure(680); assert.equal(h.groups.length, 0);
  m.setVisible(true); assert.deepEqual(h.presence, [true]); m.show();
  assert.equal(h.groups.length, 1); assertSynchronized(h.groups[0], m, 680);
});

test('dragging fades the fixed backdrop, a short drag restores both, and dismissal has no second animation', () => {
  const h = fixture(), m = h.motion; h.open();
  m.grab(); m.move(60); assert.equal(m.offset.value, 60); assert.equal(m.shade.value, 0.875);
  m.restore(); assertSynchronized(h.groups.at(-1), m); h.groups.at(-1).finish();
  m.grab(); m.move(-20); assert.equal(m.offset.value, 0); assert.equal(m.shade.value, 1);
  m.move(120); let closed = 0;
  m.setOnClose(() => { closed++; m.setVisible(false); });
  m.dismiss(); m.dismiss();
  assert.equal(closed, 0); assert.equal(h.groups.length, 3);
  assertSynchronized(h.groups.at(-1), m);
  assert.deepEqual(h.presence, [true]);
  h.groups.at(-1).finish(); assert.deepEqual(h.presence, [true, false]); assert.equal(closed, 1);
});

test('reopening during dismissal cancels the old completion and reverses from the current position', () => {
  const h = fixture(), m = h.motion; let closed = 0; h.open(); m.setOnClose(() => closed++); m.dismiss();
  const old = h.groups.at(-1); old.frame(0.5);
  const offset = m.offset.value, shade = m.shade.value;
  m.setVisible(true);
  assert.equal(old.stopped, true);
  assert.equal(m.offset.value, offset); assert.equal(m.shade.value, shade);
  old.callback({ finished: true }); assert.deepEqual(h.presence, [true]);
  assert.equal(closed, 0);
  assertSynchronized(h.groups.at(-1), m); h.groups.at(-1).finish();
  assert.deepEqual(h.presence, [true]); assert.equal(m.offset.value, 0); assert.equal(m.shade.value, 1);
});

test('cancelling before onShow and unmounting suppress stale completion and callbacks', () => {
  const h = fixture(), m = h.motion;
  m.setVisible(true); m.setVisible(false); m.show();
  assert.equal(h.groups.length, 0); assert.deepEqual(h.presence, [true, false]);
  let closed = 0; h.open(); m.setOnClose(() => closed++); m.dismiss(); const close = h.groups.at(-1);
  m.dispose(); close.callback({ finished: true });
  m.dismiss(); m.setVisible(true); m.show();
  assert.equal(closed, 0); assert.deepEqual(h.presence, [true, false, true]);
});

test('the lifecycle can activate again after development Strict Mode cleanup', () => {
  const h = fixture(), m = h.motion;
  m.setVisible(true); m.dispose(); m.activate(); m.setVisible(true); m.measure(480); m.show();
  assert.equal(h.groups.length, 1); assertSynchronized(h.groups[0], m); h.groups[0].finish();
  m.setVisible(false); h.groups.at(-1).finish(); assert.equal(h.presence.at(-1), false);
});

test('a parent callback update preserves the current drag and notifies the latest parent once after closing', () => {
  const h = fixture(), m = h.motion; let oldClosed = 0, closed = 0; h.open();
  m.setOnClose(() => oldClosed++); m.grab(); m.move(100);
  const count = h.groups.length;
  m.setOnClose(() => closed++);
  assert.equal(h.groups.length, count); assert.equal(m.offset.value, 100);
  m.dismiss(); assert.equal(closed, 0); h.groups.at(-1).finish();
  assert.equal(closed, 1); assert.equal(oldClosed, 0);
});
