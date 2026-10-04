(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DiaryModel = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const DAY = 86400000;
  const MAX_SERIES_READINGS = 10;
  const READING_RANGES = {systolic:[60,260],diastolic:[35,160],pulse:[30,220]};
  const TAGS = ['Нормально', 'Спокойно', 'Бодрость', 'Усталость', 'Слабость', 'Сонливость', 'Головная боль', 'Головокружение', 'Тошнота', 'Одышка', 'Сердцебиение', 'Боль в груди', 'Стресс', 'После кофе', 'После лекарства', 'После нагрузки'];
  const KINDS = [
    { kind: 'clean', label: 'Без напитков', color: '#16806b', icon: 'leaf' },
    { kind: 'coffee', label: 'Кофе', color: '#9a6240', icon: 'coffee' },
    { kind: 'energy', label: 'Энергетик', color: '#a97b0c', icon: 'bolt' },
    { kind: 'alcohol', label: 'Алкоголь', color: '#7961b4', icon: 'wine' },
    { kind: 'mixed', label: 'Всё вместе', color: '#c25b4c', icon: 'layers' },
  ];
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
  function stats(sessions) {
    const items = sessions.map(summary);
    const averages = Object.fromEntries(['systolic','diastolic','pulse','wellbeing'].map(key => [key,items.length ? items.reduce((sum,s) => sum+(key === 'wellbeing' ? s.wellbeing : s.averages[key]),0)/items.length : 0]));
    return { count:items.length, averages, ...Object.fromEntries(Object.entries(averages).map(([k,v]) => [k,k === 'wellbeing' ? Math.round(v*10)/10 : Math.round(v)])) };
  }
  const inside = (s,p) => Date.parse(s.measuredAt) >= Date.parse(p.startedAt) && (p.endedAt === null || Date.parse(s.measuredAt) < Date.parse(p.endedAt));
  const phaseFor = (s,phases) => phases.find(p => inside(s,p));
  function filter(sessions, { days='all', phase=null, from='', to='', sort='newest', now=Date.now() } = {}) {
    let items = sessions.filter(s => {
      const time = Date.parse(s.measuredAt);
      if (days !== 'all' && (time < now-Number(days)*DAY || time > now)) return false;
      if (phase && !inside(s,phase)) return false;
      if (from && time < new Date(from+'T00:00:00').getTime()) return false;
      if (to) { const end = new Date(to+'T00:00:00'); end.setDate(end.getDate()+1); if (time >= end.getTime()) return false; }
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
    if (!input || !KINDS.some(k => k.kind === input.kind) || typeof input.title !== 'string' || !input.title.trim() || typeof input.note !== 'string') throw new Error('Укажите название и тип периода.');
    const result = { ...input, title:input.title.trim(), note:input.note.trim(), startedAt:iso(input.startedAt), endedAt:input.endedAt === null ? null : iso(input.endedAt) };
    if (result.endedAt !== null && result.endedAt <= result.startedAt) throw new Error('Конец периода должен быть позже начала.');
    return result;
  }
  const overlaps = (a,b) => Date.parse(a.startedAt) < (b.endedAt === null ? Infinity : Date.parse(b.endedAt)) && Date.parse(b.startedAt) < (a.endedAt === null ? Infinity : Date.parse(a.endedAt));
  function savePhase(phases,input,id=null) {
    const next = phaseInput(input);
    if (id !== null && !phases.some(p => p.id === id)) throw new Error('Период не найден.');
    let result = clone(phases).filter(p => p.id !== id);
    if (id === null) result = result.map(p => p.endedAt === null && p.startedAt < next.startedAt ? { ...p,endedAt:next.startedAt } : p);
    if (result.some(p => overlaps(p,next))) throw new Error('Даты пересекаются с другим периодом. Измените начало или конец.');
    next.id = id ?? Math.max(0,...phases.map(p => p.id))+1;
    return [...result,next].sort((a,b) => b.startedAt.localeCompare(a.startedAt));
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
  function backup(state) {
    return { app:'Давление',version:1,exportedAt:new Date().toISOString(),
      sessions:state.sessions.map(s => ({ id:s.id,measured_at:s.measuredAt,wellbeing:s.wellbeing,tags:s.tags,note:s.note,mode:s.mode,created_at:s.createdAt || s.measuredAt })),
      readings:state.sessions.flatMap(s => s.readings.map((r,position) => ({ session_id:s.id,position,systolic:r.systolic,diastolic:r.diastolic,pulse:r.pulse,measured_at:r.measuredAt }))),
      phases:state.phases.map(p => ({ id:p.id,kind:p.kind,title:p.title,started_at:p.startedAt,ended_at:p.endedAt,note:p.note,created_at:p.createdAt || p.startedAt })) };
  }
  function restore(payload,currentPhases=[]) {
    if (!payload || payload.app !== 'Давление' || payload.version !== 1 || !Array.isArray(payload.sessions) || !Array.isArray(payload.readings) || !payload.sessions.length) throw new Error('Выберите непустую резервную копию JSON приложения «Давление».');
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
      phases = payload.phases.map(p => phaseInput({ id:p.id,kind:p.kind,title:p.title,note:p.note,startedAt:p.started_at,endedAt:p.ended_at == null ? null : p.ended_at }));
      if (phases.some((p,i) => phases.slice(i+1).some(q => overlaps(p,q)))) throw new Error('Периоды в копии пересекаются.');
    }
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
  return { DAY,MAX_SERIES_READINGS,TAGS,KINDS,SORTS,clone,iso,validReading,validateSession,canSaveEntry,entryReadingError,summary,stats,inside,phaseFor,filter,ranges,savePhase,baseline,chartPoints,backup,restore,seed,withAutoBackup,newReading,newDraft,readingTimeSource,readingWithInput,entryDrafts,resumeDraft,draftChanged,resumableDraft,storeDraft,switchDraft,clearDraft };
});
