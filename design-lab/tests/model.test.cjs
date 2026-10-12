const { test } = require('node:test');
const assert = require('node:assert/strict');
const { saveExcel, resetStoredDiary } = require('../file-actions.js');
const M = require('../model.js');
const now = Date.parse('2026-10-02T10:00:00.000Z');
const seed = () => M.seed(now);
const withCreatedAt = phases => phases.map(p => ({...p, createdAt:p.createdAt || p.startedAt}));
const reading = (systolic=120, measuredAt='2026-10-02T08:00:00.000Z') => ({systolic,diastolic:80,pulse:70,measuredAt});
const session = (readings=[reading()],id=1) => ({id,mode:readings.length===1?'single':'series',measuredAt:readings[0]?.measuredAt||reading().measuredAt,readings,wellbeing:7,tags:['Спокойно'],note:''});

test('backup facts count snapshot records, raw readings, series, local days and periods',()=>{
  const diary={...seed(),sessions:[session(),session([reading(),reading()],2),session([reading(125,'2026-10-03T08:00:00.000Z')],3)]};
  const payload=M.backup(diary);diary.sessions=[];diary.phases=[];
  assert.deepEqual(M.backupFacts(payload),{records:3,readings:4,series:1,days:2,periods:3});
  assert.deepEqual(M.backupFacts(M.backup(M.factoryState())),{records:0,readings:0,series:0,days:0,periods:0});
});

test('factory reset leaves an empty persistent diary without reseeding or creating a backup',()=>{
  const cleared=M.factoryState(),reload=JSON.parse(JSON.stringify(cleared));
  assert.deepEqual(M.withAutoBackup(reload,now),cleared);
  assert.equal(M.resumableDraft(reload),null);
  assert.deepEqual(M.statisticsPreferences(null,reload.phases).selection,{scope:'time',preset:'7'});
  const store=new Map([['diary','old'],['preferences','custom'],['unrelated','keep']]);
  const storage={getItem:key=>store.get(key)??null,removeItem:key=>store.delete(key),setItem:(key,value)=>{store.set(key,value);}};
  resetStoredDiary(storage,'diary','preferences',cleared);
  assert.deepEqual(JSON.parse(store.get('diary')),cleared);assert.equal(store.has('preferences'),false);assert.equal(store.get('unrelated'),'keep');
  store.set('preferences','old settings');store.set('diary','old diary');
  storage.setItem=(key,value)=>{if(key==='diary')throw Error('quota');store.set(key,value);};
  assert.throws(()=>resetStoredDiary(storage,'diary','preferences',cleared),/quota/);
  assert.equal(store.get('preferences'),'old settings');assert.equal(store.get('diary'),'old diary');
});

test('Excel save picker writes a valid workbook directly and cancellation creates no download',async()=>{
  const XLSX=require('@e965/xlsx'),book=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Давление'],[120]]),'Измерения');
  const content=XLSX.write(book,{bookType:'xlsx',type:'array'}),calls=[];
  const host={showSaveFilePicker:async options=>{assert.equal(options.suggestedName,'diary.xlsx');return {createWritable:async()=>({write:async blob=>{const restored=XLSX.read(await blob.arrayBuffer());assert.equal(restored.Sheets['Измерения'].A2.v,120);calls.push('write');},close:async()=>calls.push('close'),abort:async()=>calls.push('abort')})};}};
  await saveExcel('diary.xlsx',content,host);assert.deepEqual(calls,['write','close']);
  host.showSaveFilePicker=async()=>{throw Object.assign(Error('cancel'),{name:'AbortError'});};
  await assert.rejects(saveExcel('diary.xlsx',content,host),{name:'AbortError'});assert.deepEqual(calls,['write','close']);
});

test('failed Excel writes abort the temporary stream; unsupported browsers download without app dialogs',async()=>{
  let aborted=false;
  await assert.rejects(saveExcel('diary.xlsx','bytes',{showSaveFilePicker:async()=>({createWritable:async()=>({write:async()=>{throw Error('disk');},abort:async()=>{aborted=true;}})})}),/disk/);
  assert.equal(aborted,true);
  const calls=[],link={click:()=>calls.push('click'),remove:()=>calls.push('remove')};
  const host={document:{body:{append:()=>calls.push('append')},createElement:()=>link},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>calls.push('revoke')},setTimeout:fn=>fn()};
  await saveExcel('diary.xlsx','bytes',host);assert.equal(link.download,'diary.xlsx');assert.deepEqual(calls,['append','click','remove','revoke']);
});

test('statistics preferences round trip applied choices without changing diary data',()=>{
  const state=seed(),before=M.clone(state),custom={scope:'time',preset:'custom',from:'2026-09-26',to:'2026-10-02'};
  for(const selection of [custom,{scope:'3'}]){
    const input={selection,chartMetric:'combined',summary:'median',compareType:'dates',left:'1',right:'3',leftDates:custom,rightDates:{scope:'time',preset:'30'},tab:'comparison',detailScroll:700};
    const saved=JSON.parse(JSON.stringify(M.statisticsPreferences(input,state.phases))),restored=M.statisticsPreferences(saved,state.phases);
    assert.deepEqual(restored,saved);assert.deepEqual(restored.selection,selection);
    assert.equal(restored.summary,'median');assert.equal(restored.chartMetric,'combined');assert.equal(restored.compareType,'dates');
    assert.deepEqual(M.statisticsWindow(state.sessions,state.phases,restored.selection,now).items,M.statisticsWindow(state.sessions,state.phases,selection,now).items);
    assert.equal(restored.tab,undefined);assert.equal(restored.detailScroll,undefined);
  }
  assert.deepEqual(state,before);
});
test('comparison calculation preference persists independently of the overview',()=>{
  const phases=seed().phases;
  for(const [summary,compareSummary] of [['mean','median'],['median','mean']]){
    const saved=JSON.parse(JSON.stringify(M.statisticsPreferences({summary,compareSummary},phases)));
    const restored=M.statisticsPreferences(saved,phases);
    assert.equal(restored.summary,summary);assert.equal(restored.compareSummary,compareSummary);
  }
  for(const compareSummary of [undefined,null,'unknown',[],{}])assert.equal(M.statisticsPreferences({summary:'median',compareSummary},phases).compareSummary,'mean');
});

test('statistics preferences recover invalid fields and removed periods independently',()=>{
  const state=seed(),defaults=M.statisticsPreferences(null,state.phases);
  for(const value of [null,[],42,'bad'])assert.deepEqual(M.statisticsPreferences(value,state.phases),defaults);
  for(const selection of [{scope:'404'},{scope:{toString:'invalid'}},{scope:'time',preset:[]},{scope:'time',preset:'custom',from:'2026-02-30',to:'2026-03-01'},{scope:'time',preset:'custom',from:'2026-10-03',to:'2026-10-02'}]){
    const restored=M.statisticsPreferences({selection,summary:'median',chartMetric:'pulse'},state.phases);
    assert.deepEqual(restored.selection,defaults.selection);assert.equal(restored.summary,'median');assert.equal(restored.chartMetric,'pulse');
  }
  assert.deepEqual(M.statisticsPreferences({selection:{scope:'3'},summary:'unknown',chartMetric:'unknown',compareType:'unknown',left:'3',right:'2',leftDates:{scope:'3'},rightDates:{scope:'time',preset:'custom',from:'',to:''}},[]),M.statisticsPreferences(null,[]));
});

test('saved statistics presets remain relative and period boundaries stay current',()=>{
  const state=seed(),weekly=M.statisticsPreferences({selection:{scope:'time',preset:'7',from:'2000-01-01',to:'2000-01-07'}},state.phases);
  assert.deepEqual(weekly.selection,{scope:'time',preset:'7'});
  const today=M.statisticsWindow([],[],weekly.selection,now),tomorrow=M.statisticsWindow([],[],weekly.selection,now+M.DAY);
  assert.equal(tomorrow.from-today.from,M.DAY);assert.equal(tomorrow.until-today.until,M.DAY);
  const stored=M.statisticsPreferences({selection:{scope:'3'}},state.phases),changed=M.clone(state.phases);
  changed.find(p=>p.id===3).startedAt='2026-10-01T00:00:00.000Z';
  const restored=M.statisticsPreferences(stored,changed);
  assert.equal(M.statisticsWindow(state.sessions,changed,restored.selection,now).from,Date.parse('2026-10-01T00:00:00.000Z'));
});

test('statistics median handles odd and even samples independently for every metric',()=>{
  const records=[session([reading(100)],1),{...session([{...reading(140),pulse:90}],2),wellbeing:9},{...session([{...reading(200),pulse:200}],3),wellbeing:10}];
  assert.equal(M.statisticsSummary(records,'median').values.systolic,140);
  assert.equal(M.statisticsSummary(records,'median').values.pulse,90);
  assert.equal(M.statisticsSummary(records,'median').values.wellbeing,9);
  const even=M.statisticsSummary(records.slice(0,2),'median');
  assert.equal(even.values.systolic,120);assert.equal(even.values.pulse,80);assert.equal(even.values.wellbeing,8);
  assert.equal(M.statisticsSummary(records).values.systolic,440/3);
});
test('statistics median gives a series one vote and retains fractional record averages',()=>{
  const records=[session([reading(100),reading(101),reading(102)],1),session([reading(120),reading(121)],2),session([reading(200)],3)],before=M.clone(records);
  const result=M.statisticsSummary(records,'median');
  assert.equal(result.count,3);assert.equal(result.values.systolic,120.5);assert.equal(result.systolic,121);
  assert.deepEqual(records,before);assert.equal(M.statisticsSummary(records,'mean').values.systolic,M.stats(records).averages.systolic);
});
test('statistics summary handles empty and single samples and rejects unknown methods',()=>{
  for(const method of ['mean','median']){
    assert.equal(M.statisticsSummary([],method).count,0);assert.equal(M.statisticsSummary([],method).values.pulse,0);
    assert.equal(M.statisticsSummary([session()],method).pulse,70);
  }
  assert.throws(()=>M.statisticsSummary([],'trimmed'));
});

test('statistics calendar windows include both dates and compare preceding calendar days', () => {
  const records=[session([reading(120,new Date(2026,8,25,23,59).toISOString())],1),session([reading(121,new Date(2026,8,26,0,0).toISOString())],2),session([reading(122,new Date(2026,9,2,23,59).toISOString())],3),session([reading(123,new Date(2026,9,3,0,0).toISOString())],4)];
  const w=M.statisticsWindow(records,[],{preset:'7'},+new Date(2026,9,2,12));
  assert.deepEqual(w.items.map(s=>s.id),[3,2]);assert.equal(w.days,2);
  assert.equal(new Date(w.from).getDate(),26);assert.equal(new Date(w.until).getDate(),3);
  assert.deepEqual(w.previous.items.map(s=>s.id),[1]);assert.equal(new Date(w.previous.from).getDate(),19);
  assert.deepEqual(M.statisticsWindow(records,[],{preset:'custom',from:'2026-09-26',to:'2026-10-02'}).items,w.items);
  assert.equal(M.statisticsWindow(records,[],{preset:'all'}).items.length,4);
  for(const preset of ['30','90'])assert.equal(Math.round((M.statisticsWindow([],[],{preset},+new Date(2026,9,2,12)).until-M.statisticsWindow([],[],{preset},+new Date(2026,9,2,12)).from)/M.DAY),Number(preset));
});
test('statistics custom dates reject impossible, incomplete and inverted ranges', () => {
  for(const [from,to] of [['2026-02-30','2026-03-01'],['','2026-10-02'],['2026-10-03','2026-10-02']])assert.throws(()=>M.statisticsWindow([],[],{preset:'custom',from,to}));
  assert.throws(()=>M.statisticsWindow([],[],{scope:'404'}));
  const empty=M.statisticsWindow([],[],{preset:'all'});assert.equal(empty.from,null);assert.equal(empty.previous,null);assert.equal(empty.days,0);
});
test('statistics calendar comparison respects daylight saving and year boundaries', () => {
  const previousTimezone=process.env.TZ;
  try{
    process.env.TZ='Europe/Berlin';
    const w=M.statisticsWindow([],[],{preset:'7'},+new Date(2026,2,29,12));
    assert.equal(new Date(w.from).getDate(),23);assert.equal(new Date(w.until).getDate(),30);
    assert.equal((w.until-w.from)/3600000,167);assert.equal((w.previous.until-w.previous.from)/3600000,168);
    const year=M.statisticsWindow([],[],{preset:'custom',from:'2026-12-30',to:'2027-01-02'});
    assert.equal(new Date(year.previous.from).getDate(),26);assert.equal(new Date(year.previous.until).getFullYear(),2026);
  }finally{if(previousTimezone===undefined)delete process.env.TZ;else process.env.TZ=previousTimezone;}
});
test('statistics periods preserve crossing series and report shared records without double counting', () => {
  const a=session([reading(100,'2026-10-01T22:00:00Z'),reading(140,'2026-10-02T01:00:00Z')],1),b=session([reading(130,'2026-10-02T04:00:00Z')],2);
  const phases=[{id:1,startedAt:'2026-10-01T20:00:00Z',endedAt:'2026-10-02T00:00:00Z'},{id:2,startedAt:'2026-10-01T21:00:00Z',endedAt:null}];
  const left=M.statisticsWindow([a,b],phases,{scope:'1'}),right=M.statisticsWindow([a,b],phases,{scope:'2'});
  assert.deepEqual(left.items.map(s=>s.id),[1]);assert.equal(M.stats(left.items).systolic,120);
  const compared=M.statisticsComparison(left.items,right.items);assert.equal(compared.shared,1);assert.equal(compared.left.count,1);assert.equal(compared.right.count,2);assert.equal(compared.delta.systolic,5);
});
test('statistics daily groups weight records equally and keep every original ID', () => {
  const records=[session([reading(120),reading(121)],1),session([reading(140)],2)];
  const points=M.statisticsChartPoints(records,'day');assert.equal(points.length,1);assert.equal(points[0].systolic,130.25);assert.equal(points[0].count,2);assert.deepEqual(points[0].ids,[1,2]);
  const all=Array.from({length:100},(_,i)=>session([reading(120)],i+1));assert.equal(M.statisticsChartPoints(all).length,100);
});
test('statistics weekly groups start on Monday across the new year', () => {
  const records=[session([reading(120,new Date(2026,11,28,12).toISOString())],1),session([reading(130,new Date(2027,0,3,12).toISOString())],2),session([reading(140,new Date(2027,0,4,12).toISOString())],3)];
  const points=M.statisticsChartPoints(records,'week');assert.deepEqual(points.map(p=>p.count),[2,1]);assert.equal(new Date(points[0].groupStart).getDay(),1);assert.equal(points[0].systolic,125);assert.equal(points[1].gapBefore,false);
});
test('statistics chart gaps retain missing days without inventing zero values', () => {
  const records=[session([reading(120,new Date(2026,9,1,8).toISOString())],1),session([reading(130,new Date(2026,9,4,8).toISOString())],2)];
  for(const mode of ['records','day']){const points=M.statisticsChartPoints(records,mode);assert.equal(points.length,2);assert.equal(points[1].gapBefore,true);assert.deepEqual(points.map(p=>p.systolic),[120,130]);}
  assert.deepEqual(M.statisticsChartPoints([]),[]);
});
test('statistics extremes link to raw reading timestamps and wellbeing record timestamps', () => {
  const first=session([reading(100,'2026-10-01T22:00:00Z'),{...reading(160,'2026-10-02T00:01:00Z'),pulse:200}],1),second={...session([reading(120,'2026-10-03T00:00:00Z')],2),wellbeing:10};
  const extremes=M.statisticsExtremes([second,first]);
  assert.equal(extremes.systolic.min.value,100);assert.equal(extremes.systolic.max.id,1);assert.equal(extremes.systolic.max.measuredAt,'2026-10-02T00:01:00Z');assert.equal(extremes.pulse.max.readingIndex,1);assert.equal(extremes.wellbeing.max.id,2);assert.equal(extremes.wellbeing.min.id,1);
  assert.equal(M.statisticsExtremes([]).pulse.min,null);
});
test('statistics comparison preserves raw averages and leaves missing comparisons unavailable', () => {
  const left=[session([reading(120),reading(121)],1)],right=[session([reading(120)],2)];
  assert.equal(M.statisticsComparison(left,right).delta.systolic,-0.5);
  assert.equal(M.statisticsComparison(left,[]).delta,null);assert.equal(M.statisticsComparison(left,left).shared,1);
});
test('statistics differences agree with the displayed rounded means', () => {
  const left=Array.from({length:15},(_,i)=>session([reading(i<11?122:121)],i+1));
  const right=[session([reading(121),reading(122),reading(122)],100)],before=M.clone({left,right});
  const result=M.statisticsComparison(left,right);
  assert.equal(result.left.averages.systolic,M.stats(left).averages.systolic);
  assert.equal(result.right.averages.systolic,M.stats(right).averages.systolic);
  assert.equal(result.left.values.systolic,121.7);assert.equal(result.right.values.systolic,121.7);
  assert.deepEqual(result.delta,{systolic:0,diastolic:0,pulse:0,wellbeing:0});
  const higher=[session([reading(123),reading(124),reading(124)],101)];
  const raised=M.statisticsComparison(left,higher),lowered=M.statisticsComparison(higher,left);
  assert.equal(raised.right.values.systolic,123.7);assert.equal(raised.delta.systolic,2);assert.equal(lowered.delta.systolic,-2);
  assert.equal(M.statisticsComparison([],higher).delta,null);
  assert.deepEqual({left,right},before);
});
test('comparison medians weight every record once and compare the displayed values',()=>{
  const r=(systolic,diastolic,pulse)=>({...reading(systolic),diastolic,pulse});
  const left=[{...session([r(100,50,60),r(101,51,61)],1),wellbeing:2},{...session([r(120,80,90),r(121,81,91)],2),wellbeing:7},{...session([r(200,140,110)],3),wellbeing:10}];
  const right=[{...session([r(110,60,70),r(111,61,71)],4),wellbeing:4},{...session([r(130,100,110),r(131,101,111)],5),wellbeing:8}],before=M.clone({left,right});
  const compared=M.statisticsComparison(left,right,'median');
  assert.equal(compared.left.method,'median');assert.equal(compared.left.count,3);assert.equal(compared.right.count,2);
  assert.deepEqual(compared.left.values,{systolic:120.5,diastolic:80.5,pulse:90.5,wellbeing:7});
  assert.deepEqual(compared.right.values,{systolic:120.5,diastolic:80.5,pulse:90.5,wellbeing:6});
  assert.deepEqual(compared.delta,{systolic:0,diastolic:0,pulse:0,wellbeing:-1});
  assert.equal(compared.left.averages.systolic,M.stats(left).averages.systolic);
  assert.notEqual(compared.left.values.systolic,M.statisticsComparison(left,right).left.values.systolic);
  const single=M.statisticsComparison([session([reading(121),reading(122),reading(122)])],[session([reading(122)],8)],'median');
  assert.equal(single.left.values.systolic,121.7);assert.equal(single.delta.systolic,0.3);
  assert.equal(M.statisticsComparison([],right,'median').delta,null);assert.equal(M.statisticsComparison(left,[],'median').delta,null);
  assert.throws(()=>M.statisticsComparison(left,right,'unknown'));
  assert.deepEqual({left,right},before);
});
test('demo has valid records, readings and non-overlapping periods', () => {
  const state=seed();assert.equal(state.sessions.length,90);
  assert.deepEqual(M.restore(M.backup(state)), {sessions:state.sessions.map(s=>({...s,createdAt:s.measuredAt})),phases:withCreatedAt(state.phases)});
});
test('single and series enforce bounds and keep each reading time', () => {
  M.validateSession(session());M.validateSession(session([reading(120),reading(123,'2026-10-02T08:02:00.000Z')]));
  const invalid=[session([]),{...session(),mode:'series'},session(Array.from({length:11},()=>reading())),session([reading(79)]),session([{...reading(),pulse:29}]),session([{...reading(),systolic:120.5}]),{...session(),wellbeing:11}];
  invalid.forEach(s=>assert.throws(()=>M.validateSession(s)));
});
test('series and overall averages round only final values, all sessions have equal weight', () => {
  const first=session([reading(120),reading(121)]),second=session([reading(120)],2);
  assert.equal(M.summary(first).averages.systolic,120.5);
  assert.equal(M.stats([first,second]).averages.systolic,120.25);
  assert.equal(M.stats([first,second]).systolic,120);
});
test('raw-reading ranges retain series extremes', () => {
  assert.deepEqual(M.ranges([session([reading(100),reading(140),reading(120)])]).systolic,[100,140]);
  assert.equal(M.ranges([]).pulse,null);
});
test('all eight history sort orders use unrounded averages and stable tie breaking', () => {
  const records=[session([reading(100)],1),session([{...reading(140),diastolic:95,pulse:90}],2)];
  M.SORTS.forEach(([sort])=>assert.equal(M.filter(records,{sort})[0].id,sort==='newest'||sort.endsWith('desc')?2:1));
});
test('inclusive date filtering covers the entire selected local day', () => {
  const day=new Date(2026,9,2,0,0),end=new Date(2026,9,2,23,59,59,999),after=new Date(2026,9,3,0,0);
  const records=[session([reading(120,day.toISOString())],1),session([reading(120,end.toISOString())],2),session([reading(120,after.toISOString())],3)];
  assert.equal(M.filter(records,{from:'2026-10-02',to:'2026-10-02'}).length,2);
});
test('7, 30, 90-day filters exclude future entries and adjacent out-of-range readings', () => {
  [7,30,90].forEach(days=>{
    const records=[session([reading(120,new Date(now-days*M.DAY).toISOString())],1),session([reading(120,new Date(now-days*M.DAY-1).toISOString())],2),session([reading(120,new Date(now+1).toISOString())],3)];
    assert.deepEqual(M.filter(records,{days:String(days),now}).map(s=>s.id),[1]);
  });
});
test('history shortcuts cover calendar days across month and year boundaries', () => {
  const stamp=new Date(2027,0,2,18,30).getTime();
  assert.deepEqual(M.historyInterval('today',stamp),{from:'2027-01-02',to:'2027-01-02'});
  assert.deepEqual(M.historyInterval('7',stamp),{from:'2026-12-27',to:'2027-01-02'});
  assert.deepEqual(M.historyInterval('30',stamp),{from:'2026-12-04',to:'2027-01-02'});
  assert.deepEqual(M.historyInterval('all',stamp),{from:'',to:''});
  const interval=M.historyInterval('7',stamp);
  const dates=[new Date(2026,11,26,23,59),new Date(2026,11,27,0,0),new Date(2027,0,2,23,59),new Date(2027,0,3,0,0)];
  assert.deepEqual(M.filter(dates.map((d,i)=>session([reading(120,d.toISOString())],i+1)),interval).map(s=>s.id),[3,2]);
});
test('history combines type, score, any selected tag and nonempty notes without mutating records', () => {
  const records=[
    {...session([reading(120)],1),wellbeing:4,tags:['Усталость'],note:'После прогулки'},
    {...session([reading(122),reading(124)],2),wellbeing:7,tags:['Спокойно'],note:'Серия'},
    {...session([reading(121)],3),wellbeing:8,tags:['Бодрость'],note:'   '},
    {...session([reading(125)],4),wellbeing:7,tags:['Спокойно'],note:'Повторный замер'},
  ];
  const before=M.clone(records);
  assert.deepEqual(M.filter(records,{mode:'series'}).map(s=>s.id),[2]);
  assert.deepEqual(M.filter(records,{wellbeingMin:4,wellbeingMax:7}).map(s=>s.id),[4,2,1]);
  assert.deepEqual(M.filter(records,{tags:['Усталость','Бодрость']}).map(s=>s.id),[3,1]);
  assert.deepEqual(M.filter(records,{withNote:true}).map(s=>s.id),[4,2,1]);
  assert.deepEqual(M.filter(records,{mode:'single',wellbeingMin:7,wellbeingMax:7,tags:['Спокойно'],withNote:true,sort:'systolic-asc'}).map(s=>s.id),[4]);
  assert.deepEqual(records,before);
});
test('history can show a selected observation period or records outside all periods', () => {
  const phases=[{id:1,startedAt:'2026-10-02T08:00:00.000Z',endedAt:'2026-10-02T09:00:00.000Z'}];
  const records=[session([reading(120,'2026-10-02T07:59:59.999Z')],1),session([reading()],2),session([reading(120,'2026-10-02T09:00:00.000Z')],3)];
  assert.deepEqual(M.filter(records,{phase:phases[0]}).map(s=>s.id),[2]);
  assert.deepEqual(M.filter(records,{withoutPhase:true,phases}).map(s=>s.id),[3,1]);
  assert.deepEqual(M.filter(records,{withoutPhase:true,phases:[]}).map(s=>s.id),[3,2,1]);
});
test('adjacent legacy periods include the start and exclude the end', () => {
  const state=seed(),s=session([reading(120,state.phases[1].startedAt)]);
  assert.equal(M.phaseFor(s,state.phases).id,2);assert.equal(M.inside(s,state.phases[0]),false);
});
test('new parallel period leaves all existing periods unchanged', () => {
  const state=seed(),old=M.clone(state.phases),start=new Date(now).toISOString();
  const next=M.savePhase(state.phases,{kind:'energy',title:'Новый',startedAt:start,endedAt:null,note:''});
  assert.equal(next.find(p=>p.id===3).endedAt,null);assert.deepEqual(next.find(p=>p.id===3),old.find(p=>p.id===3));assert.deepEqual(state.phases,old);
});
test('overlapping creation and edit change only the chosen period', () => {
  const state=seed(),old=M.clone(state.phases);
  const p={kind:'energy',title:'Конфликт',startedAt:state.phases[0].startedAt,endedAt:null,note:''};
  const created=M.savePhase(state.phases,p),edited=M.savePhase(state.phases,p,2);
  assert.equal(created.length,4);assert.equal(M.phasesFor(state.sessions[0],created).length,2);
  assert.equal(edited.length,3);assert.deepEqual(edited.find(p=>p.id===1),old.find(p=>p.id===1));assert.deepEqual(state.phases,old);
});
test('membership includes every matching period and keeps a crossing series whole by its first reading', () => {
  const early={id:1,startedAt:'2026-10-02T07:00:00Z',endedAt:'2026-10-02T09:00:00Z'};
  const parallel={id:2,startedAt:'2026-10-02T08:00:00Z',endedAt:null};
  const later={id:3,startedAt:'2026-10-02T09:00:00Z',endedAt:null};
  const series=session([reading(120,'2026-10-02T08:00:00Z'),reading(140,'2026-10-02T10:00:00Z')]);
  assert.deepEqual(M.phasesFor(series,[early,parallel,later]).map(p=>p.id),[1,2]);
  assert.equal(M.filter([series],{phase:early})[0].readings.length,2);
  assert.equal(M.stats(M.filter([series],{phase:early})).systolic,130);
  assert.equal(M.filter([series],{phase:later}).length,0);
  const atEnd=session([reading(120,'2026-10-02T09:00:00Z')]);
  assert.deepEqual(M.phasesFor(atEnd,[early,parallel,later]).map(p=>p.id),[2,3]);
});
test('backdated and edited period dates recalculate existing records without duplicating or changing them', () => {
  const records=[session([reading(120,'2026-10-02T08:00:00Z')],1),session([reading(140,'2026-10-02T10:00:00Z')],2)],before=M.clone(records);
  const input={kind:'custom',icon:'coffee',color:'#4f7188',title:'Кофе',note:'',startedAt:'2026-10-02T07:00:00Z',endedAt:null};
  let phases=M.savePhase([],input);phases=M.savePhase(phases,{...input,title:'Сон'});
  assert.equal(M.filter(records,{phase:phases[0]}).length,2);assert.equal(M.filter(records,{phase:phases[1]}).length,2);
  const editedId=phases[0].id;
  phases=M.savePhase(phases,{...phases[0],endedAt:'2026-10-02T09:00:00Z'},editedId);
  assert.equal(M.filter(records,{phase:phases.find(p=>p.id===editedId)}).length,1);assert.equal(M.filter(records,{phase:phases.find(p=>p.id!==editedId)}).length,2);
  assert.equal(M.filter(records,{withoutPhase:true,phases}).length,0);assert.deepEqual(records,before);
});
test('finishing one period preserves parallel periods and records the exact timestamp', () => {
  const first={kind:'custom',icon:'moon',color:'#7961b4',title:'Сон',note:'',startedAt:'2026-10-02T07:00:00Z',endedAt:null};
  let phases=M.savePhase([],first);phases=M.savePhase(phases,{...first,title:'Кофе'});const before=M.clone(phases);
  const end=Date.parse('2026-10-02T09:00:12.345Z'),finished=M.finishPhase(phases,1,end);
  assert.equal(finished.find(p=>p.id===1).endedAt,new Date(end).toISOString());assert.equal(finished.find(p=>p.id===2).endedAt,null);
  assert.equal(M.phaseStatus(finished.find(p=>p.id===1),end),'finished');assert.deepEqual(phases,before);
  assert.throws(()=>M.finishPhase(finished,1,end+1));assert.throws(()=>M.finishPhase(phases,99,end));
  assert.equal(M.phaseStatus(first,Date.parse('2026-10-02T06:00:00Z')),'scheduled');
});
test('appearance supports 24 icons, custom colors and legacy periods without accepting unsafe values', () => {
  assert.equal(M.PHASE_ICONS.length,24);assert.equal(new Set(M.PHASE_ICONS.map(i=>i.icon)).size,24);
  const input={kind:'custom',icon:'coffee',color:'#123abc',title:'Кофе',note:'',startedAt:'2026-10-02T08:00:12.345Z',endedAt:null};
  assert.deepEqual(M.phaseAppearance(M.savePhase([],input)[0]),{icon:'coffee',color:'#123abc',label:'Кофе'});
  assert.equal(M.phaseAppearance({kind:'coffee',title:'Прежний'}).icon,'coffee');
  assert.throws(()=>M.savePhase([],{...input,icon:'unknown'}));assert.throws(()=>M.savePhase([],{...input,color:'red;display:none'}));
  let phases=[];for(let i=0;i<40;i++)phases=M.savePhase(phases,{...input,title:'Период '+i,startedAt:new Date(now+i*M.DAY).toISOString(),endedAt:new Date(now+(i+1)*M.DAY).toISOString()});assert.equal(phases.length,40);
});
test('three simultaneous periods are allowed and a fourth is rejected without changing existing data', () => {
  const input={kind:'custom',icon:'coffee',color:'#4f7188',title:'Кофе',note:'',startedAt:'2026-10-02T07:00:00Z',endedAt:null};
  let phases=[];for(let i=0;i<3;i++)phases=M.savePhase(phases,{...input,title:'Период '+i});
  const before=M.clone(phases);assert.equal(M.MAX_CONCURRENT_PHASES,3);
  assert.throws(()=>M.savePhase(phases,input),e=>e.code==='PHASE_LIMIT'&&e.conflictAt==='2026-10-02T07:00:00.000Z');
  assert.deepEqual(phases,before);
  // An edit replaces its own interval instead of counting it twice.
  assert.equal(M.savePhase(phases,{...input,title:'Новое название'},1).length,3);
});
test('capacity checks historical and future dates and allows adjacent boundaries', () => {
  const input={kind:'clean',title:'Период',note:'',startedAt:'2026-10-02T07:00:00Z',endedAt:'2026-10-02T09:00:00Z'};
  let phases=[];for(let i=0;i<3;i++)phases=M.savePhase(phases,input);
  const before=M.clone(phases);
  assert.throws(()=>M.savePhase(phases,{...input,startedAt:'2026-10-02T08:00:00Z'}),/не более 3/);
  let adjacent=M.savePhase(phases,{...input,startedAt:input.endedAt,endedAt:null});
  assert.equal(adjacent.length,4);assert.equal(M.phaseLimitConflict(adjacent),null);
  assert.throws(()=>M.savePhase(adjacent,{...adjacent.find(p=>p.id===4),startedAt:'2026-10-02T08:59:59Z'},4),/не более 3/);
  for(let i=0;i<2;i++)adjacent=M.savePhase(adjacent,{...input,startedAt:input.endedAt,endedAt:null});
  assert.throws(()=>M.savePhase(adjacent,{...adjacent.find(p=>p.id===1),endedAt:'2026-10-02T09:01:00Z'},1),/не более 3/);
  let future=M.savePhase([],{...input,startedAt:'2027-01-01T00:00:00Z',endedAt:null});
  future=M.savePhase(future,{...input,startedAt:'2027-02-01T00:00:00Z',endedAt:null});
  future=M.savePhase(future,{...input,startedAt:'2027-03-01T00:00:00Z',endedAt:null});
  assert.throws(()=>M.savePhase(future,{...input,startedAt:'2027-04-01T00:00:00Z',endedAt:null}),/не более 3/);
  assert.deepEqual(phases,before);
});
test('changing a completed period into an open interval enforces the same limit', () => {
  const input={kind:'clean',title:'Период',note:'',startedAt:'2026-10-02T07:00:00Z',endedAt:'2026-10-02T09:00:00Z'};
  let phases=M.savePhase([],input);
  for(let i=0;i<3;i++)phases=M.savePhase(phases,{...input,startedAt:input.endedAt,endedAt:null});
  const before=M.clone(phases);
  assert.throws(()=>M.savePhase(phases,{...phases.find(p=>p.id===1),endedAt:null},1),/не более 3/);
  assert.deepEqual(phases,before);
});
test('restore rejects excessive overlap but older local diaries can load and reduce it safely', () => {
  const input={kind:'clean',title:'Период',note:'',startedAt:'2026-10-02T07:00:00.000Z',endedAt:null};
  const phases=Array.from({length:4},(_,i)=>({...input,id:i+1,title:'Период '+i}));
  const state={...seed(),phases},before=M.clone(state),payload=M.backup(state),payloadBefore=M.clone(payload);
  assert.throws(()=>M.restore(payload),e=>e.code==='PHASE_LIMIT');
  assert.deepEqual(M.restore(payload,[],{enforcePhaseLimit:false}).phases,withCreatedAt(phases));
  const repaired=M.finishPhase(phases,1,Date.parse('2026-10-02T09:00:00Z'));
  assert.equal(repaired.find(p=>p.id===1).endedAt,'2026-10-02T09:00:00.000Z');
  assert.equal(repaired.filter(p=>p.endedAt===null).length,3);
  assert.throws(()=>M.savePhase(repaired,input),/не более 3/);
  assert.throws(()=>M.restore({...payload,phases:undefined},phases),/не более 3/);
  assert.deepEqual(state,before);assert.deepEqual(payload,payloadBefore);
});
test('invalid periods, blank names, inverted bounds and missing IDs are rejected', () => {
  const p={kind:'clean',title:'Период',startedAt:'2026-10-02T08:00:00.000Z',endedAt:null,note:''};
  assert.throws(()=>M.savePhase([],{...p,title:' '}));assert.throws(()=>M.savePhase([],{...p,kind:'unknown'}));assert.throws(()=>M.savePhase([],{...p,endedAt:p.startedAt}));assert.throws(()=>M.savePhase([],p,1));
});
test('baseline combines clean periods by record count', () => {
  const state=seed();const clean=state.sessions.filter(s=>M.phaseFor(s,state.phases).kind==='clean');assert.deepEqual(M.baseline(state.sessions,state.phases),M.stats(clean));
});
test('dense mobile charts aggregate to at most 24 points and account for every record', () => {
  const state=seed(),points=M.chartPoints(state.sessions);
  assert.ok(points.length<=24);assert.equal(points.reduce((n,p)=>n+p.count,0),90);
  assert.equal(new Set(points.flatMap(p=>p.ids)).size,90);
  points.forEach(p=>assert.equal(p.systolic,M.stats(state.sessions.filter(s=>p.ids.includes(s.id))).averages.systolic));
});
test('single-point and equal-timestamp charts remain valid', () => {
  assert.equal(M.chartPoints([session()]).length,1);
  const points=M.chartPoints(Array.from({length:100},(_,i)=>session([reading()],i+1)));
  assert.equal(points.length,1);assert.equal(points[0].count,100);
});
test('JSON round trip preserves notes, tags, periods and individual reading times', () => {
  const state=seed(),restored=M.restore(M.backup(state));
  assert.deepEqual(restored.sessions.map(({createdAt,...s})=>s),state.sessions);assert.deepEqual(restored.phases,withCreatedAt(state.phases));
});
test('legacy JSON keeps current phases and defaults missing individual reading times', () => {
  const state=seed(),payload=M.backup(state);delete payload.phases;payload.readings.forEach(r=>delete r.measured_at);
  const restored=M.restore(payload,state.phases);assert.deepEqual(restored.phases,state.phases);
  restored.sessions.forEach(s=>s.readings.forEach(r=>assert.equal(r.measuredAt,s.measuredAt)));
});
test('explicit empty phases stay empty after backup restore', () => {
  const state=seed(),payload=M.backup(state);payload.phases=[];assert.deepEqual(M.restore(payload,state.phases).phases,[]);
});
test('timezone offsets normalize and impossible dates and times are rejected', () => {
  assert.equal(M.iso('2026-10-02T11:00:00+03:00'),'2026-10-02T08:00:00.000Z');
  ['2026-02-30T08:00:00Z','2026-10-02T24:00:00Z','2026-10-02','not a date'].forEach(d=>assert.throws(()=>M.iso(d)));
});
test('malformed backups fail without changing current data', () => {
  const original=seed();
  const changes=[p=>p.sessions.push(p.sessions[0]),p=>p.readings[0].session_id=9999,p=>p.readings[0].position=7,p=>p.readings[0].systolic=70,p=>p.sessions[0].wellbeing=99,p=>p.sessions[0].tags=[null],p=>p.phases[1].ended_at=p.phases[1].started_at,p=>p.phases.push(p.phases[0]),p=>p.sessions[0].note=null,p=>p.readings[0].measured_at=null,p=>p.phases[0].color='invalid',p=>p.phases[0].icon='unknown'];
  changes.forEach(change=>{const p=M.backup(original);change(p);assert.throws(()=>M.restore(p,original.phases));});
  assert.deepEqual(original,seed());
});
test('version 2 backup preserves overlapping periods and appearance while version 1 remains readable', () => {
  const state=seed(),before=M.clone(state.sessions);
  state.phases=M.savePhase(state.phases,{kind:'custom',title:'Кофе',icon:'coffee',color:'#123abc',note:'Параллельно',startedAt:state.phases[0].startedAt,endedAt:null});
  const payload=M.backup(state);assert.equal(payload.version,2);
  assert.deepEqual(M.restore(payload).phases,withCreatedAt(state.phases));assert.deepEqual(state.sessions,before);
  const legacy=M.backup(seed());legacy.version=1;
  assert.deepEqual(M.restore(legacy).phases,withCreatedAt(seed().phases));
  assert.throws(()=>M.restore({...payload,version:99}));
});
test('one launch backup uses a rolling 24-hour interval and never updates twice within it', () => {
  const first=Date.parse('2026-10-10T23:59:00Z'),initial=seed(),before=M.clone(initial);
  const saved=M.withAutoBackup(initial,first);
  assert.equal(saved.backupCopy.payload.exportedAt,new Date(first).toISOString());
  assert.equal(saved.lastBackup,saved.backupCopy.at);
  const changed=M.clone(saved);changed.sessions[0].note='После создания копии';
  for(const elapsed of [60000,M.DAY-1,-60000]){
    const repeated=M.withAutoBackup(changed,first+elapsed);
    assert.deepEqual(repeated.backupCopy,saved.backupCopy);
    assert.equal(repeated.lastBackup,saved.lastBackup);
    assert.equal(repeated.sessions[0].note,changed.sessions[0].note);
  }
  const next=M.withAutoBackup(changed,first+M.DAY);
  assert.equal(next.backupCopy.payload.sessions[0].note,changed.sessions[0].note);
  assert.equal(next.lastBackup,new Date(first+M.DAY).toISOString());
  assert.equal(next.copies,undefined);assert.deepEqual(initial,before);
});

test('single-copy migration retains the latest legacy snapshot and every diary field without refreshing it', () => {
  const legacy=seed();delete legacy.backupCopy;
  legacy.draft={note:'Черновик'};legacy.autoBackup=false;
  const older={at:new Date(now-M.DAY).toISOString(),payload:M.backup(legacy)};
  const latest={at:new Date(now).toISOString(),payload:M.backup(legacy)};
  latest.payload.sessions[0].note='Последняя копия';
  legacy.copies=[older,latest];const before=M.clone(legacy);
  const migrated=M.withAutoBackup(legacy,now+1);
  assert.deepEqual(migrated.backupCopy,latest);assert.equal(migrated.lastBackup,latest.at);
  assert.equal(migrated.copies,undefined);
  assert.deepEqual(migrated.sessions,legacy.sessions);assert.deepEqual(migrated.phases,legacy.phases);
  assert.deepEqual(migrated.draft,legacy.draft);assert.deepEqual(legacy,before);
});

test('disabled, empty and folder changes preserve the saved copy and original update time', () => {
  const saved=M.withAutoBackup(seed(),now);
  const disabled=M.withAutoBackup({...saved,autoBackup:false},now+M.DAY);
  const empty=M.withAutoBackup({...saved,sessions:[]},now+M.DAY);
  assert.deepEqual(disabled.backupCopy,saved.backupCopy);assert.deepEqual(empty.backupCopy,saved.backupCopy);
  assert.equal(disabled.lastBackup,saved.lastBackup);assert.equal(empty.lastBackup,saved.lastBackup);
  const folder=M.normalizeBackupState({...saved,backupFolder:'  Документы / Здоровье  '});
  assert.equal(folder.backupFolder,'Документы / Здоровье');
  assert.deepEqual(folder.backupCopy,saved.backupCopy);assert.equal(folder.lastBackup,saved.lastBackup);
  assert.equal(M.withAutoBackup({...seed(),sessions:[]},now).backupCopy,null);
});

test('reading time is captured on first numeric input, not opening or later editing', () => {
  const opened=Date.parse('2026-10-03T20:59:00Z'),entered=opened+125678;
  let r=M.newReading(opened);
  r=M.readingWithInput(r,'systolic','letters',opened+1000);
  assert.equal(r.timeSource,'pending');
  r=M.readingWithInput(r,'systolic','12',entered);
  assert.equal(r.measuredAt,new Date(entered).toISOString());
  r=M.readingWithInput(r,'systolic','123',entered+1000);
  r=M.readingWithInput(r,'diastolic','78',entered+60000);
  r=M.readingWithInput(r,'pulse','65',entered+120000);
  assert.equal(r.measuredAt,new Date(entered).toISOString());
  const resumed=JSON.parse(JSON.stringify(r));
  assert.equal(M.readingWithInput(resumed,'pulse','66',entered+3600000).measuredAt,r.measuredAt);
  const second=M.readingWithInput(M.newReading(opened),'pulse','70',entered+180000);
  assert.equal(second.measuredAt,new Date(entered+180000).toISOString());
});

test('manual dates and populated legacy drafts keep their time; cleared automatic fields recapture it', () => {
  const entered=Date.parse('2026-10-04T08:00:00Z');
  const manual={...M.newReading(),measuredAt:'2026-10-01T09:15',timeSource:'manual'};
  assert.equal(M.readingWithInput(manual,'systolic','125',entered).measuredAt,manual.measuredAt);
  const legacy={systolic:'120',diastolic:'80',pulse:'70',measuredAt:'2026-10-02T08:00'};
  assert.equal(M.readingWithInput(legacy,'pulse','72',entered).measuredAt,legacy.measuredAt);
  let r=M.readingWithInput(M.newReading(),'systolic','125',entered);
  r=M.readingWithInput(r,'systolic','',entered+1000);
  assert.equal(r.timeSource,'pending');
  assert.equal(M.readingWithInput(r,'diastolic','80',entered+60000).measuredAt,new Date(entered+60000).toISOString());
});

test('single and series drafts migrate, switch and survive reload independently', () => {
  const legacy=M.newDraft('series');legacy.readings[0].systolic='131';legacy.readings[1].pulse='69';legacy.note='Series note';legacy.tags=['Спокойно'];
  const original={...seed(),draft:legacy};
  let state=M.switchDraft(original,legacy,'single');
  let single=M.resumeDraft(state);assert.equal(single.readings[0].systolic,'');assert.equal(single.note,'');
  single.readings[0].systolic='117';single.note='Single note';single.tags=['После кофе'];
  state=M.switchDraft(state,single,'series');
  assert.deepEqual(M.resumeDraft(state),legacy);
  state=JSON.parse(JSON.stringify(state));
  state=M.switchDraft(state,M.resumeDraft(state),'single');
  assert.deepEqual(M.resumeDraft(state),single);
  assert.deepEqual(state.drafts.series,legacy);assert.deepEqual(original.draft,legacy);
  single.note='Unsaved change';assert.equal(state.drafts.single.note,'Single note');
});

test('clearing or saving one draft preserves the other and cannot revive the cleared alias', () => {
  let state=seed(),single=M.newDraft(),series=M.newDraft('series');
  single.note='Keep single';series.note='Keep series';
  state=M.storeDraft(M.storeDraft(state,single),series);
  const saved=M.clearDraft(state,'series');
  assert.deepEqual(M.resumeDraft(saved),single);assert.equal(M.entryDrafts(saved).series,null);
  const reopened=M.switchDraft(saved,M.resumeDraft(saved),'series');
  assert.equal(M.resumeDraft(reopened).note,'');assert.equal(reopened.drafts.single.note,'Keep single');
  const cleared=M.clearDraft(M.clearDraft(state,'single'),'series');
  assert.equal(cleared.draft,null);assert.deepEqual(M.entryDrafts(cleared),{single:null,series:null});
});

test('save availability requires valid pressure and pulse in every reading, including added readings', () => {
  const draft=M.newDraft();assert.equal(M.canSaveEntry(draft),false);
  draft.readings[0].systolic='120';assert.equal(M.canSaveEntry(draft),false);
  draft.readings[0].diastolic='80';assert.equal(M.canSaveEntry(draft),false);
  assert.deepEqual(M.entryReadingError(draft.readings[0]).fields,['pulse']);
  for(const pulse of ['','2','29','221','0']){
    draft.readings[0].pulse=pulse;assert.equal(M.canSaveEntry(draft),false);
  }
  draft.readings[0].pulse='70';assert.equal(M.canSaveEntry(draft),true);
  // An entered invalid value is reported immediately and prevents saving.
  draft.readings[0].systolic='0';assert.equal(M.canSaveEntry(draft),false);
  const series=M.newDraft('series');series.readings[0]={...reading(),systolic:'120',diastolic:'80'};
  assert.equal(M.canSaveEntry(series),false);
  series.readings[1].systolic='123';series.readings[1].diastolic='81';assert.equal(M.canSaveEntry(series),false);
  series.readings[1].pulse='71';assert.equal(M.canSaveEntry(series),true);
  series.readings.push(M.newReading());assert.equal(M.canSaveEntry(series),false);
  series.readings.pop();series.readings[1].diastolic='';assert.equal(M.canSaveEntry(series),false);
  assert.equal(M.canSaveEntry({...series,mode:'unsupported'}),false);
  assert.equal(M.canSaveEntry({...series,readings:[series.readings[0]]}),false);
});

test('pristine drafts ignore automatically assigned dates and mode switches', () => {
  const single=M.newDraft('single',0),series=M.newDraft('series',86400000);
  assert.equal(M.draftChanged(single),false);assert.equal(M.draftChanged(series),false);
  let state=M.storeDraft(M.storeDraft(seed(),single),series);
  assert.equal(M.resumableDraft(state),null);
  state=M.switchDraft(state,series,'single');assert.equal(M.resumableDraft(state),null);
  const changes=[d=>d.readings[0].pulse='0',d=>d.wellbeing=8,d=>d.tags=['Спокойно'],d=>d.note='Note',d=>d.readings[0].timeSource='manual',d=>d.readings.push(M.newReading())];
  changes.forEach(change=>{const draft=M.clone(single);change(draft);assert.equal(M.draftChanged(draft),true);});
  const reverted=M.clone(single);reverted.note=' ';reverted.wellbeing='7';assert.equal(M.draftChanged(reverted),false);
});

test('resume chooses a changed draft even when the active mode is pristine', () => {
  const series=M.newDraft('series');series.readings[1].diastolic='78';series.note='Keep series';
  let state=M.storeDraft(seed(),series);state=M.switchDraft(state,series,'single');
  assert.equal(state.draft.mode,'single');assert.deepEqual(M.resumableDraft(state),series);
  const resumed=M.resumableDraft(JSON.parse(JSON.stringify(state)));resumed.note='Edit';assert.equal(state.drafts.series.note,'Keep series');
  const single=M.resumeDraft(state);single.tags=['После кофе'];state=M.storeDraft(state,single);
  assert.deepEqual(M.resumableDraft(state),single);
  state=M.clearDraft(state,'single');assert.deepEqual(M.resumableDraft(state),series);
  state=M.clearDraft(state,'series');assert.equal(M.resumableDraft(state),null);
  assert.deepEqual(M.resumableDraft({...seed(),draft:series}),series);
});

test('live validation ignores empty fields but catches one invalid entered value', () => {
  const blank=M.newReading();assert.equal(M.entryReadingError(blank,{partial:true}),null);
  [['systolic','59'],['diastolic','34'],['pulse','221']].forEach(([field,value])=>{
    assert.deepEqual(M.entryReadingError({...blank,[field]:value},{partial:true}).fields,[field]);
  });
  [['systolic','120'],['diastolic','80'],['pulse','70']].forEach(([field,value])=>{
    assert.equal(M.entryReadingError({...blank,[field]:value},{partial:true}),null);
  });
  assert.deepEqual(M.entryReadingError({...blank,systolic:'80',diastolic:'80'},{partial:true}).fields,['systolic','diastolic']);
  assert.equal(M.entryReadingError({...blank,systolic:'120',diastolic:'80'},{partial:true}),null);
});

test('editing valid numeric prefixes postpones errors until completion or leaving the field', () => {
  const blank=M.newReading();
  for(const [editingField,value] of [['systolic','1'],['systolic','12'],['diastolic','1'],['diastolic','15'],['pulse','2'],['pulse','22']]){
    const r={...blank,[editingField]:value};
    assert.equal(M.entryReadingError(r,{partial:true,editingField}),null);
    assert.ok(M.entryReadingError(r,{partial:true}));
  }
  const r={...reading(),systolic:'12'};
  assert.equal(M.entryReadingError(r,{partial:true,editingField:'systolic'}),null);
  assert.equal(M.canSaveEntry({...M.newDraft(),readings:[r]}),false);
  assert.deepEqual(M.entryReadingError(r,{partial:true}).fields,['systolic','diastolic']);
  assert.equal(M.entryReadingError({...r,systolic:'125'},{partial:true,editingField:'systolic'}),null);
  assert.deepEqual(M.entryReadingError({...r,pulse:'270'},{partial:true,editingField:'systolic'}).fields,['pulse']);
  for(const [editingField,value] of [['systolic','59'],['systolic','261'],['diastolic','161'],['pulse','23'],['pulse','221']]){
    assert.ok(M.entryReadingError({...blank,[editingField]:value},{partial:true,editingField}));
  }
});

test('series of 2 through 10 readings save and round-trip with all values and timestamps', () => {
  for(let count=2;count<=10;count++){
    const readings=Array.from({length:count},(_,i)=>({...reading(120+i,new Date(now+i*60000).toISOString()),pulse:65+i}));
    const item=session(readings);
    assert.equal(M.validateSession(item),item);
    assert.equal(M.canSaveEntry(item),true);
    const restored=M.restore(M.backup({...seed(),sessions:[item]})).sessions[0];
    assert.deepEqual(restored.readings,readings);
    assert.equal(M.summary(item).averages.pulse,65+(count-1)/2);
    const incomplete=M.clone(item);incomplete.readings.at(-1).pulse='';
    assert.equal(M.canSaveEntry(incomplete),false);
  }
  const over=session(Array.from({length:11},()=>reading()));
  assert.equal(M.canSaveEntry(over),false);
  assert.throws(()=>M.validateSession(over),/2–10/);
  assert.throws(()=>M.restore(M.backup({...seed(),sessions:[over]})),/2–10/);
});

test('inline reading errors identify only invalid fields and preserve valid measurements', () => {
  assert.equal(M.entryReadingError(reading()),null);
  assert.deepEqual(M.entryReadingError({...reading(),systolic:'59'}).fields,['systolic','diastolic']);
  assert.deepEqual(M.entryReadingError({...reading(),pulse:'221'}).fields,['pulse']);
  assert.deepEqual(M.entryReadingError({...reading(),systolic:'80',diastolic:'80'}).fields,['systolic','diastolic']);
  assert.deepEqual(M.entryReadingError({...reading(),measuredAt:'invalid'}).fields,['measuredAt']);
  const series=[reading(),{...reading(),pulse:''},reading()];
  assert.deepEqual(series.map(M.entryReadingError).map(e=>!!e),[false,true,false]);
});

test('saved note updates preserve readings, drafts and other records and survive backup restore', () => {
  let original=seed();
  const single=M.newDraft(),series=M.newDraft('series');single.note='Single draft';series.note='Series draft';
  original=M.storeDraft(M.storeDraft(original,single),series);
  const previous=M.clone(original),id=original.sessions[0].id,note=' Первая строка\nВторая строка <текст> ';
  const next=M.withSessionNote(original,id,note);
  assert.deepEqual(original,previous);
  assert.deepEqual(next.sessions[0],{...previous.sessions[0],note});
  assert.deepEqual(next.sessions.slice(1),previous.sessions.slice(1));
  assert.deepEqual(next.drafts,previous.drafts);assert.deepEqual(next.draft,previous.draft);
  assert.deepEqual(M.stats(next.sessions),M.stats(previous.sessions));
  assert.equal(M.restore(M.backup(next)).sessions.find(s=>s.id===id).note,note);
  assert.equal(M.withSessionNote(next,id,'').sessions[0].note,'');
  assert.throws(()=>M.withSessionNote(original,999999,note),/не найдено/);
  assert.throws(()=>M.withSessionNote(original,id,null),/текст/);
  assert.deepEqual(original,previous);
});
