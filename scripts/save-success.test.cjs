const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise actual animation lifecycle; OS animation and haptic delivery are substitutes.
function overlay(reduced = false) {
  const effects=[],timers=new Map(),events=[];let states=0,finishAnimation,done=0;
  class Value { setValue(){} interpolate(){return this;} }
  const animation=()=>({start:callback=>{finishAnimation=callback;},stop:()=>finishAnimation?.({finished:false})});
  const native={Animated:{Value,View:'AnimatedView',timing:animation,spring:animation,sequence:animation,parallel:animation},Modal:'Modal',Text:'Text',View:'View',StyleSheet:{create:value=>value},Easing:{quad:()=>{},out:value=>value},AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced,addEventListener:()=>({remove:()=>{}})}};
  const requireLocal=name=>{
    if(name==='react')return {useState:initial=>[++states===6?reduced:typeof initial==='function'?initial():initial,()=>{}],useRef:value=>({current:value}),useEffect:effect=>effects.push(effect)};
    if(name==='react/jsx-runtime')return require(name);
    if(name==='react-native')return native;
    if(name==='expo-haptics')return {NotificationFeedbackType:{Success:'success'},ImpactFeedbackStyle:{Light:'light'},notificationAsync:async()=>events.push('start'),impactAsync:async()=>events.push('end')};
    if(name==='@/localization')return {tr:value=>value};
    if(name==='@/localization/provider')return {useLanguage:()=>{}};
    if(name==='@/components/clarity/ui')return {Icon:'Icon'};
    if(name==='@/constants/design')return {Palette:{}};
    throw Error(name);
  };
  const module={exports:{}};
  const source=fs.readFileSync(path.join(__dirname,'../components/save-success-overlay.tsx'),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('exports','require','module','setTimeout','clearTimeout',code)(module.exports,requireLocal,module,(callback,delay)=>{timers.set(delay,callback);return delay;},id=>timers.delete(id));
  module.exports.SaveSuccessOverlay({visible:true,onDone:()=>done++});
  const cleanups=effects.map(effect=>effect());
  return {events,get done(){return done;},finish:()=>finishAnimation?.({finished:true}),timeout:()=>timers.get(1250)?.(),unmount:()=>cleanups.forEach(cleanup=>cleanup?.())};
}

test('success haptics play at start and at animation completion exactly once', () => {
  const h=overlay();assert.deepEqual(h.events,['start']);
  h.finish();assert.deepEqual(h.events,['start','end']);assert.equal(h.done,0);
  h.timeout();assert.deepEqual(h.events,['start','end']);assert.equal(h.done,1);
  h.unmount();assert.equal(h.done,1);
});
test('reduced motion retains beginning and ending feedback without running an animation', () => {
  const h=overlay(true);assert.deepEqual(h.events,['start']);
  h.timeout();assert.deepEqual(h.events,['start','end']);assert.equal(h.done,1);
});
test('unmounting an interrupted success overlay cancels its completion and ending haptic', () => {
  for(const reduced of [true,false]) {
    const h=overlay(reduced);h.unmount();h.timeout();h.finish();
    assert.deepEqual(h.events,['start']);assert.equal(h.done,0);
  }
});
