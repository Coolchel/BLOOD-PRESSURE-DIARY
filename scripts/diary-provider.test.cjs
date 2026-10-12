const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const M = require('../design-lab/model.js');
const deferred = () => { let resolve, reject; const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; };
const tick = () => new Promise(resolve=>setImmediate(resolve));

// A controlled React hook lifecycle executes the actual provider queue and
// failure paths. SQLite contents and OS wake-up events are supplied by each test.
function fixture(overrides={}) {
  const locale={language:'ru'};
  const slots=[],effects=[],context={Provider:'Provider'};let cursor=0;
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>value===b[i]);
  const hooks={
    createContext:()=>context,
    useState(initial){const i=cursor++;slots[i]||={value:typeof initial==='function'?initial():initial};return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;}];},
    useRef(value){const i=cursor++;slots[i]||={current:value};return slots[i];},
    useCallback(callback,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,callback};return slots[i].callback;},
    useEffect(callback,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps)){slots[i]={deps};effects.push(callback);}},
  };
  const loaders={readClarityState:async()=>M.factoryState(),readClarityPreferences:async()=>M.statisticsPreferences(null),writeClarityDrafts:async()=>{},writeClarityPreferences:async()=>{},...overrides};
  const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../components/clarity/diary-provider.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}},db={};
  const req=name=>{
    if(name==='react')return hooks;
    if(name==='react/jsx-runtime')return require(name);
    if(name==='expo-sqlite')return {useSQLiteContext:()=>db};
    if(name==='react-native')return {ActivityIndicator:'Spinner',Pressable:'Pressable',Text:'Text',View:'View',AppState:{addEventListener:()=>({remove:()=>{}})}};
    if(name==='../../design-lab/model')return M;
    if(name==='@/data/clarity-state')return loaders;
    if(name==='@/localization')return {tr:value=>value};
    if(name==='@/localization/provider')return {useLanguage:()=>locale};
    if(name==='@/constants/design')return {Palette:{}};
    if(name==='@/data/auto-backup')return {waitForBackupOperations:async()=>{}};
    throw Error(name);
  };
  new Function('exports','require','module','setInterval','clearInterval',code)(module.exports,req,module,()=>0,()=>{});
  const render=()=>{cursor=0;return module.exports.DiaryProvider({children:'screens'});};
  const flushEffects=async()=>{effects.splice(0).forEach(callback=>callback());await tick();};
  return {render,flushEffects,loaders,locale,async ready(){render();await flushEffects();return render().props.value;}};
}

test('a language change refreshes mounted diary consumers without resetting their data or selection', async()=>{
  const h=fixture(),before=await h.ready();
  before.historyFor({scope:'time',preset:'all'});
  h.locale.language='fr';
  const after=h.render().props.value;
  assert.equal(after.language,'fr');assert.equal(after.state,before.state);
  assert.equal(after.preferences,before.preferences);
  assert.deepEqual(after.historySelection,{scope:'time',preset:'all'});
});

test('native load failures show retry and recover without replacing diary bytes', async()=>{
  let failed=true;const data=M.factoryState(),h=fixture({readClarityState:async()=>{if(failed)throw Error('disk');return data;}});
  h.render();await h.flushEffects();const tree=h.render(),retry=tree.props.children;
  assert.equal(retry.type,'Pressable');assert.equal(retry.props.children.props.children,'Не удалось загрузить записи. Повторить');
  failed=false;retry.props.onPress();h.render();await h.flushEffects();assert.equal(h.render().props.value.state,data);
});

test('native draft writes serialize both modes; failed writes remain observable through flush', async()=>{
  const first=deferred(),writes=[];let fail=false;
  const h=fixture({writeClarityDrafts:async(db,state)=>{writes.push(state);if(writes.length===1)await first.promise;if(fail)throw Error('disk');}}),ctx=await h.ready();
  const single=M.newDraft('single'),series=M.newDraft('series');single.note='single';series.note='series';
  const a=ctx.draft(single,'single'),b=ctx.draft(series,'series');await tick();assert.equal(writes.length,1);
  first.resolve();await a;await b;assert.deepEqual(h.render().props.value.state.drafts,{single,series});
  fail=true;await assert.rejects(ctx.draft({...single,note:'failed'},'single'),/disk/);await assert.rejects(ctx.flush(),/disk/);
  assert.equal(h.render().props.value.state.drafts.single.note,'single');
  fail=false;await ctx.draft({...single,note:'retry'},'single');await ctx.flush();assert.equal(h.render().props.value.state.drafts.single.note,'retry');
});

test('a failed native preference save preserves the previous visible choice and can be retried', async()=>{
  let fail=true;const h=fixture({writeClarityPreferences:async()=>{if(fail)throw Error('settings');}}),ctx=await h.ready();
  const next={...ctx.preferences,summary:'median'};
  await assert.rejects(ctx.configure(next),/settings/);assert.equal(h.render().props.value.preferences.summary,'mean');
  fail=false;await ctx.configure(next);assert.equal(h.render().props.value.preferences.summary,'median');
});

test('a committed measurement with a readback failure triggers retry without repeating its insertion', async()=>{
  let fail=false,insertions=0;const h=fixture({readClarityState:async()=>{if(fail)throw Error('readback');return M.factoryState();}}),ctx=await h.ready();
  await ctx.change(async()=>{insertions++;fail=true;});
  assert.equal(insertions,1);const retry=h.render().props.children;assert.equal(retry.type,'Pressable');
  fail=false;retry.props.onPress();h.render();await h.flushEffects();assert.ok(h.render().props.value);assert.equal(insertions,1);
});
