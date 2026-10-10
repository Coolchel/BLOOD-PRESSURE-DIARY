(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DiaryModel = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const DAY = 86400000;
  const MAX_SERIES_READINGS = 10;
  const MAX_CONCURRENT_PHASES = 3;
  const READING_RANGES = {systolic:[60,260],diastolic:[35,160],pulse:[30,220]};
  const TAGS = ['Нормально', 'Спокойно', 'Бодрость', 'Усталость', 'Слабость', 'Сонливость', 'Головная боль', 'Головокружение', 'Тошнота', 'Одышка', 'Сердцебиение', 'Боль в груди', 'Стресс', 'После кофе', 'После лекарства', 'После нагрузки'];
  const KINDS = [
    { kind: 'clean', label: 'Без напитков', color: '#16806b', icon: 'leaf' },
    { kind: 'coffee', label: 'Кофе', color: '#9a6240', icon: 'coffee' },
    { kind: 'energy', label: 'Энергетик', color: '#a97b0c', icon: 'bolt' },
    { kind: 'alcohol', label: 'Алкоголь', color: '#7961b4', icon: 'wine' },
    { kind: 'mixed', label: 'Всё вместе', color: '#c25b4c', icon: 'layers' },
  ];
  const PHASE_ICONS = [
    ['coffee','Кофе'],['leaf','Лист'],['bolt','Энергия'],['wine','Бокал'],['layers','Слои'],['heartPulse','Сердце'],
    ['pill','Лекарство'],['moon','Сон'],['sun','Солнце'],['walk','Прогулка'],['dumbbell','Тренировка'],['apple','Питание'],
    ['drop','Вода'],['cup','Чай'],['flower','Цветок'],['mountain','Горы'],['book','Книга'],['briefcase','Работа'],
    ['home','Дом'],['plane','Поездка'],['shield','Щит'],['clock','Часы'],['calendar','Календарь'],['star','Звезда'],
  ].map(([icon,label])=>({icon,label}));
  const PHASE_COLORS = ['#495b35','#16806b','#4f7188','#627eaa','#7961b4','#9a6240','#a97b0c','#c25b4c','#aa637a','#72796c'];
  function phaseAppearance(p) {
    const legacy=KINDS.find(k=>k.kind===p.kind)||KINDS[0];
    return {icon:p.icon||legacy.icon,color:p.color||legacy.color,label:p.title};
  }
  function phaseStatus(p,now=Date.now()) {
    if(Date.parse(p.startedAt)>now)return 'scheduled';
    return p.endedAt!==null&&Date.parse(p.endedAt)<=now?'finished':'active';
  }
  const SORTS = [ ['newest','Сначала новые'], ['oldest','Сначала старые'], ['systolic-desc','Верхнее ↓'], ['systolic-asc','Верхнее ↑'], ['diastolic-desc','Нижнее ↓'], ['diastolic-asc','Нижнее ↑'], ['pulse-desc','Пульс ↓'], ['pulse-asc','Пульс ↑'] ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readingHasValues = r => ['systolic','diastolic','pulse'].some(field => String(r[field] ?? '') !== '');
  const readingTimeSource = r => r.timeSource || (readingHasValues(r) ? 'input' : 'pending');
  function newReading(now=Date.now()) {
    return { systolic:'',diastolic:'',pulse:'',measuredAt:new Date(now).toISOString(),timeSource:'pending' };
  }
  function newDraft(mode='single',now=Date.now()) {
    return { mode,readings:Array.from({length:mode==='series'?2:1},()=>newReading(now)),wellbeing:7,tags:[],note:'' };
  }
  function readingWithInput(reading,field,value,now=Date.now()) {
    const next={...reading,timeSource:readingTimeSource(reading)};
    next[field]=String(value).replace(/\D/g,'').slice(0,3);
    if(next[field] && next.timeSource==='pending') {
      next.measuredAt=new Date(now).toISOString();next.timeSource='input';
    } else if(!readingHasValues(next) && next.timeSource==='input') next.timeSource='pending';
    return next;
  }
  function entryDrafts(state) {
    const drafts={single:null,series:null,...clone(state.drafts||{})};
    // Retain the existing unfinished entry when migrating the previous one-draft format.
    if(state.draft && ['single','series'].includes(state.draft.mode) && !drafts[state.draft.mode]) drafts[state.draft.mode]=clone(state.draft);
    return drafts;
  }
  function resumeDraft(state,now=Date.now()) {
    const drafts=entryDrafts(state),mode=state.draftMode||state.draft?.mode||'single';
    return clone(drafts[mode]||drafts.single||drafts.series||newDraft(mode,now));
  }
  function draftChanged(draft) {
    if(!draft)return false;
    const readings=draft.readings||[],standardCount=draft.mode==='series'?2:1;
    return readings.length!==standardCount || readings.some(r=>readingHasValues(r)||r.timeSource==='manual') ||
      Number(draft.wellbeing??7)!==7 || (draft.tags||[]).length>0 || String(draft.note||'').trim()!=='';
  }
  function resumableDraft(state) {
    const drafts=entryDrafts(state),mode=state.draftMode||state.draft?.mode||'single';
    const draft=[drafts[mode],drafts.single,drafts.series].find(draftChanged);
    return draft?clone(draft):null;
  }
  function storeDraft(state,draft) {
    const next=clone(state);next.drafts=entryDrafts(state);next.drafts[draft.mode]=clone(draft);
    // Keep the active alias for existing home/undo behavior and older saved states.
    next.draft=clone(draft);next.draftMode=draft.mode;return next;
  }
  function switchDraft(state,current,mode,now=Date.now()) {
    const next=storeDraft(state,current);
    return storeDraft(next,next.drafts[mode]||newDraft(mode,now));
  }
  function clearDraft(state,mode) {
    const next=clone(state);next.drafts=entryDrafts(state);next.drafts[mode]=null;
    next.draft=clone(next.drafts[mode==='single'?'series':'single']);next.draftMode=next.draft?.mode||'single';
    return next;
  }
  function iso(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Некорректная дата.');
    const [y,m,d] = value.slice(0,10).split('-').map(Number);
    const cal = new Date(0); cal.setUTCFullYear(y,m-1,d);
    if (cal.getUTCMonth() !== m-1 || cal.getUTCDate() !== d || +value.slice(11,13) > 23 || +value.slice(14,16) > 59 || +value.slice(17,19) > 59) throw new Error('Некорректная дата.');
    return new Date(value).toISOString();
  }
  function validReading(r) {
    return !!r && Number.isInteger(r.systolic) && r.systolic >= 60 && r.systolic <= 260 && Number.isInteger(r.diastolic) && r.diastolic >= 35 && r.diastolic <= 160 && r.systolic > r.diastolic && Number.isInteger(r.pulse) && r.pulse >= 30 && r.pulse <= 220;
  }
  function canSaveEntry(draft) {
    if(!draft || !['single','series'].includes(draft.mode) || !Array.isArray(draft.readings))return false;
    const count=draft.readings.length;
    if(draft.mode==='single'?count!==1:count<2||count>MAX_SERIES_READINGS)return false;
    return draft.readings.every(r=>!entryReadingError(r));
  }
  function canCompleteReadingValue(field,value) {
    const text=String(value??'').trim(),range=READING_RANGES[field];
    if(!range||!text||text.length>=3)return false;
    // A number still being typed is not an error if more digits can make it valid.
    for(let candidate=range[0];candidate<=range[1];candidate++){
      const complete=String(candidate);
      if(complete.length>text.length&&complete.startsWith(text))return true;
    }
    return false;
  }
  function entryReadingError(r,{partial=false,editingField=null}={}) {
    const fields=['systolic','diastolic','pulse'];
    const deferred=partial&&canCompleteReadingValue(editingField,r[editingField])?editingField:null;
    const values=Object.fromEntries(fields.map(field=>[field,field===deferred||String(r[field]??'').trim()===''?NaN:Number(r[field])]));
    const checked=partial?fields.filter(field=>field!==deferred&&String(r[field]??'').trim()!==''):fields;
    const invalid=checked.filter(field=>!Number.isInteger(values[field])||values[field]<READING_RANGES[field][0]||values[field]>READING_RANGES[field][1]);
    if(Number.isFinite(values.systolic)&&Number.isFinite(values.diastolic)&&values.systolic<=values.diastolic)invalid.push('systolic','diastolic');
    if(invalid.length) {
      return {fields:[...new Set(invalid)],message:(!partial&&String(r.pulse??'').trim()===''?'Введите пульс. ':'')+'Верхнее: 60–260; нижнее: 35–160; пульс: 30–220. Верхнее должно быть больше нижнего.'};
    }
    if((!partial||readingHasValues(r)||r.timeSource==='manual')&&!Number.isFinite(Date.parse(r.measuredAt)))return {fields:['measuredAt'],message:'Укажите дату и время этого замера.'};
    return null;
  }
  function validateSession(s) {
    if (!s || !['single','series'].includes(s.mode) || !Array.isArray(s.readings)) throw new Error('Проверьте запись.');
    if (s.mode === 'single' ? s.readings.length !== 1 : s.readings.length < 2 || s.readings.length > MAX_SERIES_READINGS) throw new Error('Серия должна содержать 2–10 замеров.');
    if (s.readings.some(r => !validReading(r))) throw new Error('Верхнее: 60–260; нижнее: 35–160; пульс: 30–220. Верхнее должно быть больше нижнего.');
    iso(s.measuredAt);
    s.readings.forEach(r => iso(r.measuredAt));
    if (!Number.isInteger(s.wellbeing) || s.wellbeing < 1 || s.wellbeing > 10) throw new Error('Самочувствие: от 1 до 10.');
    if (!Array.isArray(s.tags) || s.tags.some(t => typeof t !== 'string') || typeof s.note !== 'string') throw new Error('Проверьте отметки и заметку.');
    return s;
  }
  function summary(s) {
    const averages = Object.fromEntries(['systolic','diastolic','pulse'].map(key => [key, s.readings.reduce((sum,r) => sum+r[key],0)/s.readings.length]));
    return { ...s, averages, ...Object.fromEntries(Object.entries(averages).map(([k,v]) => [k,Math.round(v)])), readingCount:s.readings.length };
  }
  function withSessionNote(state,id,note) {
    if(typeof note!=='string')throw new Error('Проверьте текст заметки.');
    const next=clone(state),item=next.sessions.find(s=>s.id===id);
    if(!item)throw new Error('Измерение не найдено.');
    item.note=note;
    return next;
  }
  function stats(sessions) {
    const items = sessions.map(summary);
    const averages = Object.fromEntries(['systolic','diastolic','pulse','wellbeing'].map(key => [key,items.length ? items.reduce((sum,s) => sum+(key === 'wellbeing' ? s.wellbeing : s.averages[key]),0)/items.length : 0]));
    return { count:items.length, averages, ...Object.fromEntries(Object.entries(averages).map(([k,v]) => [k,k === 'wellbeing' ? Math.round(v*10)/10 : Math.round(v)])) };
  }
  function statisticsSummary(sessions,method='mean') {
    if(!['mean','median'].includes(method))throw new Error('Неизвестный способ расчёта.');
    const items=sessions.map(summary);
    const values=method==='mean'?stats(sessions).averages:Object.fromEntries(['systolic','diastolic','pulse','wellbeing'].map(key=>{
      const sorted=items.map(s=>key==='wellbeing'?s.wellbeing:s.averages[key]).sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);
      return [key,sorted.length?(sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2):0];
    }));
    return {count:items.length,method,values,...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,key==='wellbeing'?Math.round(value*10)/10:Math.round(value)]))};
  }
  const inside = (s,p) => Date.parse(s.measuredAt) >= Date.parse(p.startedAt) && (p.endedAt === null || Date.parse(s.measuredAt) < Date.parse(p.endedAt));
  const phasesFor = (s,phases) => phases.filter(p => inside(s,p));
  const phaseFor = (s,phases) => phasesFor(s,phases)[0];
  function historyInterval(preset, now=Date.now()) {
    if (!['today','7','30'].includes(preset)) return {from:'',to:''};
    const end=new Date(now),start=new Date(now);
    start.setDate(start.getDate()-(preset==='today'?0:Number(preset)-1));
    const day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    return {from:day(start),to:day(end)};
  }
  function filter(sessions, { days='all', phase=null, from='', to='', sort='newest', now=Date.now(), mode='all', wellbeingMin='', wellbeingMax='', tags=[], withNote=false, withoutPhase=false, phases=[] } = {}) {
    let items = sessions.filter(s => {
      const time = Date.parse(s.measuredAt);
      if (days !== 'all' && (time < now-Number(days)*DAY || time > now)) return false;
      if (phase && !inside(s,phase)) return false;
      if (from && time < new Date(from+'T00:00:00').getTime()) return false;
      if (to) { const end = new Date(to+'T00:00:00'); end.setDate(end.getDate()+1); if (time >= end.getTime()) return false; }
      if (mode!=='all' && s.mode!==mode) return false;
      if (wellbeingMin!=='' && s.wellbeing<Number(wellbeingMin)) return false;
      if (wellbeingMax!=='' && s.wellbeing>Number(wellbeingMax)) return false;
      if (tags.length && !tags.some(tag=>s.tags.includes(tag))) return false;
      if (withNote && !s.note.trim()) return false;
      if (withoutPhase && phaseFor(s,phases)) return false;
      return true;
    });
    if (sort === 'newest' || sort === 'oldest') items.sort((a,b) => (Date.parse(a.measuredAt)-Date.parse(b.measuredAt) || a.id-b.id)*(sort === 'newest' ? -1 : 1));
    else { const [key,dir] = sort.split('-'); items.sort((a,b) => (summary(a).averages[key]-summary(b).averages[key])*(dir === 'desc' ? -1 : 1) || b.id-a.id); }
    return items;
  }
  function ranges(sessions) {
    const readings = sessions.flatMap(s => s.readings);
    return Object.fromEntries(['systolic','diastolic','pulse'].map(key => [key, readings.length ? readings.reduce((range,r) => [Math.min(range[0],r[key]),Math.max(range[1],r[key])],[Infinity,-Infinity]) : null]));
  }
  function phaseInput(input) {
    if (!input || !(input.kind==='custom'||KINDS.some(k => k.kind === input.kind)) || typeof input.title !== 'string' || !input.title.trim() || typeof input.note !== 'string') throw new Error('Укажите название периода.');
    if(input.icon!==undefined&&!PHASE_ICONS.some(i=>i.icon===input.icon))throw new Error('Выберите значок периода.');
    if(input.color!==undefined&&(typeof input.color!=='string'||!/^#[0-9a-f]{6}$/i.test(input.color)))throw new Error('Выберите цвет периода.');
    if(input.kind==='custom'&&(!input.icon||!input.color))throw new Error('Выберите цвет и значок периода.');
    const result = { ...input, title:input.title.trim(), note:input.note.trim(), startedAt:iso(input.startedAt), endedAt:input.endedAt === null ? null : iso(input.endedAt) };
    if (result.endedAt !== null && result.endedAt <= result.startedAt) throw new Error('Конец периода должен быть позже начала.');
    return result;
  }
  function phaseLimitConflict(phases,previous=[]) {
    const events=[];
    const add=(items,old)=>items.forEach(p=>{
      events.push({time:Date.parse(p.startedAt),delta:1,old});
      if(p.endedAt!==null)events.push({time:Date.parse(p.endedAt),delta:-1,old});
    });
    add(phases,false);add(previous,true);events.sort((a,b)=>a.time-b.time);
    let count=0,oldCount=0;
    for(let i=0;i<events.length;){
      const time=events[i].time;
      // Apply all boundaries together: a period ending here no longer overlaps a new one.
      do{const e=events[i++];if(e.old)oldCount+=e.delta;else count+=e.delta;}while(i<events.length&&events[i].time===time);
      if(count>MAX_CONCURRENT_PHASES&&count>oldCount)return new Date(time).toISOString();
    }
    return null;
  }
  function assertPhaseLimit(phases,previous=[]) {
    const conflict=phaseLimitConflict(phases,previous);
    if(conflict){
      const error=new Error('Одновременно могут идти не более 3 периодов. Измените даты или завершите один из периодов.');
      error.code='PHASE_LIMIT';error.conflictAt=conflict;throw error;
    }
  }
  function savePhase(phases,input,id=null) {
    const next = phaseInput(input);
    if (id !== null && !phases.some(p => p.id === id)) throw new Error('Период не найден.');
    const result = clone(phases).filter(p => p.id !== id);
    next.id = id ?? Math.max(0,...phases.map(p => p.id))+1;
    const saved=[...result,next].sort((a,b) => b.startedAt.localeCompare(a.startedAt));
    // Existing diaries remain readable; shortening an older excessive overlap is allowed.
    assertPhaseLimit(saved,phases);
    return saved;
  }
  function finishPhase(phases,id,now=Date.now()) {
    const p=phases.find(p=>p.id===id);
    if(!p)throw new Error('Период не найден.');
    if(phaseStatus(p,now)!=='active')throw new Error('Завершить можно только действующий период.');
    return savePhase(phases,{...p,endedAt:new Date(now).toISOString()},id);
  }
  function baseline(sessions,phases) { return stats(sessions.filter(s => phases.some(p => p.kind === 'clean' && inside(s,p)))); }
  function chartPoints(sessions,max=24) {
    const ordered = sessions.slice().sort((a,b) => Date.parse(a.measuredAt)-Date.parse(b.measuredAt) || a.id-b.id);
    if (ordered.length <= max) return ordered.map(s => ({ ...summary(s),count:1,ids:[s.id] }));
    const start = Date.parse(ordered[0].measuredAt), end = Date.parse(ordered.at(-1).measuredAt);
    const bucketSize = Math.max(1,(end-start+1)/max);
    const buckets = new Map();
    ordered.forEach(s => { const i = Math.min(max-1,Math.floor((Date.parse(s.measuredAt)-start)/bucketSize)); if (!buckets.has(i)) buckets.set(i,[]); buckets.get(i).push(s); });
    return [...buckets.values()].map(group => {
      const averages = stats(group).averages;
      return { id:group[0].id,measuredAt:new Date(group.reduce((sum,s) => sum+Date.parse(s.measuredAt),0)/group.length).toISOString(),from:group[0].measuredAt,to:group.at(-1).measuredAt,...averages,count:group.length,ids:group.map(s=>s.id) };
    });
  }
  const localDay = value => {
    const d=new Date(value);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  function calendarDate(value) {
    const d=new Date(value+'T00:00:00');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(+d)||localDay(d)!==value)throw new Error('Укажите корректные даты.');
    return d;
  }
  const dayNumber = value => {
    const d=new Date(value);
    return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY;
  };
  function statisticsWindow(sessions,phases,selection={},now=Date.now()) {
    const {scope='time',preset='7'}=selection;
    if(scope!=='time'){
      const phase=phases.find(p=>String(p.id)===String(scope));
      if(!phase)throw new Error('Период не найден.');
      const items=filter(sessions,{phase});
      return {items,phase,from:Date.parse(phase.startedAt),until:phase.endedAt?Date.parse(phase.endedAt):Math.max(now,...items.map(s=>Date.parse(s.measuredAt)+1)),previous:null,days:new Set(items.map(s=>localDay(s.measuredAt))).size};
    }
    if(preset==='all'){
      const items=filter(sessions);
      return {items,phase:null,from:items.length?+calendarDate(localDay(items.at(-1).measuredAt)):null,until:items.length?+nextDay(calendarDate(localDay(items[0].measuredAt))):null,previous:null,days:new Set(items.map(s=>localDay(s.measuredAt))).size};
    }
    let start,end;
    if(preset==='custom'){
      start=calendarDate(selection.from||'');end=calendarDate(selection.to||'');
      if(start>end)throw new Error('Дата начала должна быть не позже даты окончания.');
    }else{
      if(!['7','30','90'].includes(String(preset)))throw new Error('Выберите интервал.');
      end=calendarDate(localDay(now));start=new Date(end);start.setDate(start.getDate()-Number(preset)+1);
    }
    const until=+nextDay(end),from=+start,length=dayNumber(end)-dayNumber(start)+1;
    const priorStart=new Date(start);priorStart.setDate(priorStart.getDate()-length);
    const items=sessions.filter(s=>Date.parse(s.measuredAt)>=from&&Date.parse(s.measuredAt)<until).sort((a,b)=>Date.parse(b.measuredAt)-Date.parse(a.measuredAt)||b.id-a.id);
    return {items,phase:null,from,until,previous:{from:+priorStart,until:from,items:sessions.filter(s=>Date.parse(s.measuredAt)>=+priorStart&&Date.parse(s.measuredAt)<from)},days:new Set(items.map(s=>localDay(s.measuredAt))).size};
  }
  function statisticsPreferences(value,phases=[]) {
    const saved=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const selection=input=>{
      if(!input||typeof input!=='object'||Array.isArray(input))return null;
      if(input.scope!==undefined&&typeof input.scope!=='string'&&!Number.isSafeInteger(input.scope))return null;
      if(input.preset!==undefined&&typeof input.preset!=='string'&&!Number.isSafeInteger(input.preset))return null;
      const scope=String(input.scope??'time'),preset=String(input.preset??'7');
      if(preset==='custom'&&(typeof input.from!=='string'||typeof input.to!=='string'))return null;
      const result=scope==='time'?{scope,preset,...(preset==='custom'?{from:input.from,to:input.to}:{})}:{scope};
      try{statisticsWindow([],phases,result);return result;}catch{return null;}
    };
    const dates=input=>input?.scope==='time'?selection(input):null;
    const phaseId=id=>(typeof id==='string'||Number.isSafeInteger(id))&&phases.some(p=>String(p.id)===String(id))?String(id):null;
    return {
      selection:selection(saved.selection)||{scope:'time',preset:'7'},
      chartMetric:['systolic','diastolic','pulse','pressure','combined'].includes(saved.chartMetric)?saved.chartMetric:'pressure',
      summary:['mean','median'].includes(saved.summary)?saved.summary:'mean',
      compareType:saved.compareType==='dates'?'dates':'phases',
      left:phaseId(saved.left),right:phaseId(saved.right),
      leftDates:dates(saved.leftDates),rightDates:dates(saved.rightDates),
    };
  }
  function nextDay(value) { const d=new Date(value);d.setDate(d.getDate()+1);return d; }
  function statisticsChartPoints(sessions,aggregation='records') {
    const ordered=sessions.slice().sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt)||a.id-b.id);
    if(!['records','day','week'].includes(aggregation))throw new Error('Выберите вид графика.');
    const groups=new Map();
    ordered.forEach(s=>{
      const start=calendarDate(localDay(s.measuredAt));
      if(aggregation==='week')start.setDate(start.getDate()-(start.getDay()+6)%7);
      const key=aggregation==='records'?s.id:localDay(start);
      if(!groups.has(key))groups.set(key,{start:+start,items:[]});
      groups.get(key).items.push(s);
    });
    let previous=null;
    return [...groups.values()].map(({start,items})=>{
      const mean=stats(items).averages,first=items[0],last=items.at(-1);
      const point={...mean,id:first.id,measuredAt:new Date(items.reduce((sum,s)=>sum+Date.parse(s.measuredAt),0)/items.length).toISOString(),from:first.measuredAt,to:last.measuredAt,count:items.length,ids:items.map(s=>s.id),groupStart:new Date(start).toISOString(),gapBefore:previous!==null&&dayNumber(start)-dayNumber(previous)>(aggregation==='week'?7:1)};
      previous=start;return point;
    });
  }
  function statisticsExtremes(sessions) {
    const result=Object.fromEntries(['systolic','diastolic','pulse','wellbeing'].map(key=>[key,{min:null,max:null}]));
    const candidates=[];
    sessions.forEach(s=>{
      s.readings.forEach((r,index)=>candidates.push({id:s.id,measuredAt:r.measuredAt||s.measuredAt,index,reading:r}));
      candidates.push({id:s.id,measuredAt:s.measuredAt,index:null,reading:{wellbeing:s.wellbeing}});
    });
    candidates.sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt)||a.id-b.id);
    candidates.forEach(({id,measuredAt,index,reading})=>Object.keys(result).forEach(key=>{
      if(reading[key]===undefined)return;
      const point={value:reading[key],id,measuredAt,readingIndex:index};
      if(!result[key].min||point.value<result[key].min.value)result[key].min=point;
      if(!result[key].max||point.value>result[key].max.value)result[key].max=point;
    }));
    return result;
  }
  function statisticsComparison(left,right) {
    const a=stats(left),b=stats(right),ids=new Set(left.map(s=>s.id));
    return {left:a,right:b,shared:right.filter(s=>ids.has(s.id)).length,delta:a.count&&b.count?Object.fromEntries(Object.keys(a.averages).map(key=>[key,Math.round((b.averages[key]-a.averages[key])*10)/10])):null};
  }
  function backup(state) {
    return { app:'Давление',version:2,exportedAt:new Date().toISOString(),
      sessions:state.sessions.map(s => ({ id:s.id,measured_at:s.measuredAt,wellbeing:s.wellbeing,tags:s.tags,note:s.note,mode:s.mode,created_at:s.createdAt || s.measuredAt })),
      readings:state.sessions.flatMap(s => s.readings.map((r,position) => ({ session_id:s.id,position,systolic:r.systolic,diastolic:r.diastolic,pulse:r.pulse,measured_at:r.measuredAt }))),
      phases:state.phases.map(p => ({ id:p.id,kind:p.kind,title:p.title,...(p.icon!==undefined?{icon:p.icon}:{}),...(p.color!==undefined?{color:p.color}:{}),started_at:p.startedAt,ended_at:p.endedAt,note:p.note,created_at:p.createdAt || p.startedAt })) };
  }
  function restore(payload,currentPhases=[],{enforcePhaseLimit=true}={}) {
    if (!payload || payload.app !== 'Давление' || ![1,2].includes(payload.version) || !Array.isArray(payload.sessions) || !Array.isArray(payload.readings) || !payload.sessions.length) throw new Error('Выберите непустую резервную копию JSON приложения «Давление».');
    const idOK = id => Number.isSafeInteger(id) && id>0;
    if (payload.sessions.some(s => !s || !idOK(s.id)) || new Set(payload.sessions.map(s=>s.id)).size !== payload.sessions.length) throw new Error('Повторяющиеся или некорректные номера записей.');
    const ids = new Set(payload.sessions.map(s=>s.id));
    if (payload.readings.some(r => !r || !ids.has(r.session_id) || !Number.isInteger(r.position) || r.position < 0)) throw new Error('Некорректные замеры в копии.');
    const sessions = payload.sessions.map(s => {
      const measuredAt = iso(s.measured_at);
      const group = payload.readings.filter(r => r.session_id === s.id).sort((a,b) => a.position-b.position);
      if (group.some((r,i) => r.position !== i)) throw new Error('Нарушен порядок замеров.');
      return validateSession({ id:s.id,measuredAt,createdAt:s.created_at ? iso(s.created_at) : measuredAt,wellbeing:s.wellbeing,tags:s.tags,note:s.note,mode:s.mode,readings:group.map(r => ({ systolic:r.systolic,diastolic:r.diastolic,pulse:r.pulse,measuredAt:r.measured_at === undefined ? measuredAt : iso(r.measured_at) })) });
    });
    let phases = clone(currentPhases);
    if (payload.phases !== undefined) {
      if (!Array.isArray(payload.phases) || payload.phases.some(p => !p || !idOK(p.id)) || new Set(payload.phases.map(p=>p.id)).size !== payload.phases.length) throw new Error('Некорректные периоды.');
      phases = payload.phases.map(p => phaseInput({ id:p.id,kind:p.kind,title:p.title,note:p.note,...(p.icon!==undefined?{icon:p.icon}:{}),...(p.color!==undefined?{color:p.color}:{}),startedAt:p.started_at,endedAt:p.ended_at == null ? null : p.ended_at }));
    }
    if(enforcePhaseLimit)assertPhaseLimit(phases);
    return { sessions,phases };
  }
  function seed(now=Date.now()) {
    const day = new Date(now); day.setHours(8,15,0,0);
    const start = +day-89*DAY;
    const phases = [
      { id:1,kind:'clean',title:'Без напитков',startedAt:new Date(start).toISOString(),endedAt:new Date(start+30*DAY).toISOString(),note:'Базовый период для сравнения.' },
      { id:2,kind:'coffee',title:'Утренний кофе',startedAt:new Date(start+30*DAY).toISOString(),endedAt:new Date(start+58*DAY).toISOString(),note:'Отмечаю изменения в привычном режиме.' },
      { id:3,kind:'clean',title:'Спокойный ритм',startedAt:new Date(start+58*DAY).toISOString(),endedAt:null,note:'Возвращаюсь к режиму без напитков.' },
    ];
    const sessions = [];
    for (let i=0; i<90; i++) {
      const time = start+i*DAY;
      if (time > now) continue;
      const coffee = i >= 30 && i < 58;
      const systolic = Math.round(121+Math.sin(i*.7)*6+(coffee?7:0));
      const diastolic = Math.round(78+Math.sin(i*.51)*4+(coffee?4:0));
      const pulse = Math.round(68+Math.cos(i*.67)*6+(coffee?5:0));
      const n = i%9 === 0 ? 3 : 1;
      const readings = Array.from({length:n},(_,j) => ({ systolic:systolic+(j===0&&n>1?4:-j),diastolic:diastolic+(j===0&&n>1?2:0),pulse:pulse+j,measuredAt:new Date(time+j*120000).toISOString() }));
      sessions.push({ id:i+1,measuredAt:readings[0].measuredAt,wellbeing:coffee?6+(i%3):7+(i%3),tags:coffee?['После кофе']:['Спокойно'],note:i%8===0?'После отдыха. Измерение сидя.':'',mode:n===1?'single':'series',readings });
    }
    return { schema:1,sessions,phases,autoBackup:true,lastBackup:null,copies:[],draft:null };
  }
  function withAutoBackup(state,now=Date.now()) {
    const next = clone(state);
    if (!next.autoBackup || !next.sessions.length) return next;
    const stamp = new Date(now).toISOString();
    const day = new Date(now); const date = [day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
    next.lastBackup=stamp;
    next.copies=[{ date,at:stamp,payload:backup(next) },...(next.copies||[]).filter(c=>c.date!==date)].slice(0,7);
    return next;
  }
  return { DAY,MAX_SERIES_READINGS,MAX_CONCURRENT_PHASES,TAGS,KINDS,PHASE_ICONS,PHASE_COLORS,SORTS,clone,iso,validReading,validateSession,canSaveEntry,entryReadingError,summary,withSessionNote,stats,statisticsSummary,inside,phaseFor,phasesFor,phaseAppearance,phaseStatus,phaseLimitConflict,historyInterval,filter,ranges,savePhase,finishPhase,baseline,chartPoints,statisticsWindow,statisticsPreferences,statisticsChartPoints,statisticsExtremes,statisticsComparison,backup,restore,seed,withAutoBackup,newReading,newDraft,readingTimeSource,readingWithInput,entryDrafts,resumeDraft,draftChanged,resumableDraft,storeDraft,switchDraft,clearDraft };
});
