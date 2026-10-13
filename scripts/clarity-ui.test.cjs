const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const M = require('../design-lab/model.js');
const root = path.resolve(__dirname, '..');

// Run the real native render functions and event handlers. Only OS primitives,
// navigation and hook storage are replaced. This is not a device/gesture test.
function fixture(state = M.factoryState(), preferences = M.statisticsPreferences(null, state.phases), options = {}) {
  const modules = new Map(), navigation = [], writes = [], success = [], keyboard = [];
  const diary = { state, preferences, viewEpoch: 0, historySelection: null, now: Date.now(),
    historyFor: value => { diary.historySelection = value; },
    configure: async value => { diary.preferences = value; },
    draft: async (value, mode) => { writes.push({ value, mode }); },
    change: async work => work(), flush: async () => {}, resetView: () => {} };
  const hooks = { useState: initial => [initial?.name === 'defaultFilters' && options.filters ? options.filters : typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: value => ({ current: value }), useEffect: () => {}, useCallback: value => value, useMemo: factory => factory() };
  const load = relative => {
    const file = path.resolve(root, relative);
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} }; modules.set(file, module);
    const requireLocal = name => {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react-native') return { Text:'Text', View:'View', Pressable:'Pressable', TextInput:'TextInput', InputAccessoryView:'InputAccessoryView', ScrollView:'ScrollView', Modal:'Modal', FlatList:'FlatList',
        Animated:{createAnimatedComponent:value=>value,Value:class {setValue(value){this.value=value;}stopAnimation(){}},timing:()=>({start:callback=>callback?.({finished:true})}),spring:()=>({start:()=>{}})},PanResponder:{create:value=>({panHandlers:value})},
        StyleSheet:{create:value=>value,absoluteFill:{}},useWindowDimensions:()=>({width:402,height:852}),Alert:{alert:()=>{}},Platform:{OS:'ios'},Keyboard:{dismiss:()=>keyboard.push('dismiss')} };
      if (name === 'react-native-safe-area-context') return { SafeAreaView:'SafeAreaView' };
      if (name === 'react-native-svg') return { __esModule:true, default:'Svg', ...Object.fromEntries(['Circle','G','Line','Path','Text'].map(key=>[key,key])) };
      if (name === '@react-native-community/slider') return { __esModule:true, default:'Slider' };
      if (name === 'expo-haptics') return { selectionAsync:async()=>{} };
      if (name === 'expo-sqlite') return { useSQLiteContext:()=>({}) };
      if (name === 'expo-router/react-navigation') return { usePreventRemove:()=>{} };
      if (name === 'expo-router') return { router:{push:value=>navigation.push(value),replace:value=>navigation.push(value),navigate:value=>navigation.push(value),back:()=>navigation.push('back')},useRootNavigationState:()=>null,useLocalSearchParams:()=>({}),useNavigation:()=>({dispatch:()=>{}}) };
      if (name.includes('diary-provider')) return { useDiary:()=>diary };
      if (name === '@/localization/provider') return { useLanguage:()=>({language:'ru'}) };
      if (name === '@/components/save-success-overlay') return { SaveSuccessOverlay:props=>{success.push(props);return null;} };
      if (name === '@/data/database') return {addMeasurement:async()=>42};
      const relativeName = name.startsWith('@/') ? path.resolve(root,name.slice(2)) : path.resolve(path.dirname(file),name);
      if (name.startsWith('@/') || name.startsWith('.')) {
        if (fs.existsSync(relativeName+'.js')) return require(relativeName+'.js');
        for (const extension of ['.ts','.tsx']) if (fs.existsSync(relativeName+extension)) return load(relativeName+extension);
        if (fs.existsSync(path.join(relativeName,'index.ts'))) return load(path.join(relativeName,'index.ts'));
      }
      throw Error('Unexpected native dependency: '+name);
    };
    const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    new Function('exports','require','module',code)(module.exports,requireLocal,module);
    return module.exports;
  };
  const expand = element => {
    if (Array.isArray(element)) return element.flatMap(expand);
    if (element === null || element === undefined || typeof element === 'boolean') return [];
    if (typeof element !== 'object') return [element];
    if (typeof element.type === 'function') return expand(element.type(element.props));
    return [element,...expand(element.props?.children)];
  };
  load('localization/index.ts').appLocale.setLanguage('ru');
  return { diary, navigation, writes, success, keyboard, load, expand,
    render: name => expand(load('components/clarity/screens.tsx')[name]()),
    texts: nodes => nodes.filter(node=>typeof node==='string'||typeof node==='number').join(' '),
    buttons: nodes => nodes.filter(node=>node?.type==='Pressable') };
}
const sample = (id, day=11, systolic=120) => ({id,measuredAt:`2026-10-${String(day).padStart(2,'0')}T12:00:00.000Z`,mode:'single',readings:[{systolic,diastolic:80,pulse:70,measuredAt:`2026-10-${String(day).padStart(2,'0')}T12:00:00.000Z`}],wellbeing:7,tags:[],note:''});
const phase = (id,start=1,end=null) => ({id,kind:'custom',icon:'moon',color:M.PHASE_COLORS[0],title:'Personal period '+id,startedAt:`2026-10-${String(start).padStart(2,'0')}T00:00:00.000Z`,endedAt:end?`2026-10-${String(end).padStart(2,'0')}T00:00:00.000Z`:null,note:'User note unchanged'});

test('empty native home hides recent measurements, and an empty comparison has no history actions', () => {
  const h=fixture();
  assert.ok(!h.texts(h.render('HomeScreen')).includes('Последние измерения'));
  const comparison=h.texts(h.render('ComparisonScreen'));
  assert.ok(!comparison.includes('История первого')); assert.ok(!comparison.includes('История второго'));
});

test('empty native statistics retains the summary but hides the chart and extremes, like the prototype', () => {
  const h=fixture(),text=h.texts(h.render('StatisticsScreen'));
  assert.ok(text.includes('Статистика появится после измерений'));
  assert.ok(text.includes('Среднее за период'));assert.ok(text.includes('Новое измерение'));
  assert.ok(!text.includes('Минимум и максимум'));assert.ok(!text.includes('Динамика'));
});

test('comparison shows a history action only for the populated selection', () => {
  const state={...M.factoryState(),sessions:[sample(1)],phases:[phase(1),phase(2,12)]};
  const h=fixture(state,M.statisticsPreferences({compareType:'phases',left:'1',right:'2'},state.phases));
  const text=h.texts(h.render('ComparisonScreen'));
  assert.ok(text.includes('История первого')); assert.ok(!text.includes('История второго'));
});

test('comparing periods requires two periods, while date comparison remains available', () => {
  for (const phases of [[],[phase(1)]]) {
    const state={...M.factoryState(),sessions:[sample(1)],phases};
    const h=fixture(state,M.statisticsPreferences({compareType:'phases'},phases));
    const nodes=h.render('ComparisonScreen'),text=h.texts(nodes);
    assert.ok(text.includes('Нужны два периода'));assert.ok(text.includes('Сравнить даты'));
    assert.ok(!text.includes('История первого'));assert.ok(!text.includes('Разница:'));
    const dates=h.buttons(nodes).find(node=>h.texts(h.expand(node.props.children))==='Сравнить даты');
    dates.props.onPress();assert.equal(h.diary.preferences.compareType,'dates');
  }
});

test('the native chart connects every record and each metric point opens that record directly', () => {
  const h=fixture(), sessions=[sample(1,1),sample(2,2,124),sample(3,11,127)], opened=[];
  const nodes=h.expand(h.load('components/clarity/chart.tsx').Chart({sessions,metric:'combined',onOpen:id=>opened.push(id)}));
  const paths=nodes.filter(node=>node?.type==='Path');
  assert.equal(paths.length,3);for(const item of paths)assert.equal((item.props.d.match(/L/g)||[]).length,2);
  const hits=nodes.filter(node=>node?.type==='Circle'&&node.props.onPress);
  assert.equal(hits.length,9);hits.forEach(node=>node.props.onPress());
  assert.deepEqual(opened,[1,1,1,2,2,2,3,3,3]);
  assert.deepEqual([...new Set(hits.map(node=>node.props.cx))],[34,184,334]);
});

test('home limits its chart to twelve records while statistics retains the whole interval', () => {
  const state={...M.factoryState(),sessions:Array.from({length:17},(_,i)=>sample(i+1,i+1))};
  const h=fixture(state,M.statisticsPreferences({selection:{scope:'time',preset:'all'}}));
  const home=h.render('HomeScreen'),statistics=h.render('StatisticsScreen');
  assert.equal(home.filter(node=>node?.props?.testID?.startsWith('chart-point-')).length,24);
  assert.equal(statistics.filter(node=>node?.props?.testID?.startsWith('chart-point-')).length,34);
});

test('the native summary switch persists the chosen method through the shared preferences callback', async () => {
  const h=fixture(),nodes=h.render('StatisticsScreen');
  const median=h.buttons(nodes).find(node=>h.texts(h.expand(node.props.children))==='Медиана');
  median.props.onPress(); await Promise.resolve();
  assert.equal(h.diary.preferences.summary,'median');
  assert.equal(h.diary.preferences.compareSummary,'mean');
});

test('a populated period displays means and a single-line list note, while an empty period explains absence', () => {
  const p=phase(1),h=fixture({...M.factoryState(),sessions:[sample(1)],phases:[p]}),ui=h.load('components/clarity/ui.tsx');
  const nodes=h.expand(ui.PhaseCard({phase:p}));
  assert.ok(h.texts(nodes).includes('Средние за период'));
  assert.equal(nodes.find(node=>node?.type==='Text'&&node.props.children===p.note).props.numberOfLines,1);
  h.diary.state.sessions=[];
  const text=h.texts(h.expand(ui.PhaseCard({phase:p,detailed:true})));
  assert.ok(text.includes('Измерений в периоде пока нет'));assert.ok(!text.includes('Средние за период'));
});

test('the period editor offers exactly the approved icons and colors and defaults to no ending date', () => {
  const h=fixture(),nodes=h.expand(h.load('components/clarity/forms.tsx').PhaseEditorScreen());
  const buttons=h.buttons(nodes);
  assert.equal(buttons.filter(node=>M.PHASE_ICONS.some(icon=>icon.label===node.props.accessibilityLabel)).length,24);
  assert.equal(buttons.filter(node=>node.props.accessibilityLabel?.startsWith('Цвет #')).length,9);
  assert.equal(buttons.find(node=>node.props.accessibilityRole==='checkbox').props.accessibilityState.checked,true);
  assert.ok(!h.texts(nodes).includes('Удалить период'));
});

test('entry numeric changes save a draft with captured time, rather than waiting for form submission', async () => {
  const h=fixture(),nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
  const field=nodes.find(node=>node?.props?.testID==='reading-0-systolic');
  field.props.onChangeText('124'); await Promise.resolve();
  assert.equal(h.writes.length,1);assert.equal(h.writes[0].mode,'single');
  assert.equal(h.writes[0].value.readings[0].systolic,'124');
  assert.equal(h.writes[0].value.readings[0].timeSource,'input');
});

test('saving a native entry opens the saved record after the matching confirmation, like the prototype', async () => {
  const state=M.factoryState(),draft=M.newDraft('series');
  draft.readings=draft.readings.map(r=>M.readingWithInput(M.readingWithInput(M.readingWithInput(r,'systolic','124'),'diastolic','82'),'pulse','73'));
  const h=fixture(M.storeDraft(state,draft)),nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
  const save=h.buttons(nodes).find(node=>h.texts(h.expand(node.props.children))==='Сохранить измерение');
  await save.props.onPress();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.success[0].title,'Серия сохранена');assert.equal(h.success[0].subtitle,'');
  h.success[0].onDone();assert.deepEqual(h.navigation,[{pathname:'/measurement/[id]',params:{id:'42'}}]);
  assert.deepEqual(h.keyboard,['dismiss']);
});

test('native numeric Return advances through the series and Done dismisses the keyboard', () => {
  const h=fixture(),nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
  const fields=nodes.filter(node=>node?.props?.testID?.startsWith('reading-'));
  const focused=[];
  fields.forEach(field=>field.props.ref({focus:()=>focused.push(field.props.testID)}));
  assert.deepEqual(fields.map(field=>field.props.returnKeyType),['next','next','done']);
  fields.forEach(field=>field.props.onSubmitEditing());
  assert.deepEqual(focused,['reading-0-diastolic','reading-0-pulse']);assert.deepEqual(h.keyboard,['dismiss']);
});

test('chart date labels never collide with the final date at narrow widths', () => {
  const h=fixture(), {axisLabels}=h.load('components/clarity/chart.tsx');
  for(const count of [1,2,5,6,7,8,9,10,11,12,50,100]) {
    const dates=Array.from({length:count},(_,i)=>`${i+1} sept.`);
    const positions=dates.map((_,i)=>34+i*218/Math.max(1,count-1));
    const indices=axisLabels(dates,positions);
    assert.equal(indices[0],0);assert.equal(indices.at(-1),count-1);
    const labels=indices.map(index=>{const width=Math.max(30,dates[index].length*6.5);const left=positions[index]-(index===0?0:index===count-1?width:width/2);return {left,right:left+width};});
    for(let i=1;i<labels.length;i++) assert.ok(labels[i].left>=labels[i-1].right+12, `overlap for ${count} points`);
  }
});

test('numeric entry uses a digits-only keyboard with per-field native actions and a tappable wellbeing track', () => {
  const h=fixture(),nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
  const inputs=nodes.filter(node=>node?.props?.testID?.startsWith('reading-'));
  for(const input of inputs){assert.equal(input.props.keyboardType,'number-pad');assert.equal(input.props.inputAccessoryViewID,undefined);}
  assert.deepEqual(inputs.map(input=>input.props.inputAccessoryViewButtonLabel),['Далее','Далее','Готово']);
  assert.ok(!nodes.some(node=>node?.type==='InputAccessoryView'));
  const slider=nodes.find(node=>node?.type==='Slider');assert.equal(slider.props.tapToSeek,true);
  slider.props.onValueChange(9);assert.equal(h.writes.at(-1).value.wellbeing,9);
});

test('opening the lower-pressure field first retains its Next action and advances straight to pulse', () => {
  const h=fixture(),nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
  const inputs=nodes.filter(node=>node?.props?.testID?.startsWith('reading-'));
  const focused=[];
  for(const input of inputs) input.props.ref({focus:()=>focused.push(input.props.testID)});
  const lower=inputs.find(input=>input.props.testID==='reading-0-diastolic');
  lower.props.onFocus();
  assert.equal(lower.props.inputAccessoryViewButtonLabel,'Далее');
  assert.equal(lower.props.submitBehavior,'submit');
  lower.props.onSubmitEditing();
  assert.deepEqual(focused,['reading-0-pulse']);
  inputs.find(input=>input.props.testID==='reading-0-pulse').props.onSubmitEditing();
  assert.deepEqual(h.keyboard,['dismiss']);
});

test('adding a series reading changes the former last pulse from Done to Next without losing values', () => {
  const pulseKeys=[];
  for(const count of [2,3]) {
    const draft=M.newDraft('series');
    draft.readings[0].systolic='120';
    if(count===3) draft.readings.push(M.newReading());
    const h=fixture({...M.factoryState(),draftMode:'series',drafts:{single:null,series:draft}});
    const nodes=h.expand(h.load('components/clarity/forms.tsx').EntryScreen());
    const inputs=nodes.filter(node=>node?.props?.testID?.startsWith('reading-'));
    assert.equal(inputs[0].props.value,'120');
    const formerLast=inputs.find(input=>input.props.testID==='reading-1-pulse');
    pulseKeys.push(formerLast.key);
    assert.equal(formerLast.props.inputAccessoryViewButtonLabel,count===2?'Готово':'Далее');
    const focused=[];
    for(const input of inputs) input.props.ref({focus:()=>focused.push(input.props.testID)});
    formerLast.props.onSubmitEditing();
    assert.deepEqual(focused,count===2?[]:['reading-2-systolic']);
    assert.deepEqual(h.keyboard,count===2?['dismiss']:[]);
  }
  assert.notEqual(pulseKeys[0],pulseKeys[1]);
});

test('history filter badge counts conditions, includes a temporary period, and excludes sorting', () => {
  const filters={sort:'oldest',from:'2026-10-01',to:'2026-10-11',mode:'series',phaseId:'1',wellbeingMin:'5',wellbeingMax:'9',tags:['Стресс','После кофе'],withNote:true};
  const h=fixture(undefined,undefined,{filters});
  let button=h.buttons(h.render('HistoryScreen')).find(node=>node.props.accessibilityLabel==='Фильтры: 7');
  assert.equal(button.props.accessibilityState.selected,true);
  h.diary.historySelection={scope:'time',preset:'7'};
  button=h.buttons(h.render('HistoryScreen')).find(node=>node.props.accessibilityLabel==='Фильтры: 8');assert.ok(button);
  h.diary.historySelection={scope:'time',preset:'all'};
  assert.ok(h.buttons(h.render('HistoryScreen')).some(node=>node.props.accessibilityLabel==='Фильтры: 7'));
  const empty=fixture();button=empty.buttons(empty.render('HistoryScreen')).find(node=>node.props.accessibilityLabel==='Фильтры');assert.equal(button.props.accessibilityState.selected,false);
});

test('comparison segmented calculation switch persists independently of statistics summary', async () => {
  const state={...M.factoryState(),sessions:[sample(1)],phases:[phase(1),phase(2)]};
  const h=fixture(state),nodes=h.render('ComparisonScreen');
  const median=h.buttons(nodes).find(node=>h.texts(h.expand(node.props.children))==='Медиана');
  assert.ok(median);assert.equal(median.props.accessibilityState.selected,false);
  median.props.onPress();await Promise.resolve();
  assert.equal(h.diary.preferences.compareSummary,'median');assert.equal(h.diary.preferences.summary,'mean');
});

test('a sheet grabs its visible top handle immediately, dismisses downward, and respects a busy operation', () => {
  for(const dismissible of [true,false]) {
    const h=fixture();let closed=0;
    const nodes=h.expand(h.load('components/clarity/ui.tsx').Sheet({visible:true,title:'Test',dismissible,onClose:()=>closed++}));
    const handle=nodes.find(node=>node?.props?.testID==='sheet-drag-handle');
    assert.equal(handle.props.collapsable,false);
    assert.equal(handle.props.onStartShouldSetPanResponder(),dismissible);
    assert.equal(handle.props.onStartShouldSetPanResponderCapture(),dismissible);
    assert.equal(handle.props.onPanResponderTerminationRequest(),false);
    assert.equal(handle.props.onMoveShouldSetPanResponder(null,{dy:30,dx:1}),dismissible);
    assert.equal(handle.props.onMoveShouldSetPanResponder(null,{dy:10,dx:35}),false);
    handle.props.onPanResponderRelease(null,{dy:15,vy:0.1});assert.equal(closed,0);
    handle.props.onPanResponderRelease(null,{dy:100,vy:1});assert.equal(closed,dismissible?1:0);
  }
  const h=fixture();let closed=0;
  const nodes=h.expand(h.load('components/clarity/ui.tsx').Sheet({visible:false,title:'Test',onClose:()=>closed++}));
  const handle=nodes.find(node=>node?.props?.testID==='sheet-drag-handle');
  assert.equal(handle.props.onStartShouldSetPanResponder(),false);
  assert.equal(handle.props.onMoveShouldSetPanResponder(null,{dy:30,dx:1}),false);
});
