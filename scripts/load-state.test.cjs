const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Execute the actual hooks with a minimal hook lifecycle and controllable data promises.
// This tests error recovery and race conditions without an emulator or the user's SQLite DB.
function harness(filename, loaders) {
  const slots = [];
  let cursor = 0, focus;
  const react = {
    useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i], next => { slots[i]=typeof next==='function'?next(slots[i]):next; }]; },
    useRef(initial) { const i=cursor++; if (!(i in slots)) slots[i]={current:initial}; return slots[i]; },
    useCallback(callback) { cursor++; return callback; },
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',filename),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports:{}};
  const req = name => {
    if(name==='react')return react;
    if(name==='@react-navigation/native')return {useFocusEffect:callback=>{focus=callback;}};
    if(name==='expo-sqlite')return {useSQLiteContext:()=>({})};
    if(name==='@/data/database')return loaders;
    throw Error('Unexpected module: '+name);
  };
  new Function('require','module','exports',code)(req,module,module.exports);
  return {render(name,...args){cursor=0;return module.exports[name](...args);},focus(){return focus();}};
}
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('phase data errors are caught and retry replaces them with real data', async () => {
  let fail=true;
  const h=harness('hooks/use-phases.ts',{getPhases:async()=>{if(fail)throw Error('db failure');return [{id:1}];}});
  let result=h.render('usePhaseList');await result.refresh();
  result=h.render('usePhaseList');assert.equal(result.loading,false);assert.equal(result.error,true);assert.deepEqual(result.phases,[]);
  fail=false;await result.refresh();result=h.render('usePhaseList');assert.equal(result.error,false);assert.deepEqual(result.phases,[{id:1}]);
});
test('phase summaries ignore a stale request that resolves after a newer refresh', async () => {
  const a=defer(),b=defer();let call=0;
  const h=harness('hooks/use-phases.ts',{getPhasesWithStats:()=>++call===1?a.promise:b.promise});
  const result=h.render('usePhases'),first=result.refresh(),second=result.refresh();
  b.resolve([{id:2}]);await second;a.resolve([{id:1}]);await first;
  assert.deepEqual(h.render('usePhases').phases,[{id:2}]);
});
test('a stale phase failure cannot overwrite a successful newer result', async () => {
  const a=defer(),b=defer();let call=0;
  const h=harness('hooks/use-phases.ts',{getPhases:()=>++call===1?a.promise:b.promise});
  const result=h.render('usePhaseList'),first=result.refresh(),second=result.refresh();
  b.resolve([{id:2}]);await second;a.reject(Error('old failure'));await first;
  const actual=h.render('usePhaseList');assert.equal(actual.error,false);assert.deepEqual(actual.phases,[{id:2}]);
});
test('unfocused phase request cannot change data or loading state', async () => {
  const pending=defer();const h=harness('hooks/use-phases.ts',{getPhases:()=>pending.promise});
  h.render('usePhaseList');const cleanup=h.focus();cleanup();pending.resolve([{id:3}]);await pending.promise;await Promise.resolve();
  const result=h.render('usePhaseList');assert.deepEqual(result.phases,[]);assert.equal(result.loading,true);
});
test('measurement load failure is visible and retry refreshes both count and data', async () => {
  let fail=true;const h=harness('hooks/use-measurements.ts',{getMeasurements:async()=>{if(fail)throw Error('failed');return [{id:4}];},countMeasurements:async()=>1});
  let result=h.render('useMeasurements');await result.refresh();result=h.render('useMeasurements');assert.equal(result.error,true);assert.equal(result.loading,false);
  fail=false;await result.refresh();result=h.render('useMeasurements');assert.equal(result.error,false);assert.equal(result.total,1);assert.deepEqual(result.measurements,[{id:4}]);
});
