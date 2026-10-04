const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');
const now = Date.parse('2026-10-02T10:00:00.000Z');
const seed = () => M.seed(now);
const reading = (systolic=120, measuredAt='2026-10-02T08:00:00.000Z') => ({systolic,diastolic:80,pulse:70,measuredAt});
const session = (readings=[reading()],id=1) => ({id,mode:readings.length===1?'single':'series',measuredAt:readings[0]?.measuredAt||reading().measuredAt,readings,wellbeing:7,tags:['Спокойно'],note:''});
test('demo has valid records, readings and non-overlapping periods', () => {
  const state=seed();assert.equal(state.sessions.length,90);
  assert.deepEqual(M.restore(M.backup(state)), {sessions:state.sessions.map(s=>({...s,createdAt:s.measuredAt})),phases:state.phases});
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
test('period boundaries are exclusive at the end and each record belongs to one period', () => {
  const state=seed(),s=session([reading(120,state.phases[1].startedAt)]);
  assert.equal(M.phaseFor(s,state.phases).id,2);assert.equal(M.inside(s,state.phases[0]),false);
});
test('new period closes open predecessor without mutating source', () => {
  const state=seed(),old=M.clone(state.phases),start=new Date(now).toISOString();
  const next=M.savePhase(state.phases,{kind:'energy',title:'Новый',startedAt:start,endedAt:null,note:''});
  assert.equal(next.find(p=>p.id===3).endedAt,start);assert.deepEqual(state.phases,old);
});
test('conflicting creation and edit are rejected before any changes', () => {
  const state=seed(),old=M.clone(state.phases);
  const p={kind:'energy',title:'Конфликт',startedAt:state.phases[0].startedAt,endedAt:null,note:''};
  assert.throws(()=>M.savePhase(state.phases,p));assert.throws(()=>M.savePhase(state.phases,p,2));assert.deepEqual(state.phases,old);
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
  assert.deepEqual(restored.sessions.map(({createdAt,...s})=>s),state.sessions);assert.deepEqual(restored.phases,state.phases);
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
  const changes=[p=>p.sessions.push(p.sessions[0]),p=>p.readings[0].session_id=9999,p=>p.readings[0].position=7,p=>p.readings[0].systolic=70,p=>p.sessions[0].wellbeing=99,p=>p.sessions[0].tags=[null],p=>p.phases[1].started_at=p.phases[0].started_at,p=>p.phases.push(p.phases[0]),p=>p.sessions[0].note=null,p=>p.readings[0].measured_at=null];
  changes.forEach(change=>{const p=M.backup(original);change(p);assert.throws(()=>M.restore(p,original.phases));});
  assert.deepEqual(original,seed());
});
test('automatic backup respects disable, retains seven days and avoids erasing last copy with empty state', () => {
  let state=seed();for(let i=0;i<10;i++)state=M.withAutoBackup(state,now+i*M.DAY);
  assert.equal(state.copies.length,7);assert.equal(state.copies[0].date,'2026-10-11');
  const disabled=M.withAutoBackup({...state,autoBackup:false},now+11*M.DAY);assert.equal(disabled.lastBackup,state.lastBackup);
  const empty=M.withAutoBackup({...state,sessions:[]},now+12*M.DAY);assert.deepEqual(empty.copies,state.copies);
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
