(() => {
  'use strict';
  const M=window.DiaryModel;
  const theme=document.body.dataset.theme;
  const key='pressure-design-lab-v1-'+theme;
  const languageKey=key+'-language';
  const systemLocale=()=>navigator.languages?.[0]||navigator.language;
  const i18n=DiaryI18n.create(DiaryI18n.loadLanguage(localStorage,languageKey,systemLocale()));
  const tr=i18n.text,html=i18n.html;
  const diskBackups=DiaryFiles.localBackups(document.body.dataset.backupDiary||theme);
  let backupBusy=false;
  const statisticsKey=key+'-statistics';
  const concepts={
    calm:{name:'Тихий ритм',number:'01',description:'Сдержанный зелёный, ясная иерархия и воздух между блоками. Последний замер — главный. Остальные показатели поддерживают его.',tags:['Спокойная палитра','Ясная иерархия','Модульные карточки'],home:'Давление'},
    coral:{name:'Коралл',number:'02',description:'Знакомый коралловый характер, переосмысленный в тёплых оттенках. Выразительные цифры, мягкие карточки и компактная навигация.',tags:['Тёплые оттенки','Мягкие формы','Карточки показателей'],home:'Мой дневник'},
    night:{name:'Ночной пульс',number:'03',description:'Тёмная приборная эстетика. Чёткие цифры, графитовые поверхности и световые акценты. Данные остаются в центре внимания.',tags:['Тёмный интерфейс','Приборные цифры','Высокий контраст'],home:'Пульс дня'},
    clarity:{name:'Ясно',number:'04',description:'Дневник с характером печатной страницы. Крупный текст, простые формы и минимум украшений. Легче читать и проще нажимать.',tags:['Крупный текст','Простые формы','Бумажная эстетика'],home:'Давление'},
  };
  const concept=concepts[theme];
  const iconPaths={
    home:'M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9',plus:'M12 5v14M5 12h14',heart:'M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8',pulse:'M2 12h5l3-8 4 16 3-8h5',history:'M3 12a9 9 0 1 0 2.6-6.4M3 3v6h6M12 7v5l3 2',chart:'M4 3v17h17M7 15l4-5 4 3 5-7',layers:'M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4',settings:'M9 4h6l1 3 3 1 2 5-2 3-3 1-1 3H9l-1-3-3-1-2-5 2-3 3-1 1-3zM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',chevron:'M9 5l7 7-7 7',back:'M15 5l-7 7 7 7',close:'M6 6l12 12M18 6 6 18',filter:'M4 6h16M7 12h10M10 18h4',calendar:'M5 5h14v16H5zM8 2v6M16 2v6M5 10h14',up:'M12 19V5M6 11l6-6 6 6',down:'M12 5v14M6 13l6 6 6-6',smile:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M8 9h.01M16 9h.01M8 14q4 5 8 0',leaf:'M5 19C-1 10 10 3 21 3c0 11-7 18-16 16zM5 19 15 9',coffee:'M4 4h12v10a5 5 0 0 1-10 0V4M16 5h2a3 3 0 0 1 0 6h-2M3 21h16',bolt:'M13 2 4 14h7l-1 8 10-12h-7l1-8z',wine:'M6 3h12v4a6 6 0 0 1-12 0V3M12 13v8M7 21h10',shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3zM8 12l3 3 5-6',download:'M12 3v12M7 10l5 5 5-5M4 15v6h16v-6',upload:'M12 17V5M7 10l5-5 5 5M4 15v6h16v-6',file:'M6 3h8l4 4v14H6V3zM14 3v5h4M9 12h6M9 16h6',edit:'m4 16 12-12 4 4L8 20H4v-4zM14 6l4 4',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',check:'M4 12l5 5L20 6',keyboard:'M3 6h18v12H3zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8',erase:'M9 5h12v14H9l-7-7 7-7zM12 9l6 6M18 9l-6 6',signal:'M4 19v-3M8 19v-6M12 19v-9M16 19V7',wifi:'M3 8q9-7 18 0M6 12q6-5 12 0M9 16q3-2 6 0M12 20h.01',battery:'M2 7h17v10H2zM22 10v4M5 10h11v4H5z',clock:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M12 7v5l3 2',refresh:'M20 7a9 9 0 0 0-15-2L2 8M2 3v5h5M4 17a9 9 0 0 0 15 2l3-3M22 21v-5h-5',info:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M12 11v6M12 7h.01',arrow:'M5 12h14M13 6l6 6-6 6',table:'M3 4h18v16H3zM3 10h18M10 4v16'};
  Object.assign(iconPaths,{
    globe:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18z',
    folder:'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18',
    heartPulse:'M20 13.5 12 21l-8-7.5C-3.5 6.4 6.1-1.1 12 5.5c5.9-6.6 15.5.9 8 8M3 12h4l2-3 3 6 2-3h7',
    wellbeingGauge:'M4.2 17.2a9 9 0 1 1 15.6 0M6.5 10.5l1.2 1.2M12 5.5v1.8M17.5 10.5l-1.2 1.2M12 15l3-3M10.5 15a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M7 20h10',
    valuesList:'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    singleReading:'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 12h2l1-3 2 6 1-3h2',
    chevronDown:'M6 9l6 6 6-6',
    compare:'M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4',
    calendarClock:'M10 21H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M7 2v4M15 2v4M3 9h16M22 17a5 5 0 1 0-10 0 5 5 0 0 0 10 0M17 14v3l2 1',
    calendarRange:'M8 2.5v4M16 2.5v4M6 4.5h12a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3zM3 10h18M7.5 14h9M7.5 17.5h5',
    compareBars:'M5 20V10h5v10M14 20V4h5v16M3 20h18',
    pill:'M9 3a5 5 0 0 1 7 7l-6 6a5 5 0 0 1-7-7l6-6zM6 6l7 7',
    moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z',
    sun:'M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
    walk:'M14 5a2 2 0 1 0-4 0 2 2 0 0 0 4 0M7 12l3-4 4 2 3 3h3M12 10l-2 6-4 5M10 16l5 1 2 4',
    dumbbell:'M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12',
    apple:'M12 7c-3-4-8-2-8 3 0 4 3 10 6 10l2-1 2 1c3 0 6-6 6-10 0-5-5-7-8-3zM12 7V4M12 4c1-3 4-3 5-3-1 3-3 4-5 3',
    drop:'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12z',
    cup:'M5 8h11v7a5 5 0 0 1-10 0V8M16 9h2a3 3 0 0 1 0 6h-2M8 2v3M12 2v3M3 22h16',
    flower:'M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0M12 8c-6-6-9 2-5 4-4 4 2 10 5 4 3 6 9 0 5-4 4-2 1-10-5-4zM12 16v6',
    mountain:'M2 20 9 5l5 9 3-5 5 11H2zM6 11l3 2 3-2',
    book:'M12 5C9 3 5 3 3 4v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1zM12 5v16',
    briefcase:'M3 7h18v13H3V7zM8 7V3h8v4M3 12l9 3 9-3M10 12h4v4h-4z',
    plane:'M22 2 9 8l-6-1-1 2 6 4 4 6 2-1-1-6 9-10zM2 22l4-4',
    star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z',
    backArrow:'M19 12H5M11 6l-6 6 6 6',
  });
  const I=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.info}"/></svg>`;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const date=(value,opts={day:'numeric',month:'short'})=>i18n.date(value,opts);
  const time=value=>date(value,{hour:'2-digit',minute:'2-digit'});
  const full=value=>date(value,{day:'numeric',month:'long',year:'numeric'})+' · '+time(value);
  const local=value=>{const d=new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
  const kind=p=>M.phaseAppearance(p);
  const phaseStatusLabel=p=>({active:tr('Идёт сейчас'),scheduled:tr('Запланирован'),finished:tr('Завершён')})[M.phaseStatus(p)];
  const range=p=>M.phaseStatus(p)==='scheduled'&&!p.endedAt?tr('с ')+date(p.startedAt,{day:'numeric',month:'short',year:'numeric'}):date(p.startedAt)+' — '+(p.endedAt?date(p.endedAt):tr('сейчас'));
  const recs=n=>i18n.count(n,'records');
  const phaseCount=n=>i18n.count(n,'periods');
  const readingCount=n=>i18n.count(n,'readings');
  const num=(n,decimals=0)=>i18n.number(n,decimals);
  const bp=s=>`${s.systolic}<span class="slash">/</span>${s.diastolic}`;
  const entryMetrics=[['systolic','Верхнее'],['diastolic','Нижнее'],['pulse','Пульс']];
  let storageError='';
  let unreadableDiary=false;
  let state;
  try{const saved=localStorage.getItem(key);state=saved?JSON.parse(saved):M.seed();if(state.schema!==1)throw Error(tr('Версия данных не поддерживается.'));M.restore(M.backup(state),[],{enforcePhaseLimit:false});}
  catch(error){
    if(error.message.includes('непустую')&&state&&Array.isArray(state.sessions)&&state.sessions.length===0&&Array.isArray(state.phases)){}
    else {state=M.seed();unreadableDiary=true;storageError=tr('Не удалось прочитать сохранённый дневник. Используются тестовые данные; исходное хранилище не перезаписывается.');}
  }
  const defaultHistoryFilters=()=>({sort:'newest',from:'',to:'',interval:'all',mode:'all',phaseId:'all',wellbeingMin:'',wellbeingMax:'',tags:[],withNote:false});
  function loadStatisticsPreferences(){
    try{const saved=JSON.parse(localStorage.getItem(statisticsKey));return M.statisticsPreferences(saved?.version===1?saved:null,state.phases);}
    catch{return M.statisticsPreferences(null,state.phases);}
  }
  const ui={view:'home',id:null,detailReturn:'history',period:'7',scope:'time',metric:'pressure',filters:defaultHistoryFilters(),phaseHistory:false,statisticsHistory:false,statistics:{tab:'overview',...loadStatisticsPreferences(),detailScroll:0,restoreScroll:false},limit:30,entry:null,error:'',readingValidation:false,chartSelection:{},phaseGroups:{},phaseGroupMode:null};
  let modal=null,saveAnimationTimer,focusBeforeModal;
  document.body.classList.add('theme-'+theme);
  const params=new URLSearchParams(location.search);
  if(params.get('embed')==='1')document.body.classList.add('embedded');
  document.getElementById('studio').innerHTML=html`<div class="studio"><aside class="studio-aside">${presentationAside()}</aside><div><div class="device-stage"><div class="phone" data-theme="${theme}"><div class="status-bar"><span id="status-time">${time(Date.now())}</span><div class="island"></div><div class="status-icons">${I('signal')}${I('wifi')}${I('battery')}</div></div><div id="storage-warning" class="storage-warning" hidden></div><header id="app-header" class="app-header"></header><main id="app-content" class="app-content" tabindex="-1"></main><nav id="bottom-nav" class="bottom-nav" aria-label="Разделы приложения"></nav><div id="entry-footer" class="entry-footer" hidden></div><div class="home-indicator"></div><div id="modal" class="modal-layer" hidden></div><input id="import-file" type="file" accept=".json,application/json" hidden></div></div><div class="presentation-note">Нажимайте на экран. Все данные здесь — тестовые.</div></div></div>`;
  const $=id=>document.getElementById(id);
  const phone=document.querySelector('.phone');
  phone.insertAdjacentHTML('beforeend',`<div id="save-success" class="save-success" role="status" aria-live="polite" tabindex="-1" hidden><div class="save-success-content"><span class="save-success-symbol">${I('check')}</span><strong id="save-success-title"></strong></div></div>`);
  function showSaveSuccess(mode){
    clearTimeout(saveAnimationTimer);
    const overlay=$('save-success');
    $('save-success-title').textContent=mode==='phase-finished'?tr('Период завершён'):mode==='phase'?tr('Период создан'):mode==='series'?tr('Серия сохранена'):tr('Измерение сохранено');
    overlay.hidden=false;
    ['app-content','app-header','bottom-nav','entry-footer'].forEach(id=>$(id).inert=true);
    overlay.focus({preventScroll:true});
    try{navigator.vibrate?.(20);}catch{/* Visual confirmation remains available without a vibration API. */}
    saveAnimationTimer=setTimeout(()=>{
      overlay.hidden=true;
      ['app-content','app-header','bottom-nav','entry-footer'].forEach(id=>$(id).inert=false);
      $('app-content').focus({preventScroll:true});
    },1100);
  }
  const fontOptions=['current','inter','manrope','golostext','nunitosans'];
  function setFont(value){
    if(theme!=='clarity'||!fontOptions.includes(value))return;
    if(value==='current')delete phone.dataset.font;else phone.dataset.font=value;
    const url=new URL(location.href);if(value==='manrope')url.searchParams.delete('font');else url.searchParams.set('font',value);
    history.replaceState(null,'',url);
  }
  setFont(params.get('font')||'manrope');
  // Logical screen dimensions; the decorative frame sits outside the screen.
  const screens={320:693,360:780,390:844,402:874,430:932};
  let previewWidth=402;
  const fitPreview=()=>{if(document.body.classList.contains('embedded'))phone.style.setProperty('--preview-scale',Math.min(1,(document.documentElement.clientWidth-24)/(previewWidth+14)));};
  const setWidth=width=>{if(screens[width]){previewWidth=width;phone.style.setProperty('--phone-width',width+'px');phone.style.setProperty('--phone-height',screens[width]+'px');fitPreview();}};
  setWidth(Number(params.get('width'))||402);
  window.addEventListener('resize',fitPreview);
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||(event.origin!==location.origin&&location.protocol!=='file:'))return;
    if(event.data?.type==='diary-width')setWidth(event.data.width);
    if(event.data?.type==='diary-font')setFont(event.data.font);
  });
  function warn(){ $('storage-warning').hidden=!storageError;$('storage-warning').textContent=storageError; }
  function persist(next){
    try{
      if(unreadableDiary)throw Error(tr('Сначала скачайте копию исходного хранилища или используйте другой вариант.'));
      const value=M.normalizeBackupState(next);
      localStorage.setItem(key,JSON.stringify(value));state=value;storageError='';warn();return true;
    }catch(error){storageError=tr('Не удалось сохранить: ')+tr(error.message);warn();return false;}
  }
  function persistStatisticsPreferences(){
    try{localStorage.setItem(statisticsKey,JSON.stringify({version:1,...M.statisticsPreferences(ui.statistics,state.phases)}));}
    catch{storageError=tr('Не удалось сохранить настройки статистики.');warn();}
  }
  function clearPhaseHistory(){
    if(!ui.phaseHistory&&!ui.statisticsHistory)return;
    if(ui.statisticsHistory)ui.filters=defaultHistoryFilters();else ui.filters.phaseId='all';
    ui.phaseHistory=false;ui.statisticsHistory=false;ui.limit=30;
  }
  function navigate(view,id=null){
    if(ui.view==='entry'&&view!=='entry')saveDraft();
    if(view==='detail'){
      ui.detailReturn=theme==='clarity'&&['home','statistics'].includes(ui.view)?ui.view:'history';
      ui.statistics.restoreScroll=ui.detailReturn==='statistics';
      if(ui.statistics.restoreScroll)ui.statistics.detailScroll=$('app-content').scrollTop;
    }else if(!(view==='statistics'&&ui.view==='detail'&&ui.detailReturn==='statistics'))ui.statistics.restoreScroll=false;
    ui.error='';location.hash=view+(id!==null?'/'+id:'');
    readRoute();
  }
  function readRoute(){
    const [view,id]=location.hash.slice(1).split('/');
    if(!['statistics','detail'].includes(view)||(view==='statistics'&&!['statistics','detail'].includes(ui.view)))ui.statistics.restoreScroll=false;
    if(!['history','detail'].includes(view))clearPhaseHistory();
    ui.view=['home','history','statistics','phases','settings','detail','phase','entry'].includes(view)?view:'home';ui.id=id?Number(id):null;
    if(ui.view==='entry'&&!ui.entry)ui.entry=M.resumeDraft(state);
    render();$('app-content').scrollTop=ui.view==='statistics'&&ui.statistics.restoreScroll?ui.statistics.detailScroll:0;
  }
  window.addEventListener('hashchange',readRoute);
  const newReading=()=>M.newReading();
  function newDraft(){return M.newDraft();}
  function saveDraft(){if(!ui.entry)return false;return persist(M.storeDraft(state,ui.entry),false);}
  function recordCard(s){
    const v=M.summary(s),matched=M.phasesFor(s,state.phases),p=matched[0];
    if(theme==='clarity'&&(ui.view==='history'||modal?.type==='statistics-records'))return html`<button class="card record-card clarity-history-record ${s.mode==='series'?'history-series':'history-single'}" data-action="detail" data-id="${s.id}" aria-label="Измерение ${esc(full(s.measuredAt))}, ${v.systolic} на ${v.diastolic}, пульс ${v.pulse}, самочувствие ${s.wellbeing} из 10">
      <span class="history-record-header"><span class="history-date-block"><time class="history-date" datetime="${esc(s.measuredAt)}">${date(s.measuredAt,{day:'numeric',month:'long'})} <span class="history-date-year">${date(s.measuredAt,{year:'numeric'})}</span></time><span class="history-record-mode">${s.mode==='series'?I('layers')+tr('Серия · ')+readingCount(s.readings.length):I('singleReading')+tr('Одиночный замер')}</span></span><span class="history-time-block"><time class="history-time" datetime="${esc(s.measuredAt)}">${time(s.measuredAt)}</time>${I('chevron','record-chevron')}</span></span>
      <span class="history-metrics"><span class="history-pressure"><span class="history-metric-label">${s.mode==='series'?tr('Среднее давление'):tr('Давление')}</span><span class="history-bp"><span class="bp-upper">${v.systolic}</span><span class="slash">/</span><span class="bp-lower">${v.diastolic}</span></span></span><span class="history-pulse" data-metric="pulse"><span class="history-metric-label">Пульс</span><span class="history-pulse-value">${I('heartPulse')}<strong>${v.pulse}</strong></span></span></span>
      <span class="history-context">${matched.length?`<span class="history-periods">${matched.map(p=>`<span class="history-period" style="--phase-color:${kind(p).color}" title="${esc(p.title)} · ${esc(range(p))}">${I(kind(p).icon)}<span class="history-period-text"><strong>${esc(p.title)}</strong><small>${range(p)}</small></span></span>`).join('')}</span>`:''}<span class="history-wellbeing" data-metric="wellbeing">${I('wellbeingGauge')}<span>Самочувствие <strong>${s.wellbeing}<small>/10</small></strong></span></span></span>
      ${s.note?`<span class="record-note">${esc(s.note)}</span>`:''}
    </button>`;
    return html`<button class="card record-card" data-action="detail" data-id="${s.id}" aria-label="Измерение ${esc(full(s.measuredAt))}, ${v.systolic} на ${v.diastolic}"><div class="record-top"><span>${date(s.measuredAt)} · ${time(s.measuredAt)}</span><span>${s.mode==='series'?tr('Серия · ')+readingCount(s.readings.length):tr('Один замер')}</span></div><div class="record-values"><span class="record-bp">${v.systolic}<span class="muted"> / </span>${v.diastolic}</span><span class="record-pulse" data-metric="pulse">${I('pulse')}${v.pulse}</span>${I('chevron','record-chevron')}</div><div class="record-foot">${matched.map(p=>`<span class="pill">${esc(p.title)}</span>`).join('')}<span class="pill" data-metric="wellbeing">Самочувствие ${s.wellbeing}/10</span></div>${s.note?`<p class="record-note">${esc(s.note.length>80?s.note.slice(0,80)+'…':s.note)}</p>`:''}</button>`;
  }
  const empty=(title,desc,action='')=>`<div class="empty">${I('chart')}<strong>${title}</strong>${desc}${action}</div>`;
  function statGrid(s){return `<div class="stats-grid">${[['systolic',tr('Верхнее давление'),tr('мм рт. ст.'),'up'],['diastolic',tr('Нижнее давление'),tr('мм рт. ст.'),'down'],['pulse',tr('Пульс'),tr('уд/мин'),'pulse'],['wellbeing',tr('Самочувствие'),tr('из 10'),'smile']].map(([key,label,unit,icon])=>`<div class="stat-tile" data-metric="${key}"><span class="metric-icon">${I(icon)}</span><strong>${s.count?num(s[key],key==='wellbeing'?1:0):'—'}</strong><small>${tr(label)}<br>${tr(unit)}</small></div>`).join('')}</div>`;}
  function compactStats(s){return html`<div class="compact-stats"><div><strong>${s.count?s.systolic+'/'+s.diastolic:'—'}</strong><small>мм рт. ст.</small></div><div data-metric="pulse"><strong>${s.count?s.pulse:'—'}</strong><small>пульс</small></div><div data-metric="wellbeing"><strong>${s.count?num(s.wellbeing,1):'—'}</strong><small>самочувствие</small></div></div>`;}
  function chartMarkup(id,title,items,metric='pressure',phases=[],window=null){
    const points=M.chartPoints(items,24); chartData[id]={id,title,items,metric,phases,window,points};
    if(theme==='clarity'&&id==='home')return html`<div class="card chart-card home-chart"><div class="chart-legend"><span><i class="line-key"></i>Верхнее</span><span><i class="line-key second"></i>Нижнее</span></div><div class="chart-mount" data-chart="${id}"></div></div>`;
    return html`<div class="card chart-card" data-metric="${metric}"><div class="chart-heading row between"><strong>${title}</strong><button class="text-button" data-action="chart-table" data-chart="${id}" aria-label="Все значения графика ${title}">${I('table')}</button></div><div class="chart-legend">${metric==='pressure'?html('<span><i class="line-key"></i>Верхнее</span><span><i class="line-key second"></i>Нижнее · пунктир</span>'):`<span><i class="line-key"></i>${metric==='pulse'?tr('Пульс · уд/мин'):tr('Самочувствие · 1–10')}</span>`}</div>${items.length?html`<div class="chart-mount" data-chart="${id}"></div><div id="readout-${id}" class="point-readout">Нажмите на точку, чтобы увидеть значения.</div><div class="chart-caption">${points.length<items.length?tr('Средние по ')+points.length+tr(' временным интервалам. Исходные записи — в таблице.'):tr('Каждая точка — запись; для серии показано среднее.')}</div>`:empty(tr('Нет записей в этом интервале'),tr('Выберите другой интервал или добавьте измерение.'))}</div>`;
  }
  let chartData={};
  function claritySummaryMetrics(s){
    return html`<div class="statistics-average-pressure"><span class="bp-upper">${s.count?s.systolic:'—'}</span><span class="slash">/</span><span class="bp-lower">${s.count?s.diastolic:'—'}</span></div><span class="statistics-eyebrow">Давление</span><div class="statistics-average-secondary"><div data-metric="pulse">${I('heartPulse')}<span><strong>${s.count?s.pulse:'—'}</strong><span>Пульс</span></span></div><div data-metric="wellbeing">${I('wellbeingGauge')}<span><strong>${s.count?num(s.wellbeing,1):'—'}</strong><span>Самочувствие</span></span></div></div>`;
  }
  function clarityMeasurementCard(item,open=false){
    const s=M.summary(item),tag=open?'button':'div';
    const attributes=open?`data-action="detail" data-id="${item.id}"`:'role="group"';
    const dateTime=open?`<span class="history-record-header latest-date-time"><span class="history-date-block"><time class="history-date" datetime="${esc(item.measuredAt)}">${date(item.measuredAt,{day:'numeric',month:'long'})} <span class="history-date-year">${date(item.measuredAt,{year:'numeric'})}</span></time></span><span class="history-time-block"><time class="history-time" datetime="${esc(item.measuredAt)}">${time(item.measuredAt)}</time></span></span>`:html`<span class="topline"><span class="pill">${date(item.measuredAt,{day:'numeric',month:'long'})} в ${time(item.measuredAt)}</span></span>`;
    const vitals=html`<span class="latest-bottom"><span class="latest-metric" data-metric="pulse"><span class="latest-metric-icon">${I('heartPulse')}</span><span><span class="latest-metric-label">Пульс</span><span class="latest-metric-value"><strong>${s.pulse}</strong><small>уд/мин</small></span></span></span><span class="latest-metric" data-metric="wellbeing"><span class="latest-metric-icon">${I('wellbeingGauge')}</span><span><span class="latest-metric-label">Самочувствие</span><span class="latest-metric-value"><strong>${item.wellbeing}</strong><small>из 10</small></span></span></span></span>`;
    const values=open?claritySummaryMetrics({...s,count:1,wellbeing:item.wellbeing}):`<span class="bp"><span class="bp-upper">${s.systolic}</span><span class="slash">/</span><span class="bp-lower">${s.diastolic}</span></span>${vitals}`;
    return html`<${tag} class="card latest clarity-latest${open?' home-summary':''}" ${attributes} aria-label="${open?tr('Последнее измерение'):tr('Измерение')}: ${s.systolic} на ${s.diastolic}, пульс ${s.pulse}, самочувствие ${item.wellbeing} из 10, ${esc(full(item.measuredAt))}">${dateTime}${values}</${tag}>`;
  }
  function clarityPeriodCard(p){
    const content=`<span class="home-period-icon">${I(p?kind(p).icon:'calendar')}</span><span class="grow"><strong>${p?esc(p.title):tr('Без периода')}</strong><span class="home-period-meta">${p?(ui.view==='home'&&M.phaseStatus(p)==='scheduled'?tr('Запланирован · '):'')+range(p):tr('Выбрать период наблюдения')}</span></span>${I('chevron','home-period-chevron')}`;
    return `<button class="card home-period" ${p?`style="--phase-color:${kind(p).color}"`:''} data-action="${p?'phase':'nav'}" ${p?`data-id="${p.id}"`:'data-view="phases"'}>${content}</button>`;
  }
  function clarityActivePeriods(){
    const active=state.phases.filter(p=>M.phaseStatus(p)!=='finished').sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
    return active.length?html`<section class="home-section" aria-labelledby="home-periods-title"><h2 id="home-periods-title" class="home-section-title">Активные периоды</h2><div class="home-periods home-periods-list">${active.map(clarityPeriodCard).join('')}</div></section>`:'';
  }
  function clarityDetail(item,matched){
    const source=html`<h2 class="form-section">Исходные замеры</h2><div class="card source-readings-card"><table class="reading-table source-readings-table" aria-label="Исходные замеры"><colgroup><col class="source-date-column"><col><col><col></colgroup><thead><tr><th scope="col">Дата и время</th><th scope="col">Верхнее</th><th scope="col">Нижнее</th><th scope="col">Пульс</th></tr></thead><tbody>${item.readings.map(r=>`<tr><td><time datetime="${esc(r.measuredAt)}">${time(r.measuredAt)}<small>${date(r.measuredAt)}</small></time></td><td data-metric="systolic"><strong>${r.systolic}</strong></td><td data-metric="diastolic"><strong>${r.diastolic}</strong></td><td data-metric="pulse"><strong>${r.pulse}</strong></td></tr>`).join('')}</tbody></table></div>`;
    return html(`<h2 class="form-section">Показания</h2>`)+clarityMeasurementCard(item)+`<h2 class="form-section">${matched.length>1?tr('Периоды'):tr('Период')}</h2>`+(matched.length?matched.map(clarityPeriodCard).join(''):clarityPeriodCard(null))+source+html`<h2 class="form-section">Самочувствие</h2><div class="card wellbeing-card" data-metric="wellbeing"><div class="row between"><span class="muted">Оценка</span><strong>${item.wellbeing} из 10</strong></div>${item.tags.length?`<div class="tag-grid" style="margin-top:15px">${item.tags.map(t=>`<span class="pill">${esc(tr(t))}</span>`).join('')}</div>`:''}</div><div class="entry-note-block"><label class="form-label" for="saved-note">Заметка</label><textarea id="saved-note" class="form-input" placeholder="Что важно помнить об этом измерении?" data-session-note="${item.id}">${esc(item.note)}</textarea></div>`;
  }
  function home(){
    const recent=M.filter(state.sessions).slice(0,12),latest=recent[0],s=latest?M.summary(latest):null,p=latest?M.phaseFor(latest,state.phases):null;
    const latestCard=latest?html`<button class="card latest" data-action="detail" data-id="${latest.id}"><div class="topline"><span class="label">Последнее измерение</span>${theme==='night'?html('<span class="night-tag"><i></i>сохранено</span>'):`<span class="pill">${date(latest.measuredAt)}</span>`}</div><div class="bp">${bp(s)}</div><div class="unit">мм рт. ст. ${theme==='clarity'?'· '+time(latest.measuredAt):''}</div><div class="latest-bottom"><span class="row" data-metric="pulse">${I('pulse')}<strong>${s.pulse}</strong><span class="small">уд/мин</span></span><span class="row" data-metric="wellbeing">${I('smile')}<strong>${latest.wellbeing}/10</strong>${I('chevron')}</span></div></button>`:empty(tr('Ваш первый замер'),tr('Добавьте измерение, чтобы начать дневник.'));
    const add=html`<button class="measure-cta" data-action="new">${I('plus')}Новое измерение</button>`;
    const resume=M.resumableDraft(state)?html`<button class="draft-resume" data-action="resume-draft">${I('edit')}<span${theme==='clarity'?'':' class="grow"'}>Продолжить запись</span>${theme==='clarity'?'':I('chevron')}</button>`:'';
    if(theme==='clarity'){
      const measurement=latest?html`<section class="home-section" aria-labelledby="home-measurement-title"><h2 id="home-measurement-title" class="home-section-title">Предыдущее измерение</h2>${clarityMeasurementCard(latest,true)}</section>`:latestCard;
      const measurements=recent.length?html`<section class="home-section home-measurements" aria-labelledby="home-measurements-title"><h2 id="home-measurements-title" class="home-section-title home-measurements-title">Последние измерения<span class="home-measurements-count" aria-label="${recs(recent.length)}">${recent.length}</span></h2>${chartMarkup('home',tr('Последние измерения'),recent)}</section>`:'';
      return measurement+(resume||add)+clarityActivePeriods()+measurements;
    }
    const a=M.stats(recent);
    const averages=html`<div class="section-title">Средние значения<span class="small muted">${recs(recent.length)}</span></div><div class="card home-averages">${compactStats(a)}</div>`;
    if(theme==='coral')return resume+latestCard+add+html`<div class="coral-bento"><div class="bento">${I('pulse')}<strong>${a.count?a.pulse:'—'}<span class="small"> уд/мин</span></strong><small>Средний пульс · ${recs(recent.length)}</small></div><div class="bento">${I('smile')}<strong>${a.count?num(a.wellbeing,1):'—'}<span class="small"> / 10</span></strong><small>Среднее самочувствие</small></div></div><div class="section-title">Динамика<button data-action="nav" data-view="statistics">Подробнее ↗</button></div>`+chartMarkup('home',tr('Последние 12 измерений'),recent)+averages;
    if(theme==='night')return resume+latestCard+html`<div class="night-metrics"><div><strong>${a.count?a.pulse:'—'} <span class="small">уд/мин</span></strong><small>Средний пульс · ${recs(recent.length)}</small></div><div><strong>${a.count?num(a.wellbeing,1):'—'}<span class="small"> / 10</span></strong><small>Среднее самочувствие</small></div></div>`+add+html(`<div class="section-title">Динамика<button data-action="nav" data-view="statistics">Подробнее ↗</button></div>`)+chartMarkup('home',tr('Последние 12 измерений'),recent)+averages;
    return (theme==='calm'?`<p class="home-greeting">${date(Date.now(),{weekday:'long',day:'numeric',month:'long'})}</p>`:'')+resume+latestCard+add+(p?html`<div class="scope-caption row" style="justify-content:center">${I(kind(p).icon)}<span>Период: ${esc(p.title)}</span></div>`:'')+html(`<div class="section-title">Динамика<button data-action="nav" data-view="statistics">Вся статистика ↗</button></div>`)+chartMarkup('home',tr('Последние 12 измерений'),recent)+averages;
  }
  function historyItems(filters){
    const phaseId=filters.phaseId||'all',phase=state.phases.find(p=>String(p.id)===phaseId);
    if(phaseId!=='all'&&phaseId!=='none'&&!phase)return [];
    return M.filter(state.sessions,{...filters,phase:phase||null,withoutPhase:phaseId==='none',phases:state.phases});
  }
  const filterSortKey=sort=>['newest','oldest'].includes(sort)?'date':sort.split('-')[0];
  const filterSortDirection=sort=>sort==='oldest'||sort.endsWith('-asc')?'asc':'desc';
  function filterSortLabel(sort){
    if(sort==='newest')return tr('Сначала новые');if(sort==='oldest')return tr('Сначала старые');
    return ({systolic:tr('Верхнее'),diastolic:tr('Нижнее'),pulse:tr('Пульс')})[filterSortKey(sort)]+(filterSortDirection(sort)==='desc'?tr(' · по убыванию'):tr(' · по возрастанию'));
  }
  function historyFilterChips(f){
    const chips=[];
    if(f.from||f.to){
      const day=value=>date(value+'T12:00',{day:'numeric',month:'short',year:'numeric'});
      const label=({today:tr('Сегодня'),'7':tr('7 дней'),'30':tr('30 дней')})[f.interval]||(f.from&&f.to?day(f.from)+(f.from===f.to?'':' — '+day(f.to)):f.from?tr('С ')+day(f.from):tr('По ')+day(f.to));
      chips.push({key:'dates',label});
    }
    if(f.mode&&f.mode!=='all')chips.push({key:'mode',label:f.mode==='series'?tr('Серии'):tr('Одиночные')});
    if(f.phaseId&&f.phaseId!=='all')chips.push({key:'phase',label:f.phaseId==='none'?tr('Без периода'):state.phases.find(p=>String(p.id)===f.phaseId)?.title||tr('Период удалён')});
    if(f.wellbeingMin!==''||f.wellbeingMax!=='')chips.push({key:'wellbeing',label:tr('Самочувствие ')+(f.wellbeingMin!==''&&f.wellbeingMin===f.wellbeingMax?f.wellbeingMin+'/10':(f.wellbeingMin||1)+'–'+(f.wellbeingMax||10))});
    if(f.tags?.length)chips.push({key:'tags',label:f.tags.length===1?tr(f.tags[0]):tr('Отметки: ')+f.tags.length});
    if(f.withNote)chips.push({key:'note',label:tr('С заметкой')});
    if(f.sort!=='newest')chips.push({key:'sort',label:filterSortLabel(f.sort)});
    return chips;
  }
  const activeHistoryFilterCount=()=>historyFilterChips(ui.filters).filter(c=>c.key!=='sort').length;
  function historyScreen(){
    const items=theme==='clarity'?historyItems(ui.filters):M.filter(state.sessions,ui.filters),chips=theme==='clarity'?historyFilterChips(ui.filters):[];
    const filtered=theme==='clarity'?activeHistoryFilterCount()>0:ui.filters.from||ui.filters.to||ui.filters.sort!=='newest';
    const summary=theme==='clarity'?`<div class="history-summary clarity-history-summary"><span>${filtered?tr('Найдено записей'):tr('Записей в дневнике')}</span><strong>${items.length}</strong></div>`:`<div class="history-summary"><strong>${items.length}</strong><span>${filtered?tr('найдено'):tr('в дневнике')}</span></div>`;
    const applied=theme==='clarity'?(chips.length?html`<div class="history-active-filters" aria-label="Выбранные фильтры">${chips.map(c=>html`<button class="history-filter-chip" data-action="remove-history-filter" data-key="${c.key}" aria-label="Убрать: ${esc(c.label)}"><span>${esc(c.label)}</span>${I('close')}</button>`).join('')}<button class="history-filter-reset" data-action="reset-filters">Сбросить все</button></div>`:''):(filtered?html`<div class="filter-chip">${esc(tr(M.SORTS.find(s=>s[0]===ui.filters.sort)?.[1]))} ${ui.filters.from?tr('· с ')+esc(ui.filters.from):''} ${ui.filters.to?tr('· по ')+esc(ui.filters.to):''}<button data-action="reset-filters">Сбросить</button></div>`:'');
    return summary+applied+items.slice(0,ui.limit).map(recordCard).join('')+(items.length>ui.limit?`<button class="secondary" style="width:100%" data-action="load-more">${theme==='clarity'?tr('Показать еще'):tr`Показать ещё · ${ui.limit} из ${items.length}`}</button>`:'')+(!items.length?empty(filtered?tr('Ничего не найдено'):tr('История пока пустая'),filtered?(theme==='clarity'?tr('Попробуйте убрать один из фильтров.'):tr('Измените даты в фильтрах.')):tr('Сохранённые измерения появятся здесь.'),filtered&&theme==='clarity'?html('<button class="secondary" data-action="reset-filters">Сбросить фильтры</button>'):''):'');
  }
  function statistics(){
    if(theme==='clarity')return clarityStatistics();
    const selectedPhase=ui.scope==='time'?null:state.phases.find(p=>String(p.id)===ui.scope);
    if(ui.scope!=='time'&&!selectedPhase)ui.scope='time';
    const items=M.filter(state.sessions,selectedPhase?{phase:selectedPhase}:{days:ui.period});
    const s=M.stats(items),r=M.ranges(items),window=selectedPhase?{from:Date.parse(selectedPhase.startedAt),until:selectedPhase.endedAt?Date.parse(selectedPhase.endedAt):Date.now()}:ui.period==='all'?null:{from:Date.now()-+ui.period*M.DAY,until:Date.now()};
    const title=selectedPhase?selectedPhase.title:ui.period==='all'?tr('Все записи'):tr('Последние ')+ui.period+tr(' дней');
    return html`<label class="sr-only" for="stats-scope">Интервал или период наблюдения</label><select class="scope-select" id="stats-scope" data-change="scope"><option value="time" ${ui.scope==='time'?'selected':''}>По времени</option>${state.phases.map(p=>`<option value="${p.id}" ${ui.scope===String(p.id)?'selected':''}>${esc(p.title)} · ${range(p)}</option>`).join('')}</select>${ui.scope==='time'?html`<div class="segmented" aria-label="Интервал статистики">${[['7',tr('7 дней')],['30',tr('30 дней')],['90',tr('90 дней')],['all',tr('Всё')]].map(([v,l])=>`<button data-action="period" data-value="${v}" class="${v===ui.period?'active':''}" aria-pressed="${v===ui.period}">${l}</button>`).join('')}</div>`:''}<div class="scope-caption">${esc(title)} · ${recs(items.length)}<br>${items.length?date(window?window.from:items.at(-1).measuredAt)+' — '+date(window?window.until:items[0].measuredAt):tr('Записей пока нет')}</div><div class="segmented" aria-label="Показатель графика">${[['pressure',tr('Давление')],['pulse',tr('Пульс')],['wellbeing',tr('Самочувствие')]].map(([v,l])=>`<button data-action="metric" data-value="${v}" class="${v===ui.metric?'active':''}" aria-pressed="${v===ui.metric}">${l}</button>`).join('')}</div>`+chartMarkup('stats',ui.metric==='pressure'?tr('Давление · мм рт. ст.'):ui.metric==='pulse'?tr('Пульс · уд/мин'):tr('Самочувствие · баллы'),items,ui.metric,selectedPhase?[selectedPhase]:state.phases,window)+html`<div class="section-title">Средние значения</div><div class="scope-caption">${esc(title)} · ${recs(items.length)}. Серия учитывается как одна запись.</div>`+statGrid(s)+html`<div class="section-title">Диапазон замеров</div><div class="scope-caption">Самые низкие и высокие значения. В серии учитывается каждый замер.</div><div class="card">${[['systolic',tr('Верхнее'),tr('мм рт. ст.')],['diastolic',tr('Нижнее'),tr('мм рт. ст.')],['pulse',tr('Пульс'),tr('уд/мин')]].map(([key,label,unit])=>`<div class="range-row" data-metric="${key}"><span>${tr(label)}<br><small class="muted">${tr(unit)}</small></span><strong>${r[key]?r[key].join(' — '):'—'}</strong></div>`).join('')}</div>`+comparisons();
  }

  const statisticsMetrics=[['systolic','Верхнее','мм рт. ст.'],['diastolic','Нижнее','мм рт. ст.'],['pulse','Пульс','уд/мин'],['wellbeing','Самочувствие','из 10']];
  const statisticsPresets=[['7','7 дней'],['30','30 дней'],['90','90 дней'],['all','Всё']];
  function statisticsWindow(selection=ui.statistics.selection){return M.statisticsWindow(state.sessions,state.phases,selection);}
  function statisticsTitle(selection){
    if(selection.scope!=='time')return state.phases.find(p=>String(p.id)===String(selection.scope))?.title||tr('Выберите период');
    return selection.preset==='all'?tr('Все записи'):selection.preset==='custom'?tr('Выбранные даты'):tr`Последние ${selection.preset} дней`;
  }
  function statisticsDates(w){
    if(w.from===null)return tr('Записей пока нет');
    const format={day:'numeric',month:'short',year:'numeric'};
    if(w.phase&&!w.phase.endedAt&&M.phaseStatus(w.phase)==='scheduled')return tr('С ')+date(w.from,format)+tr(' · запланирован');
    return date(w.from,format)+' — '+(w.phase&&!w.phase.endedAt?tr('сейчас'):date(w.until-1,format));
  }
  function statisticsRangeButton(selection,target='overview'){
    const w=statisticsWindow(selection),appearance=w.phase?kind(w.phase):null;
    return `<button class="statistics-range" data-action="statistics-range" data-target="${target}"><span class="statistics-range-icon" ${appearance?`style="color:${appearance.color}"`:''}>${I(appearance?.icon||'calendar')}</span><span class="grow"><strong>${esc(statisticsTitle(selection))}</strong><small>${esc(statisticsDates(w))}</small></span>${I('chevronDown')}</button>`;
  }
  function statisticsHeaderRange(){
    const w=statisticsWindow();
    return html`<div class="statistics-header-actions"><button class="icon-button statistics-header-action" data-action="statistics-range" data-target="overview" title="Даты и периоды" aria-label="Даты и периоды: ${esc(statisticsTitle(ui.statistics.selection))}, ${esc(statisticsDates(w))}">${I('calendarClock')}</button><button class="icon-button statistics-header-action" data-action="statistics-tab" data-value="comparison" title="Сравнить периоды и даты" aria-label="Сравнить периоды и даты">${I('compareBars')}</button></div>`;
  }
  function statisticsContextDates(w){
    if(w.from===null)return '';
    const first=new Date(w.from),last=new Date(w.until-1),fullDate={day:'numeric',month:'long',year:'numeric'};
    if(w.phase&&!w.phase.endedAt)return M.phaseStatus(w.phase)==='scheduled'?tr('С ')+date(first,fullDate):date(first,fullDate)+tr(' — сейчас');
    if(first.getFullYear()===last.getFullYear()){
      if(first.getMonth()===last.getMonth())return first.getDate()===last.getDate()?date(first,fullDate):first.getDate()+'–'+date(last,fullDate);
      return date(first,{day:'numeric',month:'long'})+' — '+date(last,fullDate);
    }
    return date(first,fullDate)+' — '+date(last,fullDate);
  }
  function statisticsContext(){
    const w=statisticsWindow(),appearance=w.phase?kind(w.phase):null,dates=statisticsContextDates(w),all=ui.statistics.selection.scope==='time'&&ui.statistics.selection.preset==='all';
    const copy=w.phase?html`<strong>Период «${esc(w.phase.title)}»</strong><small>${esc(dates)}${M.phaseStatus(w.phase)==='scheduled'?tr(' · Запланирован'):''}</small>`:all?html`<strong>Данные за всё время</strong><small>${esc(dates||tr('Измерений пока нет'))}</small>`:html`<span class="statistics-context-prefix">Данные за</span> <strong>${esc(dates)}</strong>`;
    return html`<div class="statistics-context" role="group" aria-label="Выбранный интервал статистики"><span class="statistics-context-icon" ${appearance?`style="color:${appearance.color}"`:''}>${I(appearance?.icon||'calendar')}</span><div class="statistics-context-copy">${copy}</div></div>`;
  }
  const statisticsChartModes=[['systolic','Верхнее'],['diastolic','Нижнее'],['pulse','Пульс'],['pressure','Верхнее + нижнее'],['combined','Верхнее + нижнее + пульс']];
  function statisticsAverages(s){
    return html`<div class="card statistics-summary"><div class="segmented statistics-summary-modes" aria-label="Способ расчёта">${[['mean',tr('Среднее')],['median',tr('Медиана')]].map(([value,label])=>`<button data-action="statistics-summary" data-value="${value}" class="${ui.statistics.summary===value?'active':''}" aria-pressed="${ui.statistics.summary===value}">${tr(label)}</button>`).join('')}</div>${claritySummaryMetrics(s)}</div>`;
  }
  function statisticsChart(w){
    const id='statistics',metric=ui.statistics.chartMetric,keys=metric==='pressure'?['systolic','diastolic']:metric==='combined'?['systolic','diastolic','pulse']:[metric],points=M.statisticsChartPoints(w.items,'records');
    chartData[id]={id,title:tr('Динамика'),items:w.items,metric,keys,points,window:{from:w.from,until:w.until},phases:[],unit:metric==='pulse'?tr('уд/мин'):metric==='combined'?tr('мм рт. ст. · уд/мин'):tr('мм рт. ст.')};
    const legend=keys.map(key=>`<span data-line="${key}"><i class="line-key"></i>${tr(statisticsMetrics.find(m=>m[0]===key)[1])}</span>`).join('');
    return html`<section class="statistics-section statistics-chart-section"><div class="statistics-chart-heading"><h2 class="section-title">Динамика</h2><button class="statistics-chart-options" data-action="statistics-settings" aria-label="Выбрать показатели графика">${I('filter')}Показатели${I('chevronDown')}</button></div><div class="chart-card statistics-chart" data-metric="${metric}"><div class="chart-legend">${legend}</div><div class="chart-mount" data-chart="${id}"></div></div></section>`;
  }

  function statisticsExtremeRows(items){
    const extremes=M.statisticsExtremes(items);
    return html`<div class="statistics-extremes"><div class="statistics-extreme-head"><span></span><span>Минимум</span><span>Максимум</span></div>${statisticsMetrics.map(([key,label,unit])=>`<div class="statistics-extreme-row" data-metric="${key}"><span>${tr(label)}<small>${tr(unit)}</small></span>${['min','max'].map(side=>{const p=extremes[key][side];return `<button data-action="detail" data-id="${p.id}" aria-label="${tr(label)}, ${side==='min'?tr('минимум'):tr('максимум')} ${p.value}, ${full(p.measuredAt)}"><strong>${p.value}</strong><small class="statistics-extreme-date-time"><span>${date(p.measuredAt)}</span><span>${time(p.measuredAt)}</span></small></button>`;}).join('')}</div>`).join('')}</div>`;
  }
  function ensureStatisticsComparison(){
    const s=ui.statistics,populated=state.phases.map(p=>({p,count:M.filter(state.sessions,{phase:p}).length})).sort((a,b)=>b.count-a.count);
    if(!state.phases.some(p=>String(p.id)===s.left))s.left=populated[0]?String(populated[0].p.id):null;
    if(!state.phases.some(p=>String(p.id)===s.right)&&populated.length>1)s.right=String((populated.find(p=>String(p.p.id)!==s.left)||populated[1]).p.id);
    if(!s.leftDates||!s.rightDates){
      const current=statisticsWindow({scope:'time',preset:'7'}),previous=current.previous;
      s.leftDates={scope:'time',preset:'custom',from:local(previous.from).slice(0,10),to:local(previous.until-1).slice(0,10)};
      s.rightDates={scope:'time',preset:'custom',from:local(current.from).slice(0,10),to:local(current.until-1).slice(0,10)};
    }
  }
  function statisticsComparisonDates(w){
    if(w.from===null)return html('<span class="statistics-comparison-selection-dates statistics-comparison-no-dates">Нет измерений</span>');
    const dateValue=value=>`<time datetime="${local(value).slice(0,10)}"><strong>${esc(date(value))}</strong><span>${new Date(value).getFullYear()}</span></time>`;
    const open=w.phase&&!w.phase.endedAt,scheduled=open&&M.phaseStatus(w.phase)==='scheduled';
    return html`<span class="statistics-comparison-selection-dates"><span><small>С</small>${dateValue(w.from)}</span><span><small>По</small>${open?`<strong>${scheduled?tr('Без даты'):tr('Сейчас')}</strong>`:dateValue(w.until-1)}</span>${scheduled?html('<small class="statistics-comparison-scheduled">Запланирован</small>'):''}</span>`;
  }
  function statisticsComparisonView(){
    ensureStatisticsComparison();const s=ui.statistics;
    const switcher=html`<div class="statistics-scope-tabs statistics-compare-type" aria-label="Что сравниваем">${[['dates',tr('Даты'),'calendarRange'],['phases',tr('Периоды'),'layers']].map(([value,label,icon])=>`<button data-action="statistics-compare-type" data-value="${value}" class="${s.compareType===value?'active':''}" aria-pressed="${s.compareType===value}">${I(icon)}<span class="statistics-scope-label">${tr(label)}</span></button>`).join('')}</div>`;
    if(s.compareType==='phases'&&state.phases.length<2)return switcher+html`<div class="statistics-empty">${I('layers')}<strong>Нужны два периода</strong><p>Создайте ещё один период или сравните два диапазона дат.</p><button class="secondary" data-action="statistics-compare-type" data-value="dates">Сравнить даты</button></div>`;
    const leftSelection=s.compareType==='phases'?{scope:s.left}:s.leftDates,rightSelection=s.compareType==='phases'?{scope:s.right}:s.rightDates;
    const left=statisticsWindow(leftSelection),right=statisticsWindow(rightSelection),comparison=M.statisticsComparison(left.items,right.items,s.compareSummary);
    const selection=`<div class="statistics-comparison-selectors">${[[leftSelection,left,'left',1],[rightSelection,right,'right',2]].map(([selected,w,target,number])=>{
      const appearance=w.phase?kind(w.phase):null,title=w.phase?w.phase.title:selected.preset==='custom'?tr('Свои даты'):selected.preset==='all'?tr('Всё время'):selected.preset+tr(' дней');
      return html`<button class="statistics-comparison-selection" data-action="statistics-range" data-target="${target}" aria-label="Изменить ${target==='left'?tr('первый'):tr('второй')} ${w.phase?tr('период'):tr('диапазон')}: ${esc(statisticsTitle(selected))}, ${esc(statisticsDates(w))}"><span class="statistics-comparison-number" aria-hidden="true">${number}</span><span class="statistics-comparison-selection-title"><span class="statistics-range-icon" ${appearance?`style="color:${appearance.color}"`:''}>${I(appearance?.icon||'calendarRange')}</span><strong>${esc(title)}</strong></span>${statisticsComparisonDates(w)}<span class="statistics-comparison-count">${recs(w.items.length)}</span></button>`;
    }).join('')}</div>`;
    const methodLabel=s.compareSummary==='median'?tr('Медиана'):tr('Среднее');
    const methodPicker=html`<div class="statistics-comparison-method-picker"><button class="statistics-comparison-method" data-action="statistics-comparison-method" aria-label="Способ сравнения: ${methodLabel}" aria-haspopup="listbox" aria-expanded="false" aria-controls="statistics-comparison-method-options"><span>${methodLabel}</span>${I('chevronDown')}</button><div id="statistics-comparison-method-options" class="statistics-comparison-method-options" role="listbox" aria-label="Способ расчёта сравнения" hidden>${[['mean',tr('Среднее')],['median',tr('Медиана')]].map(([value,label])=>`<button role="option" aria-selected="${s.compareSummary===value}" tabindex="-1" data-action="statistics-comparison-summary" data-value="${value}"><span>${tr(label)}</span>${I('check')}</button>`).join('')}</div></div>`;
    const values=html`<section class="statistics-section"><div class="statistics-comparison-heading"><h2 class="section-title">${s.compareSummary==='median'?tr('Медианы'):tr('Средние')} и разница</h2>${methodPicker}</div><div class="statistics-comparison"><div class="statistics-comparison-head"><span>Показатель</span><span>Первый</span><span>Второй</span></div>${statisticsMetrics.map(([key,label,unit])=>{const a=comparison.left,b=comparison.right,delta=comparison.delta?.[key];return html`<div class="statistics-comparison-row" data-metric="${key}"><span>${tr(label)}<small>${tr(unit)}</small></span><strong>${a.count?num(a.values[key],1):'—'}</strong><strong>${b.count?num(b.values[key],1):'—'}</strong><small class="statistics-comparison-delta">Разница: ${delta===undefined?'—':num(Math.abs(delta),1)+tr(' ед.')}</small></div>`;}).join('')}</div></section>`;
    const history=[[left,'left',tr('первого')],[right,'right',tr('второго')]].filter(([w])=>w.items.length).map(([,target,label])=>html`<button class="secondary" data-action="statistics-history" data-target="${target}">${I('history')}История ${tr(label)}</button>`).join('');
    return switcher+selection+values+(history?`<div class="statistics-comparison-history">${history}</div>`:'');
  }
  function clarityStatistics(){
    const s=ui.statistics;
    if(s.selection.scope!=='time'&&!state.phases.some(p=>String(p.id)===s.selection.scope))s.selection={scope:'time',preset:'7'};
    if(s.tab==='comparison')return `<div class="clarity-statistics statistics-comparison-view">${statisticsComparisonView()}</div>`;
    const w=statisticsWindow(),average=M.statisticsSummary(w.items,s.summary);
    return html`<div class="clarity-statistics statistics-overview"><section class="statistics-section"><h2 class="section-title">${s.summary==='median'?tr('Медиана'):tr('Среднее')} за период</h2>${statisticsAverages(average)}</section>${w.items.length?statisticsChart(w)+html`<section class="statistics-section"><h2 class="section-title">Минимум и максимум</h2>${statisticsExtremeRows(w.items)}</section>`:`<div class="statistics-empty">${I('chart')}<strong>${state.sessions.length?tr('Нет измерений в этом интервале'):tr('Статистика появится после измерений')}</strong><p>${state.sessions.length?tr('Выберите другие даты или период.'):tr('Добавьте первую запись в дневник.')}</p><button class="secondary" data-action="${state.sessions.length?'statistics-preset':'new'}" ${state.sessions.length?'data-value="all"':''}>${state.sessions.length?tr('Показать всё'):tr('Новое измерение')}</button></div>`}<div class="statistics-links"><button data-action="statistics-history" data-target="overview">${I('history')}<span>История измерений</span>${I('chevron')}</button></div></div>`;
  }
  function renderStatistics(){const scroll=$('app-content').scrollTop;delete ui.chartSelection.statistics;render();$('app-content').scrollTop=scroll;}
  function closeStatisticsComparisonMethod(restoreFocus=false){
    const picker=phone.querySelector('.statistics-comparison-method-picker'),options=picker?.querySelector('[role="listbox"]');
    if(!options||options.hidden)return false;
    const trigger=picker.querySelector('.statistics-comparison-method'),focused=options.contains(document.activeElement);
    options.hidden=true;trigger.setAttribute('aria-expanded','false');
    if(restoreFocus||focused)trigger.focus({preventScroll:true});
    return true;
  }
  function toggleStatisticsComparisonMethod(){
    const picker=phone.querySelector('.statistics-comparison-method-picker'),options=picker?.querySelector('[role="listbox"]');
    if(!options)return;
    if(!options.hidden){closeStatisticsComparisonMethod(true);return;}
    options.hidden=false;picker.querySelector('.statistics-comparison-method').setAttribute('aria-expanded','true');
    options.querySelector('[aria-selected="true"]').focus({preventScroll:true});
  }
  function statisticsSettingsModal(){
    modal={type:'statistics-settings',metric:ui.statistics.chartMetric};renderStatisticsSettingsModal();
  }
  function renderStatisticsSettingsModal(){
    const sheet=$('modal').querySelector('.statistics-settings-sheet');
    if(sheet){
      sheet.classList.add('is-selecting');
      sheet.querySelectorAll('[data-action="statistics-metric"]').forEach(button=>{
        const selected=button.dataset.value===modal.metric;
        button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
      });
      return;
    }
    const body=html`<div class="statistics-chart-choices" aria-label="Показатели графика">${statisticsChartModes.map(([value,label])=>`<button data-action="statistics-metric" data-value="${value}" aria-pressed="${modal.metric===value}" class="${modal.metric===value?'active':''}"><span class="statistics-choice-lines" aria-hidden="true">${(value==='pressure'?['systolic','diastolic']:value==='combined'?['systolic','diastolic','pulse']:[value]).map(key=>`<i data-line="${key}"></i>`).join('')}</span><span>${tr(label)}</span>${I('check')}</button>`).join('')}</div>`;
    showModal(tr('Показатели графика'),body,html('<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="statistics-settings-apply">Готово</button>'));
    $('modal').querySelector('.sheet').classList.add('statistics-settings-sheet');
  }
  function statisticsRangeModal(target){
    ensureStatisticsComparison();const s=ui.statistics;
    const selection=target==='overview'?s.selection:s.compareType==='phases'?{scope:target==='left'?s.left:s.right}:target==='left'?s.leftDates:s.rightDates;
    modal={type:'statistics-range',target,selection:M.clone(selection),calendar:null,rangeAnchor:null,timeSelection:M.clone(selection.scope==='time'?selection:{scope:'time',preset:'7'}),phaseSelection:M.clone(selection.scope!=='time'?selection:{scope:String(state.phases[0]?.id)})};
    if(selection.scope==='time')setStatisticsCalendar('to');
    renderStatisticsRangeModal();
  }
  function statisticsRangeDates(){
    const f=modal.selection;
    if(f.preset==='custom')return {from:f.from,to:f.to};
    const w=statisticsWindow(f);
    return {from:w.from===null?'':local(w.from).slice(0,10),to:w.until===null?'':local(w.until-1).slice(0,10)};
  }
  function setStatisticsCalendar(field){
    const value=statisticsRangeDates()[field]||local(Date.now()).slice(0,10),d=new Date(value+'T12:00');
    modal.calendar={field,day:value,month:new Date(d.getFullYear(),d.getMonth(),1)};
  }
  function acceptStatisticsRangeDate(value){
    const anchor=modal.rangeAnchor,[from,to]=[anchor||value,value].sort();
    modal.selection={scope:'time',preset:'custom',from,to};
    modal.rangeAnchor=anchor?null:value;
    const day=new Date(value+'T12:00');
    modal.calendar={field:value===from?'from':'to',day:value,month:new Date(day.getFullYear(),day.getMonth(),1)};
    renderStatisticsRangeModal();
  }
  function switchStatisticsRangeScope(scope){
    const isTime=modal.selection.scope==='time';
    if((scope==='time')===isTime||scope!=='time'&&!state.phases.length)return;
    modal[isTime?'timeSelection':'phaseSelection']=M.clone(modal.selection);
    modal.selection=M.clone(modal[scope==='time'?'timeSelection':'phaseSelection']);modal.calendar=null;
    if(scope==='time')setStatisticsCalendar('to');
    renderStatisticsRangeModal();
  }
  function statisticsRangePeriodsMarkup(){
    const sorted=state.phases.slice().sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)||b.id-a.id);
    return [[false,tr('Активные')],[true,tr('Завершённые')]].map(([finished,label])=>{
      const phases=sorted.filter(p=>(M.phaseStatus(p)==='finished')===finished);
      return phases.length?`<section class="statistics-period-group"><h3>${tr(label)}</h3>${phases.map(p=>`<button class="statistics-range-period" data-action="statistics-range-period" data-value="${p.id}" aria-pressed="false"><span class="statistics-period-icon" style="color:${kind(p).color}">${I(kind(p).icon)}</span><span class="grow"><strong>${esc(p.title)}</strong><small>${M.phaseStatus(p)==='scheduled'?tr('Запланирован · '):''}${esc(range(p))}</small></span><span class="statistics-period-check" aria-hidden="true">${I('check')}</span></button>`).join('')}</section>`:'';
    }).join('');
  }
  function updateStatisticsCalendar(){
    const calendar=modal.calendar,f=statisticsRangeDates(),mount=$('statistics-calendar');
    const monthKey=calendar.month.getFullYear()+'-'+calendar.month.getMonth();
    if(mount.dataset.month!==monthKey){
      mount.innerHTML=calendarMarkup({...calendar,rangeFrom:f.from,rangeTo:f.to,highlightToday:false});mount.dataset.month=monthKey;
    }else mount.querySelectorAll('.calendar-day').forEach(button=>{
      const value=button.dataset.value,selected=value===calendar.day;
      button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
      button.classList.toggle('in-range',!!(f.from&&f.to&&value>=f.from&&value<=f.to));
      button.classList.toggle('range-edge',value===f.from||value===f.to);
    });
  }
  function renderStatisticsRangeModal(){
    const f=modal.selection,isOverview=modal.target==='overview',isTime=f.scope==='time';
    let error='',w=null;try{w=statisticsWindow(f);}catch(e){error=tr(e.message);}
    let sheet=$('modal').querySelector('.statistics-range-sheet');
    const mounted=!sheet;
    if(mounted){
      const mode=isOverview?html`<div class="statistics-scope-tabs" aria-label="Выбор дат или периода"><button data-action="statistics-range-scope" data-value="time">${I('calendar')}<span class="statistics-scope-label">Даты</span></button><button data-action="statistics-range-scope" data-value="phase" ${state.phases.length?'':'disabled'}>${I('layers')}<span class="statistics-scope-label">Периоды</span></button></div>`:'';
      const body=mode+html`<div class="statistics-date-panel"><div class="statistics-range-presets" aria-label="Быстрый интервал">${statisticsPresets.map(([value,label])=>`<button data-action="statistics-range-preset" data-value="${value}" aria-pressed="false">${tr(label)}</button>`).join('')}</div><div class="statistics-date-fields">${[['from',tr('Начало')],['to',tr('Завершение')]].map(([field,label])=>html`<button class="statistics-date-card" data-action="statistics-date" data-field="${field}" aria-label="${tr(label)} диапазона"><span>${tr(label)}</span><strong></strong></button>`).join('')}</div><div id="statistics-calendar" class="statistics-calendar"></div></div><div class="statistics-period-list" aria-label="Периоды наблюдения" hidden>${statisticsRangePeriodsMarkup()}</div>`;
      showModal('',body,html('<div class="statistics-range-preview" aria-live="polite"><strong></strong></div><div class="error-box" role="alert"></div><button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="statistics-range-apply">Применить</button>'));
      sheet=$('modal').querySelector('.sheet');sheet.classList.add('statistics-range-sheet');
    }else sheet.classList.add('is-selecting');
    sheet.classList.toggle('statistics-comparison-range-sheet',!isOverview);
    $('sheet-title').textContent=isOverview?tr('Даты и периоды'):tr('Выбор ')+(modal.target==='left'?tr('первого'):tr('второго'))+' '+(isTime?tr('диапазона'):tr('периода'));
    sheet.querySelectorAll('[data-action="statistics-range-scope"]').forEach(button=>{
      const selected=(button.dataset.value==='time')===isTime;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    sheet.querySelector('.statistics-date-panel').hidden=!isTime;
    sheet.querySelector('.statistics-period-list').hidden=isTime;
    sheet.querySelectorAll('[data-action="statistics-range-preset"]').forEach(button=>{
      const selected=isTime&&button.dataset.value===f.preset;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    sheet.querySelectorAll('[data-action="statistics-range-period"]').forEach(button=>{
      const selected=!isTime&&button.dataset.value===f.scope;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    if(isTime){
      const dates=statisticsRangeDates();
      sheet.querySelectorAll('[data-action="statistics-date"]').forEach(button=>{
        const field=button.dataset.field,selected=modal.calendar?.field===field;
        const value=dates[field]?date(dates[field]+'T12:00',{day:'numeric',month:'short',year:'numeric'}):tr('Нет записей');
        button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
        button.querySelector('strong').textContent=value;button.setAttribute('aria-label',(field==='from'?tr('Начало'):tr('Завершение'))+tr(' диапазона: ')+value);
      });
      if(modal.calendar)updateStatisticsCalendar();
    }
    const preview=sheet.querySelector('.statistics-range-preview');
    preview.querySelector('strong').textContent=w?recs(w.items.length):'—';
    sheet.querySelector('.error-box').textContent=error;sheet.querySelector('[data-action="statistics-range-apply"]').disabled=!!error;
  }

  function statisticsHistory(target){
    const s=ui.statistics,selection=target==='overview'?s.selection:s.compareType==='phases'?{scope:target==='left'?s.left:s.right}:target==='left'?s.leftDates:s.rightDates;
    const w=statisticsWindow(selection);
    ui.filters={...defaultHistoryFilters(),...(w.phase?{phaseId:String(w.phase.id)}:selection.preset==='all'?{}:{from:local(w.from).slice(0,10),to:local(w.until-1).slice(0,10),interval:'custom'})};
    ui.phaseHistory=false;ui.statisticsHistory=true;ui.limit=30;navigate('history');
  }
  function phaseSummary(s){
    return s.count?html`<div class="phase-card-summary"><div class="phase-card-metrics"><div class="phase-card-pressure"><span class="phase-card-metric-label">Давление</span><span class="phase-card-bp"><span class="bp-upper">${s.systolic}</span><span class="slash">/</span><span class="bp-lower">${s.diastolic}</span></span></div><div data-metric="pulse"><span class="phase-card-metric-label">Пульс</span><span class="phase-card-pulse"><strong>${s.pulse}</strong></span></div><div data-metric="wellbeing"><span class="phase-card-metric-label">Самочувствие</span><strong class="phase-card-wellbeing">${num(s.wellbeing,1)}</strong></div></div><p class="phase-card-summary-caption">Средние за период</p></div>`:html('<p class="phase-card-no-readings">Измерений в периоде пока нет</p>');
  }
  function phaseCard(p){
    const info=kind(p),s=M.stats(M.filter(state.sessions,{phase:p}));
    if(theme==='clarity')return `<button class="card phase-card clarity-phase-card" style="--phase-color:${info.color}" data-action="phase" data-id="${p.id}" data-status="${M.phaseStatus(p)}">
      <div class="phase-card-header"><span class="phase-card-logo">${I(info.icon)}</span><div class="phase-card-name"><h3>${esc(p.title)}</h3><span class="phase-card-status"><span aria-hidden="true"></span>${phaseStatusLabel(p)}</span></div>${I('chevron','phase-card-chevron')}</div>
      <div class="phase-card-dates"><span class="phase-card-date-range">${I('calendar')}<span>${range(p)}</span></span>${s.count?`<span class="phase-card-records">${I('valuesList')}${recs(s.count)}</span>`:''}</div>
      ${p.note?.trim()?`<p class="phase-card-note">${esc(p.note)}</p>`:''}
      ${phaseSummary(s)}
    </button>`;
    return `<button class="card phase-card" style="--phase-color:${info.color}" data-action="phase" data-id="${p.id}"><div class="row between"><span class="pill phase-kind">${I(info.icon)}${phaseStatusLabel(p)}</span>${I('chevron')}</div><h3>${esc(p.title)}</h3><div class="phase-meta">${range(p)}<br>${recs(s.count)}</div>${s.count?compactStats(s):html('<p class="form-hint">Измерений в периоде пока нет</p>')}</button>`;
  }
  function comparisons(){
    if(!state.phases.length)return '';
    const baseline=state.phases.find(p=>String(p.id)===ui.compareBase)||state.phases.find(p=>p.kind==='clean')||state.phases[0];
    ui.compareBase=String(baseline.id);
    const base=M.stats(M.filter(state.sessions,{phase:baseline}));
    const compared=state.phases.filter(p=>p.id!==baseline.id).map(p=>({...p,stats:M.stats(M.filter(state.sessions,{phase:p}))})).filter(p=>p.stats.count);
    return html('<div class="section-title">Сравнение периодов</div>')+html`<label class="form-label" for="compare-baseline">Сравнивать с периодом</label><select id="compare-baseline" class="scope-select" data-change="compare-baseline">${state.phases.map(p=>`<option value="${p.id}" ${p.id===baseline.id?'selected':''}>${esc(p.title)} · ${range(p)}</option>`).join('')}</select><p class="form-hint">Разница средних значений. Периоды могут пересекаться.</p>`+(base.count?`<div class="card"><div class="small muted">${esc(baseline.title)} · ${recs(base.count)}</div>${compactStats(base)}</div>`+ (compared.length?compared.map(p=>html`<div class="card"><div class="compare-head">${esc(p.title)}</div><div class="small muted">${recs(p.stats.count)} · разница с «${esc(baseline.title)}»</div>${[['systolic',tr('Верхнее'),tr('мм')],['diastolic',tr('Нижнее'),tr('мм')],['pulse',tr('Пульс'),tr('уд/мин')],['wellbeing',tr('Самочувствие'),tr('балл')]].map(([k,l,u])=>{const delta=Math.round((p.stats.averages[k]-base.averages[k])*10)/10;return `<div class="compare-row" data-metric="${k}"><span>${l}</span><span>${num(base.averages[k],1)} → ${num(p.stats.averages[k],1)}</span><strong class="delta">${delta>0?'+':''}${num(delta,1)} ${u}</strong></div>`;}).join('')}</div>`).join(''):html('<div class="settings-info">Сравнение появится, когда будут измерения в другом периоде.</div>')):empty(tr('Пока не с чем сравнить'),tr('В выбранном периоде пока нет измерений.')));
  }
  function phaseGroup(key,title,items,defaultOpen){
    const open=ui.phaseGroups[key]??defaultOpen;
    const symbol=theme==='clarity'?'<span class="phase-group-symbol" aria-hidden="true">'+I(key==='active'?'layers':'history')+'</span>':'';
    const count=theme==='clarity'&&key==='active'?'':'<span class="phase-group-count">'+items.length+'</span>';
    return '<details class="phase-group" data-phase-group="'+key+'" '+(open?'open':'')+'><summary data-action="phase-group-toggle" data-group="'+key+'">'+symbol+'<h2>'+title+'</h2>'+count+I('chevron')+'</summary><div class="phase-group-content">'+(items.length?items.map(phaseCard).join(''):'<p class="phase-group-empty">'+(key==='active'?tr('Активных периодов пока нет.'):tr('Завершённых периодов пока нет.'))+'</p>')+'</div></details>';
  }
  function phaseNewButton(){return '<button class="measure-cta phase-new-button" data-action="phase-editor">'+I('plus')+(theme==='clarity'?tr('Создать новый период'):tr('Новый период'))+'</button>';}
  function phases(){
    const ordered=state.phases.slice().sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
    const active=ordered.filter(p=>M.phaseStatus(p)!=='finished'),finished=ordered.filter(p=>M.phaseStatus(p)==='finished');
    const mode=active.length?'active':finished.length?'finished':'empty';
    if(ui.phaseGroupMode!==mode){ui.phaseGroups={};ui.phaseGroupMode=mode;}
    if(!ordered.length)return '<section class="phase-empty-state" aria-labelledby="phase-empty-title"><span class="phase-empty-logo" aria-hidden="true">'+I('layers')+html('</span><h2 id="phase-empty-title">Периодов пока нет</h2><p>Создайте период для новой привычки или изменения режима.</p><button class="measure-cta" data-action="phase-editor">')+I('plus')+html('Создать первый период</button></section>');
    return (theme==='clarity'?phaseNewButton():'')+'<div class="phase-groups">'+phaseGroup('active',tr('Активные'),active,active.length>0)+(theme==='clarity'?'':phaseNewButton())+phaseGroup('finished',tr('Завершённые'),finished,!active.length)+'</div>';
  }
  function phaseDetail(){
    const p=state.phases.find(p=>p.id===ui.id);if(!p)return empty(tr('Период не найден'),tr('Вернитесь к списку периодов.'));
    const items=M.filter(state.sessions,{phase:p}),s=M.stats(items),info=kind(p);
    if(theme==='clarity')return html`<section class="clarity-phase-detail" style="--phase-color:${info.color}" aria-labelledby="phase-detail-name">
      <article class="phase-detail-card" aria-labelledby="phase-detail-name">
        <div class="phase-detail-heading"><span class="phase-card-logo">${I(info.icon)}</span><h2 id="phase-detail-name" class="phase-detail-title">${esc(p.title)}</h2></div>
        <dl class="phase-detail-dates"><div><dt>Начало</dt><dd><time datetime="${esc(p.startedAt)}">${full(p.startedAt)}</time></dd></div><div><dt>Завершение</dt><dd>${p.endedAt?`<time datetime="${esc(p.endedAt)}">${full(p.endedAt)}</time>`:tr('Без даты завершения')}</dd></div></dl>
        ${p.note?.trim()?`<p class="phase-detail-note">${esc(p.note)}</p>`:''}
        <div class="phase-detail-summary">${phaseSummary(s)}</div>
      </article>
      <div class="phase-detail-actions" role="group" aria-label="Действия с периодом">
        <button class="secondary" data-action="phase-history" data-id="${p.id}">${I('history')}История измерений</button>
        <button class="secondary" data-action="phase-editor" data-id="${p.id}">${I('edit')}Изменить период</button>
        ${M.phaseStatus(p)==='active'?html`<button class="secondary phase-finish-button" data-action="finish-phase" data-id="${p.id}">${I('check')}Завершить период</button>`:''}
        <button class="secondary phase-delete-button" data-action="delete-phase" data-id="${p.id}">${I('trash')}Удалить период</button>
      </div>
    </section>`;
    return html`<span class="pill phase-status" style="--phase-color:${info.color}">${I(info.icon)}${phaseStatusLabel(p)}</span><h2 class="detail-heading phase-detail-title">${esc(p.title)}</h2><p class="scope-caption">${full(p.startedAt)} — ${p.endedAt?full(p.endedAt):M.phaseStatus(p)==='scheduled'?tr('без даты завершения'):tr('сейчас')}<br>${recs(items.length)}</p><div class="phase-detail-actions"><button class="secondary" data-action="phase-editor" data-id="${p.id}">${I('edit')}Изменить период</button>${M.phaseStatus(p)==='active'?html`<button class="secondary" data-action="finish-phase" data-id="${p.id}">${I('check')}Завершить период</button>`:''}</div><div class="section-title">Средние за период</div>`+statGrid(s)+chartMarkup('phase',tr('Давление за период'),items,'pressure',[p])+html`<div class="section-title">Заметка</div><div class="card phase-detail-note">${p.note?esc(p.note):html('<span class="muted">Заметка не добавлена</span>')}</div><div class="section-title">Измерения<span class="small muted">${items.length}</span></div>`+(items.length?items.map(recordCard).join(''):empty(tr('Пока нет измерений'),tr('Записи появятся здесь, если их дата попадёт в период.')));
  }

  function detail(){
    const item=state.sessions.find(s=>s.id===ui.id);if(!item)return empty(tr('Запись не найдена'),tr('Вернитесь в историю.'));const s=M.summary(item),p=M.phaseFor(item,state.phases);
    if(theme==='clarity')return clarityDetail(item,M.phasesFor(item,state.phases));
    return html`<div class="scope-caption">${full(item.measuredAt)}<br>${item.mode==='series'?tr('Среднее серии из ')+item.readings.length+tr(' замеров'):tr('Одиночное измерение')}</div><div class="card"><div class="bp">${bp(s)}</div><div class="unit">мм рт. ст.</div><div class="latest-bottom"><span class="row" data-metric="pulse">${I('pulse')}<strong>${s.pulse}</strong> <span class="small muted">уд/мин</span></span><span class="row" data-metric="wellbeing">${I('smile')}<strong>${item.wellbeing}/10</strong></span></div></div>${p?`<button class="draft-resume" data-action="phase" data-id="${p.id}">${I(kind(p).icon)}<span class="grow">${esc(p.title)}</span>${I('chevron')}</button>`:''}<div class="section-title">Исходные замеры<span class="small muted">${item.readings.length}</span></div><div class="card"><table class="reading-table"><thead><tr><th>Дата / время</th><th>Верхнее</th><th>Нижнее</th><th>Пульс</th></tr></thead><tbody>${item.readings.map(r=>`<tr><td>${time(r.measuredAt)}<small>${date(r.measuredAt)}</small></td><td>${r.systolic}</td><td>${r.diastolic}</td><td data-metric="pulse">${r.pulse}</td></tr>`).join('')}</tbody></table><div class="form-hint">Давление — мм рт. ст.; пульс — уд/мин.</div></div><div class="section-title">Самочувствие</div><div class="card wellbeing-card" data-metric="wellbeing"><div class="row between"><span class="muted">Оценка</span><strong>${item.wellbeing} из 10</strong></div>${item.tags.length?`<div class="tag-grid" style="margin-top:15px">${item.tags.map(t=>`<span class="pill">${esc(tr(t))}</span>`).join('')}</div>`:''}</div><div class="section-title">Заметка<button data-action="edit-note" data-id="${item.id}">Изменить</button></div><div class="card note-display">${item.note?esc(item.note):html('<span class="muted">Добавьте, как вы себя чувствовали или что происходило перед замером.</span>')}</div>`;
  }
  function readingDateValues(r){
    const captured=M.readingTimeSource(r)!=='pending'&&Number.isFinite(new Date(r.measuredAt).getTime());
    return `<span>${date(captured?r.measuredAt:Date.now(),{day:'numeric',month:'long',year:'numeric'})}</span>${captured?`<time class="datetime-time" datetime="${esc(r.measuredAt)}">${time(r.measuredAt)}</time>`:'<span class="datetime-time">—</span>'}${I('calendar')}`;
  }
  function updateReadingDate(index){
    const values=$('app-content').querySelector(`[data-action="entry-datetime"][data-index="${index}"] .datetime-values`);
    if(values)values.innerHTML=readingDateValues(ui.entry.readings[index]);
  }
  function updateEntryFeedback(editingInput=document.activeElement){
    const save=$('entry-footer').querySelector('[data-action="save-entry"]');
    let hasError=false;
    ui.entry.readings.forEach((r,index)=>{
      const editingField=editingInput?.matches('.metric-field input')&&Number(editingInput.dataset.index)===index?editingInput.dataset.entry:null;
      const error=M.entryReadingError(r,{partial:true,editingField});
      hasError=hasError||!!error;
      const card=$('reading-error-'+index);if(!card)return;
      card.hidden=!error;
      const message=card.querySelector('.reading-validation-message');
      if(message.textContent!==(tr(error?.message)||''))message.textContent=tr(error?.message)||'';
      entryMetrics.forEach(([field])=>{
        const input=$(field+'-'+index),invalid=!!error?.fields.includes(field);
        input.setAttribute('aria-invalid',String(invalid));
        if(invalid)input.setAttribute('aria-describedby',card.id);else input.removeAttribute('aria-describedby');
        input.closest('.metric-field').classList.toggle('invalid',invalid);
      });
    });
    if(save)save.disabled=!M.canSaveEntry(ui.entry)||hasError;
  }
  function readingBlock(r,index){
    const clarity=theme==='clarity';
    const hasDate=Number.isFinite(new Date(r.measuredAt).getTime());
    const fields=entryMetrics.map(([field,label],fieldIndex)=>{
      const last=index===ui.entry.readings.length-1&&fieldIndex===2;
      const input=html`<input id="${field}-${index}" aria-label="${tr(label)}, замер ${index+1}" type="text" inputmode="numeric" enterkeyhint="${last?'done':'next'}" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="—" value="${esc(r[field])}" data-entry="${field}" data-index="${index}">`;
      return clarity?`<label class="metric-field" data-metric="${field}" for="${field}-${index}"><span class="metric-field-label">${tr(label)}</span>${input}</label>`:html`<div class="metric-field"><label for="${field}-${index}">${tr(label)}</label>${input}<button class="keypad-trigger" data-action="keypad" data-key="${field}" data-index="${index}" aria-label="Цифровая панель: ${tr(label)}, замер ${index+1}">${I('keyboard')}</button></div>`;
    }).join('');
    return html`<div class="card reading-block ${ui.entry.mode==='series'?'series-reading':''}"><div class="reading-label"><span>${ui.entry.mode==='series'?tr('Замер ')+(index+1):tr('Показатели')}</span>${ui.entry.mode==='series'&&ui.entry.readings.length>1?html`<button data-action="remove-reading" data-index="${index}" aria-label="Удалить замер ${index+1}">${I('close')}</button>`:''}</div><div class="metrics-inputs">${fields}</div><div id="reading-error-${index}" class="reading-validation" role="alert" hidden>${I('info')}<div><strong>Некорректные показатели. Проверьте:</strong><p class="reading-validation-message"></p></div></div>${clarity?html`<button class="datetime-card" data-action="entry-datetime" data-index="${index}" aria-label="Дата и время замера ${index+1}"><span class="datetime-title">Дата и время замера</span><span class="datetime-values">${readingDateValues(r)}</span></button>`:html`<label class="datetime-field">Дата и время замера<input type="datetime-local" step="60" value="${esc(hasDate?local(r.measuredAt):'')}" aria-label="Дата и время замера ${index+1}" data-entry="measuredAt" data-index="${index}"></label>`}</div>`;
  }
  function entry(){
    const draft=ui.entry;
    const clarity=theme==='clarity';
    const addReading=draft.mode==='single'?(clarity?'':'<button class="secondary" style="width:100%" data-action="entry-mode" data-value="series">'+I('layers')+html('Добавить в серию</button>')):draft.readings.length<M.MAX_SERIES_READINGS?'<button class="secondary add-reading" style="width:100%" data-action="add-reading">'+I('plus')+html('Добавить замер</button>'):html('<p class="form-hint">В серии максимум 10 замеров.</p>');
    return html`<div class="segmented entry-mode" aria-label="Способ измерения"><button data-action="entry-mode" data-value="single" class="${draft.mode==='single'?'active':''}" aria-pressed="${draft.mode==='single'}">Один замер</button><button data-action="entry-mode" data-value="series" class="${draft.mode==='series'?'active':''}" aria-pressed="${draft.mode==='series'}">${clarity?tr('Серия'):tr('Серия · 2–10')}</button></div><div id="entry-error" class="error-box" role="alert">${esc(ui.error)}</div>${draft.readings.map(readingBlock).join('')}${addReading?`<div class="row">${addReading}</div>`:''}${clarity?'':'<div id="series-summary"></div>'}<div class="form-section">Как вы себя чувствуете?</div><div class="card wellbeing-card" data-metric="wellbeing"><div class="row between"><span id="wellbeing-label" class="muted">${wellbeingLabel(draft.wellbeing)}</span><span id="wellbeing-output" class="wellbeing-value">${draft.wellbeing}<small> / 10</small></span></div><input class="wellbeing-slider" aria-label="Самочувствие" type="range" min="1" max="10" step="1" value="${draft.wellbeing}" data-entry="wellbeing"><div class="wellbeing-endpoints"><span>Очень плохо</span><span>Отлично</span></div></div><div class="form-section">Отметки</div><div class="tag-grid">${M.TAGS.map(t=>`<button data-action="tag" data-tag="${t}" class="tag ${draft.tags.includes(t)?'active':''}" aria-pressed="${draft.tags.includes(t)}">${tr(t)}</button>`).join('')}</div><div class="entry-note-block"><label class="form-label" for="entry-note">Заметка</label><textarea id="entry-note" class="form-input" placeholder="Что важно помнить об этом измерении?" data-entry="note">${esc(draft.note)}</textarea></div><button class="${clarity?'draft-clear':'text-button danger'}" data-action="discard-draft">${clarity?I('trash'):''}Удалить черновик</button>`;
  }
  const wellbeingLabel=value=>value>=9?tr('Отлично'):value>=7?tr('Хорошо'):value>=5?tr('Средне'):value>=3?tr('Плохо'):tr('Очень плохо');
  function updateEntrySummary(){const mount=$('series-summary');if(!mount)return;const readings=ui.entry.readings.map(r=>({systolic:+r.systolic,diastolic:+r.diastolic,pulse:+r.pulse}));mount.innerHTML=readings.every(M.validReading)?html`<div class="summary-preview">${ui.entry.mode==='series'?tr('Среднее серии'):tr('Показатели')}: <strong>${Math.round(readings.reduce((s,r)=>s+r.systolic,0)/readings.length)} / ${Math.round(readings.reduce((s,r)=>s+r.diastolic,0)/readings.length)}</strong> · пульс <strong>${Math.round(readings.reduce((s,r)=>s+r.pulse,0)/readings.length)}</strong></div>`:'';}
  const backupFileName='davlenie-autobackup.json';
  const backupMoment=value=>date(value,{day:'2-digit',month:'2-digit',year:'numeric'})+tr(' в ')+time(value);
  function settings(){
    const copy=state.backupCopy;
    const status=copy?tr('Обновлено: ')+backupMoment(copy.at):state.sessions.length?tr('При следующем открытии приложения'):tr('После первого измерения и следующего открытия');
    return html`<div class="section-title">Интерфейс</div><div class="card settings-group"><button class="settings-row" data-action="language">${I('globe')}<span class="grow"><strong>Язык приложения</strong><small>${DiaryI18n.languages.find(language=>language.code===i18n.language).name}</small></span>${I('chevron','chevron')}</button></div>`
      +html('<div class="section-title">Резервная копия</div><div class="card settings-group settings-backup-group">')
      +'<button class="settings-row" role="switch" aria-checked="'+state.autoBackup+'" data-action="auto-backup">'+I('refresh')+html('<span class="grow"><strong>Автоматическая копия</strong><small>При запуске 1 раз в 24 часа</small></span><span class="switch ')+(state.autoBackup?'on':'')+'"></span></button>'
      +'<button class="settings-row" data-action="backup-location"'+(backupBusy?' disabled aria-busy="true"':'')+'>'+I('folder')+html('<span class="grow"><strong>Папка сохранения</strong><small class="backup-folder-label">В хранилище</small></span>')+I('chevron','chevron')+'</button>'
      +'<button class="settings-row" data-action="backup-info">'+I('file')+html('<span class="grow"><strong>Сохранённая копия</strong><small>')+esc(status)+'</small></span>'+I('chevron','chevron')+'</button></div>'
      +html('<div class="section-title">Экспорт и восстановление</div><div class="card settings-group">')
      +'<button class="settings-row" data-action="export-xlsx">'+I('table')+html('<span class="grow"><strong>Экспорт Excel</strong><small>Измерения, замеры и периоды · .xlsx</small></span>')+I('chevron','chevron')+'</button>'
      +'<button class="settings-row" data-action="import">'+I('upload')+html('<span class="grow"><strong>Импортировать копию</strong><small>Выбрать JSON-файл на устройстве</small></span>')+I('chevron','chevron')+'</button></div>'
      +html('<div class="section-title">Сброс</div><div class="card settings-group settings-reset-group">')
      +'<button class="settings-row" data-action="clear">'+I('trash')+html('<span class="grow"><strong class="danger">Удалить все измерения</strong><small>Периоды и резервная копия останутся.</small></span>')+I('chevron','chevron')+'</button>'
      +'<button class="settings-row" data-action="factory-reset">'+I('refresh')+html('<span class="grow"><strong class="danger">Сброс к заводским настройкам</strong><small>Удаление всей информации в приложении</small></span>')+I('chevron','chevron')+'</button></div>';
  }

  function languageMenu(){
    modal={type:'language'};
    showModal(tr('Язык приложения'),html`<div class="language-options" role="listbox" aria-label="Язык приложения">${DiaryI18n.orderedLanguages(i18n.language).map(language=>`<button class="language-option" role="option" aria-selected="${language.code===i18n.language}" data-action="set-language" data-value="${language.code}"><span class="language-code" aria-hidden="true">${language.code.toUpperCase()}</span><span lang="${language.code}">${language.name}</span>${I('check','language-check')}</button>`).join('')}</div>`);
    $('modal').querySelector('.sheet').classList.add('language-sheet');
    $('modal').querySelector('[aria-selected="true"]').focus({preventScroll:true});
  }
  function applyLanguage(language){
    try{DiaryI18n.saveLanguage(localStorage,languageKey,language);}
    catch{storageError=tr('Не удалось сохранить язык. Попробуйте ещё раз.');warn();return;}
    const scroll=$('app-content').scrollTop;
    i18n.setLanguage(language);closeModal();updateLanguageDocument();render();
    $('app-content').scrollTop=scroll;
    document.querySelector('[data-action="language"]')?.focus({preventScroll:true});
  }
  function presentationAside(){
    return html`<div class="studio-brand"><span class="brand-mark">${I('pulse')}</span>ДАВЛЕНИЕ / ДИЗАЙН</div><div class="studio-kicker">Вариант ${concept.number} из четырёх</div><h1>${tr(concept.name)}</h1><p>${tr(concept.description)}</p><div class="concept-links" aria-label="Другие варианты">${Object.entries(concepts).map(([value,c])=>`<a href="${value}.html" class="${value===theme?'active':''}" aria-label="${tr(c.name)}">${c.number}</a>`).join('')}</div><div class="studio-tags">${concept.tags.map(tag=>`<span>${tr(tag)}</span>`).join('')}</div><div class="studio-foot"><span></span>Рабочий прототип · данные сохраняются</div><a href="index.html#${theme}" class="back-studio">${I('back')} Все варианты</a>`;
  }
  function updateLanguageDocument(){
    document.documentElement.lang=i18n.language;
    document.title=tr`${tr(concept.name)} · Дневник давления`;
    document.querySelector('.studio-aside').innerHTML=presentationAside();
    document.querySelector('.presentation-note').textContent=tr('Нажимайте на экран. Все данные здесь — тестовые.');
    $('bottom-nav').setAttribute('aria-label',tr('Разделы приложения'));
    $('status-time').textContent=time(Date.now());
  }

  function render(){
    chartData={};const top=['home','history','statistics','phases','settings'].includes(ui.view);
    const showNav=top||(theme==='clarity'&&['detail','phase'].includes(ui.view));
    const navView=ui.view==='detail'?ui.detailReturn:ui.view==='phase'?'phases':ui.view;
    const titles={home:tr(concept.home),history:tr('История'),statistics:tr('Статистика'),phases:tr('Периоды'),settings:tr('Настройки'),entry:tr('Новое измерение'),detail:tr('Измерение'),phase:tr('Период')};
    if(theme==='clarity'&&ui.view==='phase'){
      const p=state.phases.find(p=>p.id===ui.id);
      if(p)titles.phase=M.phaseStatus(p)==='finished'?tr('Завершённый период'):tr('Активный период');
    }
    let actions='';
    if(ui.view==='history')actions=html`<button class="icon-button history-filter-trigger ${theme==='clarity'&&activeHistoryFilterCount()?'has-filters':''}" data-action="filters" aria-label="Фильтры истории" ${theme==='clarity'&&activeHistoryFilterCount()?'aria-describedby="history-filter-count"':''}>${I('filter')}${theme==='clarity'&&activeHistoryFilterCount()?html`<span class="history-filter-badge" aria-hidden="true">${activeHistoryFilterCount()}</span><span class="sr-only" id="history-filter-count">Выбрано фильтров: ${activeHistoryFilterCount()}</span>`:''}</button><button class="icon-button solid" data-action="new" aria-label="Добавить измерение">${I('plus')}</button>`;
    else if(theme==='clarity'&&ui.view==='statistics')actions='';
    else if(top&&ui.view!=='home'&&ui.view!=='settings'&&ui.view!=='phases')actions=html`<button class="icon-button" data-action="new" aria-label="Добавить измерение">${I('plus')}</button>`;
    else if(ui.view==='home'&&theme!=='clarity')actions=html`<button class="icon-button" data-action="nav" data-view="settings" aria-label="Настройки">${I('settings')}</button>`;
    $('app-header').dataset.view=ui.view;
    const statisticsOverview=theme==='clarity'&&ui.view==='statistics'&&ui.statistics.tab==='overview';
    $('app-header').classList.toggle('statistics-header',statisticsOverview);
    if(statisticsOverview&&ui.statistics.selection.scope!=='time'&&!state.phases.some(p=>String(p.id)===ui.statistics.selection.scope))ui.statistics.selection={scope:'time',preset:'7'};
    $('app-header').innerHTML=theme==='clarity'&&ui.view==='statistics'&&ui.statistics.tab==='comparison'?html`<div class="header-back"><button class="icon-button back-button" data-action="statistics-tab" data-value="overview" aria-label="Назад к статистике">${I('backArrow')}</button><h1>Сравнение</h1></div>`:top?`<h1>${titles[ui.view]}</h1><div class="header-actions">${actions}</div>`:html`<div class="header-back"><button class="icon-button back-button" data-action="back" aria-label="Назад">${I(theme==='clarity'?'backArrow':'back')}</button><h1>${titles[ui.view]}</h1></div>`;
    if(statisticsOverview)$('app-header').innerHTML=html('<div class="statistics-header-top"><h1>Статистика</h1>')+statisticsHeaderRange()+'</div>'+statisticsContext();
    $('app-content').dataset.view=ui.view;
    $('app-content').innerHTML=({home,history:historyScreen,statistics,phases,settings,detail,phase:phaseDetail,entry}[ui.view]||home)();
    $('bottom-nav').hidden=!showNav;$('bottom-nav').style.display=showNav?'flex':'none';
    $('bottom-nav').innerHTML=[['home','home',tr('Главная')],['history','history',tr('История')],['statistics','chart',tr('Статистика')],['phases','layers',tr('Периоды')],['settings','settings',tr('Настройки')]].map(([v,i,l])=>`<button class="nav-item ${navView===v?'active':''}" data-action="nav" data-view="${v}" ${navView===v?'aria-current="page"':''}><span class="nav-icon">${I(i)}</span>${l}</button>`).join('');
    $('entry-footer').hidden=ui.view!=='entry';
    $('entry-footer').innerHTML=ui.view==='entry'?'<button class="measure-cta" data-action="save-entry">'+I('check')+tr('Сохранить ')+(ui.entry.mode==='series'?tr('серию'):tr('измерение'))+'</button>':'';
    warn();drawCharts();if(ui.view==='entry'){updateEntrySummary();updateEntryFeedback();}
  }
  const metricInputs=()=>[...$('app-content').querySelectorAll('.metric-field input')];
  function focusMetric(index){
    const input=metricInputs()[index];if(!input)return;
    input.focus({preventScroll:true});input.select();
    // The next reading in a series can be below the visible part of the form.
    const area=$('app-content').getBoundingClientRect(),box=input.closest('.metrics-inputs').getBoundingClientRect();
    if(box.top<area.top||box.bottom>area.bottom)input.closest('.reading-block').scrollIntoView({block:'nearest'});
  }
  function advanceMetric(input){
    const fields=metricInputs(),index=fields.indexOf(input);
    if(index<0)return;
    if(index<fields.length-1){focusMetric(index+1);return;}
    input.blur();$('app-content').focus({preventScroll:true});
  }
  function drawCharts(){
    document.querySelectorAll('.chart-mount').forEach(mount=>{
      const data=chartData[mount.dataset.chart];if(!data||!data.points.length)return;
      const w=Math.max(200,Math.round(mount.clientWidth)),h=theme==='clarity'&&data.id==='home'?190:208,left=38,right=w-10,top=23,bottom=160,pts=data.points;
      const keys=data.keys||(data.metric==='pressure'?['systolic','diastolic']:[data.metric]);
      const values=pts.flatMap(p=>keys.map(k=>p[k]));
      const min=data.metric==='wellbeing'?1:Math.max(0,Math.floor((Math.min(...values)-10)/10)*10),max=data.metric==='wellbeing'?10:Math.max(min+40,Math.ceil((Math.max(...values)+10)/10)*10);
      let from=data.window?.from??Date.parse(pts[0].measuredAt),until=data.window?.until??Date.parse(pts.at(-1).measuredAt);if(data.id==='statistics')until-=1;if(until<=from){from-=M.DAY/2;until+=M.DAY/2;}
      const uniform=['home','statistics'].includes(data.id);const x=i=>left+(uniform?(pts.length===1?.5:i/(pts.length-1)):(Date.parse(pts[i].measuredAt)-from)/(until-from))*(right-left);const y=v=>bottom-(v-min)/(max-min)*(bottom-top);
      const ticks=data.metric==='wellbeing'?[1,5,10]:[min,Math.round((min+max)/2),max];
      const bands=data.phases.filter(p=>Date.parse(p.startedAt)<=until&&(p.endedAt===null||Date.parse(p.endedAt)>from));
      const hint=theme==='clarity'&&['home','statistics'].includes(data.id)?tr('Нажмите на точку, чтобы открыть измерения.'):tr('Нажмите на точку или откройте таблицу.');
      let markup=`<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(data.title)}, ${recs(data.items.length)}. ${hint}"><title>${esc(data.title)}</title>`;
      if(!uniform)bands.forEach(p=>{const start=Math.max(from,Date.parse(p.startedAt)),end=Math.min(until,p.endedAt===null?until:Date.parse(p.endedAt));const a=left+(start-from)/(until-from)*(right-left),b=left+(end-from)/(until-from)*(right-left);markup+=`<rect x="${a}" y="${top}" width="${Math.max(0,b-a)}" height="${bottom-top}" fill="${kind(p).color}" opacity=".08"/><rect x="${a}" y="${bottom+3}" width="${Math.max(1,b-a)}" height="3" fill="${kind(p).color}" opacity=".7"/>`;});
      ticks.forEach(v=>{markup+=`<path class="grid-line" d="M${left} ${y(v)}H${right}"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`;});
      keys.forEach((k,idx)=>{markup+=`<path class="plot-line ${idx?'second':''} metric-${k}" d="${pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(p[k]).toFixed(2)).join(' ')}"/>`;pts.forEach((p,i)=>{markup+=`<circle class="point-dot ${idx?'second':''} metric-${k}" cx="${x(i)}" cy="${y(p[k])}" r="${pts.length>15?2:3}"/>`;});});
      const labelCount=Math.min(4,pts.length),sameDay=data.id==='statistics'&&local(pts[0].measuredAt).slice(0,10)===local(pts.at(-1).measuredAt).slice(0,10);
      for(let n=0;n<labelCount;n++){const i=labelCount===1?0:Math.round(n*(pts.length-1)/(labelCount-1));const t=uniform?Date.parse(pts[i].measuredAt):labelCount===1?Date.parse(pts[i].measuredAt):from+n*(until-from)/(labelCount-1);let xp=uniform?x(i):left+(t-from)/(until-from)*(right-left);if(labelCount===1)xp=Math.min(right-18,Math.max(left+18,xp));markup+=`<text x="${xp}" y="186" text-anchor="${labelCount===1?'middle':n===0?'start':n===labelCount-1?'end':'middle'}">${sameDay?time(t):date(t,{day:'2-digit',month:'2-digit'})}</text>`;}
      if(theme!=='clarity'||data.id!=='home')markup+=`<text x="${left}" y="12">${data.unit||(data.metric==='pressure'?tr('мм рт. ст.'):data.metric==='pulse'?tr('уд/мин'):tr('баллы'))}</text>`;
      pts.forEach((p,i)=>{const before=i===0?left:(x(i-1)+x(i))/2,after=i===pts.length-1?right:(x(i)+x(i+1))/2;markup+=`<rect class="chart-target" x="${Math.max(left,before)}" y="${top}" width="${Math.max(data.id==='statistics'?1:8,after-before)}" height="${bottom-top}" data-action="chart-point" data-chart="${data.id}" data-point="${i}" role="button" tabindex="0" aria-label="${esc(data.id==='statistics'?full(p.measuredAt):date(p.measuredAt))}: ${keys.map(k=>num(p[k],1)).join(', ')}"/>`;});
      markup+='</svg>';
      if(bands.length)markup+=`<div class="band-legend">${bands.map(p=>`<span><i style="background:${kind(p).color}"></i>${esc(p.title)}</span>`).join('')}</div>`;
      mount.innerHTML=markup;
      if(ui.chartSelection[data.id]!==undefined)selectPoint(data.id,Math.min(ui.chartSelection[data.id],pts.length-1));
    });
  }
  function selectPoint(id,index){const d=chartData[id],p=d?.points[index],mount=$('readout-'+id);if(!p||!mount)return;ui.chartSelection[id]=index;mount.hidden=false;mount.innerHTML=`<div>${p.count>1?date(p.from)+' — '+date(p.to)+' · '+recs(p.count):full(p.measuredAt)}</div><strong>${d.metric==='pressure'?num(p.systolic,1)+' / '+num(p.diastolic,1)+(theme==='clarity'&&id==='home'?'':tr(' мм рт. ст.')):d.metric==='pulse'?num(p.pulse,1)+tr(' уд/мин'):num(p.wellbeing,1)+tr(' из 10')}</strong><div><button data-action="point-records" data-chart="${id}" data-point="${index}">${p.count>1?tr('Открыть исходные записи'):tr('Открыть измерение')} ${I('chevron')}</button></div>`;}
  let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawCharts,50);}).observe(phone);
  function showModal(title,body,actions=''){
    focusBeforeModal=document.activeElement;$('modal').hidden=false;$('modal').innerHTML=html`<section class="sheet ${modal?.type==='datetime'?'datetime-sheet':modal?.type==='phase'?'phase-editor-sheet':modal?.type==='filters'&&theme==='clarity'?'history-filters-sheet':''}" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"><div class="sheet-handle"></div><div class="sheet-header"><h2 id="sheet-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Закрыть окно">${I('close')}</button></div><div class="sheet-content">${body}</div>${actions?`<div class="sheet-actions">${actions}</div>`:''}</section>`;
    $('app-content').inert=true;$('app-header').inert=true;$('bottom-nav').inert=true;$('entry-footer').inert=true;
    $('modal').querySelector('.sheet').focus({preventScroll:true});
  }
  function closeModal(){
    if(modal?.wheelTimers)Object.values(modal.wheelTimers).forEach(clearTimeout);
    if(modal?.type==='datetime'&&modal.parent){
      const {parent,field,returnFocus}=modal;
      modal=parent;renderPhaseEditor();focusBeforeModal=returnFocus;
      $('modal').querySelector('.sheet-content').scrollTop=parent.scrollTop;
      $('modal').querySelector(`[data-action="phase-datetime"][data-field="${field}"]`)?.focus({preventScroll:true});
      return;
    }
    modal=null;$('modal').hidden=true;$('modal').innerHTML='';
    ['app-content','app-header','bottom-nav','entry-footer'].forEach(id=>$(id).inert=false);
    if(focusBeforeModal?.isConnected)focusBeforeModal.focus({preventScroll:true});
  }
  function confirm(title,body,action,label=tr('Подтвердить')){modal={type:'confirm',action};showModal(title,`<p>${body}</p>`,html`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="confirm">${tr(label)}</button>`);}
  const twoDigits=value=>String(value).padStart(2,'0');
  function calendarMarkup(calendar=modal){
    const year=calendar.month.getFullYear(),month=calendar.month.getMonth();
    const first=new Date(year,month,1),offset=(first.getDay()+6)%7;
    const totalDays=new Date(year,month+1,0).getDate();
    const cells=Math.ceil((offset+totalDays)/7)*7,today=local(Date.now()).slice(0,10);
    const monthLabel=date(first,{month:'long',year:'numeric'}).replace(/^./,letter=>letter.toUpperCase());
    return html`<div class="calendar-heading"><strong>${monthLabel}</strong><div class="row"><button class="calendar-nav" data-action="calendar-month" data-step="-1" aria-label="Предыдущий месяц">${I('back')}</button><button class="calendar-nav" data-action="calendar-month" data-step="1" aria-label="Следующий месяц">${I('chevron')}</button></div></div><div class="calendar-weekdays" aria-hidden="true">${[tr('Пн'),tr('Вт'),tr('Ср'),tr('Чт'),tr('Пт'),tr('Сб'),tr('Вс')].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-grid">${Array.from({length:cells},(_,i)=>{
      const day=new Date(year,month,i-offset+1),value=local(day).slice(0,10);
      return `<button class="calendar-day ${day.getMonth()!==month?'outside':''} ${value===calendar.day?'selected':''} ${value===today&&calendar.highlightToday!==false?'today':''} ${calendar.rangeFrom&&calendar.rangeTo&&value>=calendar.rangeFrom&&value<=calendar.rangeTo?'in-range':''} ${value===calendar.rangeFrom||value===calendar.rangeTo?'range-edge':''}" data-action="calendar-day" data-value="${value}" aria-label="${esc(date(day,{day:'numeric',month:'long',year:'numeric'}))}" aria-pressed="${value===calendar.day}" ${value===today?'aria-current="date"':''}>${day.getDate()}</button>`;
    }).join('')}</div>`;
  }
  function timeWheel(field,count,label){
    return `<div class="time-wheel-frame"><div class="time-wheel" data-wheel="${field}" role="group" aria-label="${tr(label)}" tabindex="0">${Array.from({length:count},(_,value)=>`<button class="time-wheel-value ${modal[field]===value?'selected':''}" data-action="time-value" data-field="${field}" data-value="${value}" aria-label="${twoDigits(value)} ${field==='hour'?tr('часов'):tr('минут')}" aria-pressed="${modal[field]===value}">${twoDigits(value)}</button>`).join('')}</div></div>`;
  }
  function selectTimeValue(field,value,scroll=false){
    if(modal?.type!=='datetime')return;
    modal[field]=value;
    const wheel=$('modal').querySelector(`[data-wheel="${field}"]`);
    wheel.querySelectorAll('button').forEach(button=>{
      const selected=+button.dataset.value===value;
      button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
    });
    if(scroll)wheel.scrollTop=value*40;
  }
  function entryDateTime(index){
    const reading=ui.entry.readings[index];
    const savedDate=new Date(M.readingTimeSource(reading)==='pending'?Date.now():reading.measuredAt);
    const value=Number.isFinite(savedDate.getTime())?savedDate:new Date();
    openDateTime(value,{index});
  }
  function openDateTime(value,context={},title=tr('Дата и время'),timeLabel=tr('Время замера')){
    modal={type:'datetime',...context,day:local(value).slice(0,10),month:new Date(value.getFullYear(),value.getMonth(),1),hour:value.getHours(),minute:value.getMinutes(),wheelTimers:{}};
    showModal(title,html`<div id="calendar-picker">${calendarMarkup()}</div><div class="calendar-footer"><button class="text-button" data-action="calendar-today">Сегодня</button><span class="muted">${date(value,{day:'numeric',month:'long'})}</span></div><div class="time-picker"><span class="time-picker-label">${timeLabel}</span><div class="time-wheels">${timeWheel('hour',24,tr('Часы'))}<span class="time-colon" aria-hidden="true">:</span>${timeWheel('minute',60,tr('Минуты'))}</div></div>`,html(`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="accept-datetime">Готово</button>`));
    $('modal').querySelectorAll('.time-wheel').forEach(wheel=>{
      const field=wheel.dataset.wheel;
      wheel.scrollTop=modal[field]*40;
      wheel.addEventListener('scroll',()=>{
        if(modal?.type!=='datetime')return;
        clearTimeout(modal.wheelTimers[field]);
        modal.wheelTimers[field]=setTimeout(()=>selectTimeValue(field,Math.max(0,Math.min(field==='hour'?23:59,Math.round(wheel.scrollTop/40)))),100);
      });
    });
  }
  function updateCalendar(){
    const focused=document.activeElement?.dataset;
    if(modal?.type==='filters'){
      $('filter-calendar-grid').innerHTML=calendarMarkup(modal.calendar);
      if(focused?.action==='calendar-month')$('filter-calendar-grid').querySelector(`[data-step="${focused.step}"]`)?.focus({preventScroll:true});
      return;
    }
    $('calendar-picker').innerHTML=calendarMarkup();
    $('modal').querySelector('.calendar-footer span').textContent=date(modal.day+'T12:00',{day:'numeric',month:'long'});
    if(focused?.action==='calendar-month')$('calendar-picker').querySelector(`[data-step="${focused.step}"]`)?.focus({preventScroll:true});
    else if(focused?.action==='calendar-day')$('calendar-picker').querySelector('.calendar-day.selected')?.focus({preventScroll:true});
  }
  function filtersModal(){
    if(theme==='clarity'){clarityFiltersModal();return;}
    modal={type:'filters'};showModal(tr('Фильтры истории'),html`<label class="form-label" for="filter-sort">Порядок записей</label><select id="filter-sort" class="form-input">${M.SORTS.map(([v,l])=>`<option value="${v}" ${v===ui.filters.sort?'selected':''}>${tr(l)}</option>`).join('')}</select><label class="form-label" for="filter-from">С какой даты</label><input class="form-input" id="filter-from" type="date" value="${ui.filters.from}"><label class="form-label" for="filter-to">По какую дату</label><input class="form-input" id="filter-to" type="date" value="${ui.filters.to}"><p class="form-hint">Обе даты входят в выбранный интервал.</p><div id="modal-error" class="error-box" role="alert"></div><button class="text-button" data-action="reset-filter-fields">Сбросить фильтры</button>`,html(`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="apply-filters">Применить</button>`));
  }
  function clarityFiltersModal(){
    modal={type:'filters',filters:M.clone(ui.filters),calendar:null};
    const f=modal.filters,extra=!!(f.wellbeingMin||f.wellbeingMax||f.tags.length||f.withNote);
    const option=(action,value,label,selected,icon='')=>`<button class="history-filter-option ${selected?'active':''}" data-action="${action}" data-value="${value}" aria-pressed="${selected}">${icon?I(icon):''}${tr(label)}</button>`;
    showModal(tr('Фильтры'),html`<div class="history-filter-form">
      <section class="history-filter-section"><h3>Дата измерения</h3><div class="history-date-presets" role="group" aria-label="Быстрый выбор дат">${[['all',tr('Все')],['today',tr('Сегодня')],['7',tr('7 дней')],['30',tr('30 дней')]].map(([value,label])=>option('history-filter-interval',value,label,f.interval===value)).join('')}</div><div class="history-filter-dates">${[['from',tr('С'),tr('Дата начала')],['to',tr('По'),tr('Дата окончания')]].map(([field,label,name],index)=>`${index?'<span aria-hidden="true">—</span>':''}<div class="history-date-field"><span>${tr(label)}</span><input id="filter-${field}" type="hidden" value="${esc(f[field])}"><button id="filter-${field}-trigger" class="history-date-trigger" data-action="history-filter-date" data-field="${field}" aria-label="${name}" aria-controls="filter-calendar-picker" aria-expanded="false"><span></span>${I('calendar')}</button></div>`).join('')}</div><div id="filter-calendar-picker" class="history-calendar-panel" role="group" aria-labelledby="filter-calendar-title" hidden></div><p id="filter-date-error" class="history-filter-error" role="status" hidden></p></section>
      <section class="history-filter-section"><h3>Тип записи</h3><div class="history-mode-options" role="group" aria-label="Тип записи">${[['all',tr('Все'),''],['single',tr('Одиночные'),'singleReading'],['series',tr('Серии'),'layers']].map(([value,label,icon])=>option('history-filter-mode',value,label,f.mode===value,icon)).join('')}</div></section>
      <section class="history-filter-section"><h3 id="filter-phase-label">Период наблюдения</h3>${historyFilterSelect('phase',f.phaseId)}</section>
      <details class="history-extra-filters" ${extra?'open':''}><summary>Самочувствие и отметки<span class="history-extra-count" id="filter-extra-count"></span>${I('chevron')}</summary><div class="history-extra-content"><h3>Самочувствие</h3><div class="history-wellbeing-range"><label for="filter-wellbeing-min">От<input class="form-input" id="filter-wellbeing-min" type="text" inputmode="numeric" enterkeyhint="next" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="1" aria-label="Самочувствие от" aria-describedby="filter-wellbeing-error" value="${esc(f.wellbeingMin)}"></label><span aria-hidden="true">—</span><label for="filter-wellbeing-max">До<input class="form-input" id="filter-wellbeing-max" type="text" inputmode="numeric" enterkeyhint="done" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="10" aria-label="Самочувствие до" aria-describedby="filter-wellbeing-error" value="${esc(f.wellbeingMax)}"></label><span class="history-range-unit">из 10</span></div><div id="filter-wellbeing-error" class="reading-validation history-filter-validation" role="alert" hidden>${I('info')}<div><strong>Некорректное самочувствие. Проверьте:</strong><p class="reading-validation-message"></p></div></div><h3>Отметки</h3><p class="history-filter-hint">Подойдёт любая из выбранных отметок.</p><div class="history-filter-tags tag-grid" role="group" aria-label="Отметки измерения">${M.TAGS.map(tag=>`<button class="history-filter-tag tag ${f.tags.includes(tag)?'active':''}" data-action="history-filter-tag" data-value="${esc(tag)}" aria-pressed="${f.tags.includes(tag)}">${esc(tr(tag))}</button>`).join('')}</div><label class="history-note-toggle"><span>${I('file')}Только с заметкой</span><input id="filter-with-note" class="history-note-input sr-only" type="checkbox" ${f.withNote?'checked':''}><span class="history-note-check" aria-hidden="true">${I('check')}</span></label></div></details>
      <section class="history-filter-section history-sort-section"><h3 id="filter-sort-label">Порядок записей</h3>${historyFilterSelect('sort',filterSortKey(f.sort))}<div class="history-sort-directions" role="group" aria-label="Направление сортировки">${['desc','asc'].map(value=>option('history-filter-sort-direction',value,'',filterSortDirection(f.sort)===value)).join('')}</div></section>
    </div>`,html(`<button class="secondary" data-action="reset-filter-fields">Сбросить</button><button class="measure-cta" id="filter-apply" data-action="apply-filters"></button>`));
    updateHistoryFilterPreview();
  }
  function historyFilterSelectOptions(key){
    if(key==='sort')return [['date',tr('По дате'),'calendar'],['systolic',tr('По верхнему давлению'),'up'],['diastolic',tr('По нижнему давлению'),'down'],['pulse',tr('По пульсу'),'heartPulse']].map(([value,label,icon])=>({value,label,icon}));
    return [{value:'all',label:tr('Все периоды'),icon:'layers'},{value:'none',label:tr('Без периода'),icon:'calendar'},...state.phases.slice().sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).map(p=>({value:String(p.id),label:p.title,description:range(p),icon:kind(p).icon,color:kind(p).color}))];
  }
  function historyFilterSelect(key,value){
    const options=historyFilterSelectOptions(key),selected=options.find(option=>option.value===value)||options[0];
    return `<div class="history-select"><input id="${key==='sort'?'filter-sort-key':'filter-phase'}" type="hidden" value="${esc(value)}"><button class="history-select-trigger" id="filter-${key}-trigger" data-action="history-filter-select" data-key="${key}" aria-haspopup="listbox" aria-controls="filter-${key}-options" aria-expanded="false" aria-labelledby="filter-${key}-label filter-${key}-value"><span id="filter-${key}-icon" class="history-select-icon" style="--phase-color:${selected.color||'var(--accent)'}">${I(selected.icon)}</span><span class="history-select-value" id="filter-${key}-value">${esc(selected.label)}</span>${I('chevronDown','history-select-chevron')}</button><div class="history-select-options" id="filter-${key}-options" role="listbox" aria-labelledby="filter-${key}-label" hidden>${options.map(option=>`<button class="history-select-option" style="--phase-color:${option.color||'var(--muted)'}" role="option" aria-selected="${option.value===value}" data-action="history-filter-select-option" data-key="${key}" data-value="${esc(option.value)}">${I(option.icon)}<span><strong>${esc(option.label)}</strong>${option.description?`<small>${esc(option.description)}</small>`:''}</span>${I('check','history-select-check')}</button>`).join('')}</div></div>`;
  }
  function closeHistoryFilterPopovers(restoreFocus=false){
    if(modal?.type!=='filters'||theme!=='clarity')return false;
    const trigger=$('modal').querySelector('.history-select-trigger[aria-expanded="true"],.history-date-trigger[aria-expanded="true"]');
    $('modal').querySelectorAll('.history-select-options').forEach(list=>list.hidden=true);
    $('filter-calendar-picker').hidden=true;modal.calendar=null;
    $('modal').querySelectorAll('.history-select-trigger,.history-date-trigger').forEach(button=>button.setAttribute('aria-expanded','false'));
    if(restoreFocus)trigger?.focus({preventScroll:true});
    return !!trigger;
  }
  function openHistoryFilterSelect(key){
    const trigger=$('filter-'+key+'-trigger'),wasOpen=trigger.getAttribute('aria-expanded')==='true';
    closeHistoryFilterPopovers();if(wasOpen)return;
    const list=$('filter-'+key+'-options');list.hidden=false;trigger.setAttribute('aria-expanded','true');
    list.scrollIntoView({block:'nearest'});
    list.querySelector('[aria-selected="true"]')?.focus({preventScroll:true});
  }
  function openHistoryFilterDate(field){
    const trigger=$('filter-'+field+'-trigger'),wasOpen=trigger.getAttribute('aria-expanded')==='true';
    closeHistoryFilterPopovers();if(wasOpen)return;
    const f=modal.filters,value=new Date((f[field]||f[field==='from'?'to':'from']||local(Date.now()).slice(0,10))+'T12:00');
    modal.calendar={field,day:f[field],month:new Date(value.getFullYear(),value.getMonth(),1)};
    const picker=$('filter-calendar-picker');
    picker.innerHTML=html`<div class="history-calendar-title"><strong id="filter-calendar-title">${field==='from'?tr('Дата начала'):tr('Дата окончания')}</strong><button class="calendar-nav" data-action="history-filter-calendar-close" aria-label="Закрыть календарь">${I('close')}</button></div><div id="filter-calendar-grid">${calendarMarkup(modal.calendar)}</div><div class="history-calendar-actions"><button data-action="calendar-today">Сегодня</button><button data-action="history-filter-date-clear">Сбросить дату</button></div>`;
    picker.hidden=false;trigger.setAttribute('aria-expanded','true');picker.scrollIntoView({block:'nearest'});
    picker.querySelector('.calendar-day.selected,.calendar-day.today')?.focus({preventScroll:true});
  }
  function acceptHistoryFilterDate(value){
    const field=modal.calendar.field;
    modal.filters[field]=value;$('filter-'+field).value=value;
    modal.filters.interval=modal.filters.from||modal.filters.to?'custom':'all';
    closeHistoryFilterPopovers(true);updateHistoryFilterPreview();
  }
  function readHistoryFilterFields(){
    const f=modal.filters,key=$('filter-sort-key').value,direction=filterSortDirection(f.sort);
    Object.assign(f,{from:$('filter-from').value,to:$('filter-to').value,phaseId:$('filter-phase').value,wellbeingMin:$('filter-wellbeing-min').value,wellbeingMax:$('filter-wellbeing-max').value,withNote:$('filter-with-note').checked,sort:key==='date'?(direction==='desc'?'newest':'oldest'):key+'-'+direction});
  }
  function historyFilterErrors(f){
    const dateError=f.from&&f.to&&f.from>f.to?tr('Дата начала должна быть не позже даты окончания.'):'';
    const scores=[f.wellbeingMin,f.wellbeingMax].filter(value=>value!=='').map(Number);
    const scoreError=scores.some(value=>!Number.isInteger(value)||value<1||value>10)?tr('Укажите оценку от 1 до 10.'):f.wellbeingMin!==''&&f.wellbeingMax!==''&&Number(f.wellbeingMin)>Number(f.wellbeingMax)?tr('Начальная оценка должна быть не больше конечной.'):'';
    return {dateError,scoreError};
  }
  function updateHistoryFilterPreview(){
    const f=modal.filters,{dateError,scoreError}=historyFilterErrors(f);
    $('filter-date-error').hidden=!dateError;$('filter-date-error').textContent=dateError;
    $('filter-wellbeing-error').hidden=!scoreError;$('filter-wellbeing-error').querySelector('.reading-validation-message').textContent=scoreError;
    ['filter-from-trigger','filter-to-trigger'].forEach(id=>$(id).setAttribute('aria-invalid',String(!!dateError)));
    ['filter-wellbeing-min','filter-wellbeing-max'].forEach(id=>$(id).setAttribute('aria-invalid',String(!!scoreError)));
    $('filter-apply').disabled=!!(dateError||scoreError);
    $('filter-apply').textContent=dateError?tr('Проверьте даты'):scoreError?tr('Проверьте оценку'):tr('Показать ')+recs(historyItems(f).length);
    const extra=Number(!!(f.wellbeingMin||f.wellbeingMax))+Number(!!f.tags.length)+Number(f.withNote);
    $('filter-extra-count').textContent=extra?String(extra):'';$('filter-extra-count').hidden=!extra;
    ['from','to'].forEach(field=>{const button=$('filter-'+field+'-trigger');button.querySelector('span').textContent=f[field]?date(f[field]+'T12:00',{day:'2-digit',month:'2-digit',year:'numeric'}):tr('Выбрать');button.classList.toggle('is-empty',!f[field]);});
    ['phase','sort'].forEach(key=>{const value=key==='phase'?f.phaseId:filterSortKey(f.sort),options=historyFilterSelectOptions(key),selected=options.find(option=>option.value===value)||options[0];$('filter-'+key+'-value').textContent=selected.label;$('filter-'+key+'-icon').innerHTML=I(selected.icon);$('filter-'+key+'-icon').style.setProperty('--phase-color',selected.color||'var(--accent)');$('filter-'+key+'-options').querySelectorAll('[role="option"]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.value===value)));});
    $('modal').querySelectorAll('[data-action="history-filter-interval"],[data-action="history-filter-mode"],[data-action="history-filter-tag"],[data-action="history-filter-sort-direction"]').forEach(button=>{
      const {action,value}=button.dataset,selected=action==='history-filter-interval'?f.interval===value:action==='history-filter-mode'?f.mode===value:action==='history-filter-tag'?f.tags.includes(value):filterSortDirection(f.sort)===value;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
      if(action==='history-filter-sort-direction')button.textContent=filterSortKey(f.sort)==='date'?(value==='desc'?tr('Сначала новые'):tr('Сначала старые')):(value==='desc'?tr('Сначала большие'):tr('Сначала меньшие'));
    });
  }
  function resetHistoryFilterFields(){
    closeHistoryFilterPopovers();
    modal.filters=defaultHistoryFilters();
    ['filter-from','filter-to','filter-wellbeing-min','filter-wellbeing-max'].forEach(id=>$(id).value='');
    $('filter-phase').value='all';$('filter-sort-key').value='date';$('filter-with-note').checked=false;
    updateHistoryFilterPreview();
  }

  function phaseEditor(id=null){
    const p=id===null?{kind:'custom',title:'',icon:'leaf',color:M.PHASE_COLORS[0],startedAt:new Date().toISOString(),endedAt:null,note:''}:state.phases.find(p=>p.id===id);if(!p)return;
    const appearance=kind(p);modal={type:'phase',id,phase:M.clone(p),icon:appearance.icon,color:appearance.color,endValue:local(p.endedAt||Date.now())};
    renderPhaseEditor();
  }
  function phaseDateCard(field,value,disabled=false){
    const title=field==='start'?tr('Дата и время начала'):tr('Дата и время завершения');
    return `<div class="form-label" id="phase-${field}-label">${title}</div><input id="phase-${field}" type="hidden" value="${esc(value)}"><button class="datetime-card phase-datetime-card" data-action="phase-datetime" data-field="${field}" aria-labelledby="phase-${field}-label" ${disabled?'disabled':''}><span class="datetime-values"><span>${date(value,{day:'numeric',month:'long',year:'numeric'})}</span><span class="datetime-time">${time(value)}</span>${I('calendar')}</span></button>`;
  }
  function renderPhaseEditor(){
    const {id,phase:p,icon,color,endValue}=modal;
    showModal(id===null?tr('Новый период'):tr('Изменить период'),html`
      <label class="phase-appearance-preview" id="phase-preview" for="phase-title" style="--phase-color:${color}"><span id="phase-preview-icon" aria-hidden="true">${I(icon)}</span><input id="phase-title" class="phase-title-input" aria-label="Название" maxlength="100" value="${esc(p.title)}" placeholder="Название периода" enterkeyhint="done"></label>
      <div class="form-label" id="phase-icons-label">Значок</div><div class="phase-icon-options" role="group" aria-labelledby="phase-icons-label">${M.PHASE_ICONS.map(i=>`<button class="phase-icon-option ${i.icon===icon?'active':''}" data-action="phase-icon" data-value="${i.icon}" aria-label="${tr(i.label)}" title="${tr(i.label)}" aria-pressed="${i.icon===icon}">${I(i.icon)}</button>`).join('')}</div>
      <div class="form-label" id="phase-colors-label">Цвет</div><div class="phase-color-options" role="group" aria-labelledby="phase-colors-label">${M.PHASE_COLORS.map((preset,i)=>html`<button class="phase-color-option" style="--choice-color:${preset}" data-action="phase-color" data-value="${preset}" aria-label="Цвет ${i+1}" aria-pressed="${preset===color}">${I('check')}</button>`).join('')}</div>
      ${phaseDateCard('start',local(p.startedAt))}
      ${phaseDateCard('end',endValue,p.endedAt===null)}
      <label class="form-label row phase-open-toggle"><span>Без даты завершения</span><input id="phase-open" type="checkbox" ${p.endedAt===null?'checked':''} data-change="phase-open"></label>
      <label class="form-label" for="phase-note">Заметка</label><textarea id="phase-note" class="form-input">${esc(p.note)}</textarea>
      <div class="error-box" id="modal-error" role="alert"></div>${id!==null&&theme!=='clarity'?'<button class="danger-button" data-action="delete-phase" data-id="'+id+html('">Удалить период</button>'):''}
    `,phaseFeedbackMarkup()+html('<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="save-phase">')+(id===null?tr('Создать период'):tr('Сохранить'))+'</button>');
    updatePhaseFeedback();
  }
  function phaseDateTime(field){
    if(field==='end'&&$('phase-open').checked)return;
    const parent=modal,value=new Date($('phase-'+field).value),returnFocus=focusBeforeModal;
    parent.endValue=$('phase-end').value;parent.phase=editedPhase();
    parent.scrollTop=$('modal').querySelector('.sheet-content').scrollTop;
    openDateTime(value,{parent,field,returnFocus},field==='start'?tr('Дата и время начала'):tr('Дата и время завершения'),field==='start'?tr('Время начала'):tr('Время завершения'));
  }
  function updatePhaseAppearance(){
    $('phase-preview').style.setProperty('--phase-color',modal.color);$('phase-preview-icon').innerHTML=I(modal.icon);
    $('modal').querySelectorAll('[data-action="phase-icon"]').forEach(b=>{b.classList.toggle('active',b.dataset.value===modal.icon);b.setAttribute('aria-pressed',String(b.dataset.value===modal.icon));});
    $('modal').querySelectorAll('[data-action="phase-color"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===modal.color)));
  }
  function phaseFeedbackMarkup(){return `<div class="reading-validation phase-validation" id="phase-validation" role="alert" hidden>${I('info')}<div><strong id="phase-validation-title"></strong><p class="reading-validation-message" id="phase-validation-message"></p></div></div>`;}
  function editedPhase(){
    const p=modal.phase;
    const startedAt=$('phase-start').value===local(p.startedAt)?p.startedAt:new Date($('phase-start').value).toISOString();
    const endedAt=$('phase-open').checked?null:p.endedAt&&$('phase-end').value===local(p.endedAt)?p.endedAt:new Date($('phase-end').value).toISOString();
    return {...p,title:$('phase-title').value,icon:modal.icon,color:modal.color,startedAt,endedAt,note:$('phase-note').value};
  }
  function showPhaseError(error){
    $('phase-validation').hidden=!error;
    if(error){
      $('phase-validation-title').textContent=error.code==='PHASE_LIMIT'?tr('Лимит одновременных периодов'):tr('Проверьте даты периода');
      $('phase-validation-message').textContent=error instanceof RangeError?tr('Укажите корректные дату и время.'):tr(error.message);
    }
  }
  function updatePhaseFeedback(){
    if(modal?.type!=='phase')return;
    let error=null;
    try{const p=editedPhase();M.savePhase(state.phases,{...p,title:p.title.trim()||tr('Название периода')},modal.id);}catch(e){error=e;}
    showPhaseError(error);$('modal-error').textContent='';
    $('modal').querySelector('[data-action="save-phase"]').disabled=!!error||!$('phase-title').value.trim();
  }
  function saveEditedPhase(){
    if(!$('save-success').hidden)return;
    try{
      const created=modal.id===null;
      const next=M.clone(state);next.phases=M.savePhase(state.phases,editedPhase(),modal.id);
      if(persist(next)){closeModal();render();if(created)showSaveSuccess('phase');}
    }catch(error){if(error.code==='PHASE_LIMIT'){showPhaseError(error);$('modal').querySelector('[data-action="save-phase"]').disabled=true;}else $('modal-error').textContent=error instanceof RangeError?tr('Проверьте даты периода.'):tr(error.message);}
  }

  function keypad(index,field){modal={type:'keypad',index,field,value:String(ui.entry.readings[index][field]),replace:true};const labels={systolic:tr('Верхнее давление'),diastolic:tr('Нижнее давление'),pulse:tr('Пульс')};showModal(labels[field],`<p style="text-align:center">${field==='systolic'?tr('60–260 мм рт. ст.'):field==='diastolic'?tr('35–160 мм рт. ст.'):tr('30–220 уд/мин')}</p><div id="keypad-value" class="keypad-value" data-metric="${field}" aria-live="polite">${modal.value||'—'}</div><div class="keypad-grid">${['1','2','3','4','5','6','7','8','9','clear','0','erase'].map(k=>`<button data-action="digit" data-value="${k}" ${k==='clear'?'class="small"':''} ${k==='erase'?tr('aria-label="Стереть цифру"'):''}>${k==='clear'?tr('Очистить'):k==='erase'?I('erase'):k}</button>`).join('')}</div>`,html(`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="accept-keypad">Готово</button>`));}
  function saveEntry(){
    if(!M.canSaveEntry(ui.entry)||!$('save-success').hidden)return;
    ui.readingValidation=true;updateEntryFeedback();
    const firstError=ui.entry.readings.findIndex(r=>M.entryReadingError(r));
    if(firstError!==-1){$('reading-error-'+firstError).scrollIntoView({block:'nearest'});return;}
    try{
      const draft=ui.entry;const readings=draft.readings.map(r=>({systolic:r.systolic===''?NaN:Number(r.systolic),diastolic:r.diastolic===''?NaN:Number(r.diastolic),pulse:r.pulse===''?NaN:Number(r.pulse),measuredAt:new Date(r.measuredAt).toISOString()}));
      const item=M.validateSession({id:Math.max(0,...state.sessions.map(s=>s.id))+1,mode:draft.mode,measuredAt:readings[0].measuredAt,readings,wellbeing:draft.wellbeing,tags:draft.tags,note:draft.note.trim()});
      const next=M.clearDraft(state,draft.mode);next.sessions.push(item);
      if(persist(next)){document.activeElement?.blur();ui.entry=null;ui.error='';ui.readingValidation=false;navigate('detail',item.id);showSaveSuccess(draft.mode);}
    }catch(error){ui.error=error instanceof RangeError?tr('Укажите дату и время каждого замера.'):tr(error.message);const el=$('entry-error');el.textContent=ui.error;el.scrollIntoView({block:'nearest'});}
  }
  async function exportXLSX(){
    if(!state.sessions.length){showError(tr('Нет данных для экспорта'),tr('Сначала сохраните хотя бы одно измерение.'));return;}
    try{
      if(!window.XLSX)throw Error(tr('Библиотека Excel не загрузилась.'));
      const workbook=XLSX.utils.book_new();
      const sheets=[[tr('Измерения'),[[tr('Дата и время'),tr('Верхнее, мм рт. ст.'),tr('Нижнее, мм рт. ст.'),tr('Пульс, уд/мин'),tr('Самочувствие, 1–10'),tr('Тип'),tr('Замеров'),tr('Отметки'),tr('Заметка'),tr('Периоды')],...M.filter(state.sessions).map(s=>{const v=M.summary(s);return [full(s.measuredAt),v.averages.systolic,v.averages.diastolic,v.averages.pulse,s.wellbeing,s.mode==='series'?tr('Серия'):tr('Один замер'),s.readings.length,s.tags.map(tr).join('; '),s.note,M.phasesFor(s,state.phases).map(p=>p.title).join('; ')];})]],[tr('Замеры'),[[tr('Номер записи'),tr('Замер'),tr('Дата и время'),tr('Верхнее, мм рт. ст.'),tr('Нижнее, мм рт. ст.'),tr('Пульс, уд/мин')],...M.filter(state.sessions).flatMap(s=>s.readings.map((r,i)=>[s.id,i+1,full(r.measuredAt),r.systolic,r.diastolic,r.pulse]))]],[tr('Периоды'),[[tr('Название'),tr('Значок'),tr('Цвет'),tr('Начало'),tr('Конец'),tr('Заметка'),tr('Записей'),tr('Верхнее, мм рт. ст.'),tr('Нижнее, мм рт. ст.'),tr('Пульс, уд/мин'),tr('Самочувствие')],...state.phases.map(p=>{const s=M.stats(state.sessions.filter(m=>M.inside(m,p)));return [p.title,tr(M.PHASE_ICONS.find(i=>i.icon===kind(p).icon)?.label||kind(p).icon),kind(p).color,full(p.startedAt),p.endedAt?full(p.endedAt):tr('Идёт сейчас'),p.note,s.count,s.count?s.averages.systolic:'',s.count?s.averages.diastolic:'',s.count?s.averages.pulse:'',s.count?s.averages.wellbeing:''];})]]];
      sheets.forEach(([name,rows])=>{const sheet=XLSX.utils.aoa_to_sheet(rows);sheet['!cols']=rows[0].map((_,i)=>({wch:i===0?29:20}));sheet['!autofilter']={ref:sheet['!ref']};XLSX.utils.book_append_sheet(workbook,sheet,name);});
      await DiaryFiles.saveExcel('davlenie-'+theme+'.xlsx',XLSX.write(workbook,{bookType:'xlsx',type:'array'}));
    }catch(error){if(error.name!=='AbortError')showError(tr('Экспорт не выполнен'),tr(error.message));}
  }
  function showError(title,message){
    modal={type:'error'};showModal(title,'<p>'+esc(message)+'</p>',html('<button class="measure-cta" data-action="close-modal">Закрыть</button>'));
  }
  function copiesModal(){
    modal={type:'backup-info'};
    const copy=state.backupCopy,facts=copy?M.backupFacts(copy.payload):null;
    const rows=copy?[[tr('Обновлено'),backupMoment(copy.at)],[tr('Записей'),facts.records],[tr('Исходных замеров'),facts.readings],[tr('Серий'),facts.series],[tr('Дней с измерениями'),facts.days],[tr('Периодов'),facts.periods]]:[];
    const body=copy?'<div class="backup-file-preview"><span class="backup-file-symbol">'+I('file')+'</span><strong>'+backupFileName+'</strong><span class="backup-format">JSON</span></div><div class="backup-facts">'
      +rows.map(([label,value])=>'<div><span>'+label+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>'
      :empty(tr('Копии пока нет'),state.autoBackup?tr('Она появится при открытии приложения с сохранёнными измерениями.'):tr('Включите автоматическую копию. Она будет создана при следующем открытии приложения.'));
    showModal(tr('Резервная копия'),body,html('<button class="measure-cta" data-action="close-modal">Закрыть</button>'));
    $('modal').querySelector('.sheet').classList.add('backup-info-sheet');
  }
  async function openBackupFolder(){
    if(backupBusy)return;
    backupBusy=true;
    const button=document.querySelector('[data-action="backup-location"]');
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
    try{
      if(unreadableDiary)throw Error(tr('Сначала восстановите доступ к сохранённому дневнику.'));
      const opened=await diskBackups.open(state.backupCopy);
      if(button)button.dataset.openedFolder=opened.path;
      if(opened.warning){storageError=tr(opened.warning);warn();}
    }catch(error){storageError=tr('Не удалось открыть папку: ')+tr(error.message);warn();}
    finally{backupBusy=false;if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
  }
  async function factoryReset(){
    if(backupBusy)return;
    backupBusy=true;phone.inert=true;
    try{
      const next=M.factoryState();
      await diskBackups.reset(()=>DiaryFiles.resetStoredDiary(localStorage,key,[statisticsKey,languageKey],next));
      state=next;unreadableDiary=false;storageError='';warn();ui.entry=null;ui.error='';ui.readingValidation=false;
      i18n.setLanguage(DiaryI18n.systemLanguage(systemLocale()));updateLanguageDocument();
      ui.filters=defaultHistoryFilters();ui.phaseHistory=false;ui.statisticsHistory=false;ui.limit=30;
      ui.chartSelection={};ui.phaseGroups={};ui.phaseGroupMode=null;
      ui.period='7';ui.scope='time';ui.metric='pressure';
      ui.statistics={tab:'overview',...M.statisticsPreferences(null,[]),detailScroll:0,restoreScroll:false};
      navigate('settings');
    }catch(error){showError(tr('Сброс не выполнен'),tr(error.message));}
    finally{
      backupBusy=false;phone.inert=false;
      const button=document.querySelector('[data-action="backup-location"]');
      if(button){button.disabled=false;button.removeAttribute('aria-busy');}
    }
  }
  function runBackupOnOpen(){
    if(backupBusy||unreadableDiary)return;
    const next=M.withAutoBackup(state);
    if(JSON.stringify(next)!==JSON.stringify(state)&&!persist(next))return;
    if(state.backupCopy)diskBackups.sync(state.backupCopy).catch(error=>{storageError=tr('Не удалось сохранить файл копии: ')+tr(error.message);warn();});
  }

  function restorePreview(payload){try{const parsed=M.restore(payload,state.phases);modal={type:'restore',parsed};showModal(tr('Восстановить дневник?'),html`<p>В копии: <strong>${recs(parsed.sessions.length)}</strong>, периодов: <strong>${parsed.phases.length}</strong>.</p><p>Записи в этом варианте заменятся данными из копии. Это действие нельзя отменить.</p>`,html(`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="restore-confirm">Восстановить</button>`));}catch(error){modal={type:'error'};showModal(tr('Не удалось восстановить копию'),html`<p>${esc(tr(error.message))}</p><p>Ваши текущие записи сохранены.</p>`,html(`<button class="measure-cta" data-action="close-modal">Понятно</button>`));}}
  $('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{restorePreview(JSON.parse(await file.text()));}catch{modal={type:'error'};showModal(tr('Не удалось прочитать'),html(`<p>Выберите резервную копию JSON приложения «Давление».</p>`),html(`<button class="measure-cta" data-action="close-modal">Понятно</button>`));}event.target.value='';});
  document.addEventListener('input',event=>{
    const target=event.target;
    if(modal?.type==='phase'&&target.id==='phase-title'){updatePhaseFeedback();return;}
    if(theme==='clarity'&&modal?.type==='filters'&&target.closest('.history-filter-form')){
      readHistoryFilterFields();
      if(target.id==='filter-from'||target.id==='filter-to')modal.filters.interval=modal.filters.from||modal.filters.to?'custom':'all';
      updateHistoryFilterPreview();return;
    }
    if(target.dataset.sessionNote){
      try{persist(M.withSessionNote(state,Number(target.dataset.sessionNote),target.value));}
      catch(error){storageError=tr('Не удалось сохранить заметку: ')+tr(error.message);warn();}
      return;
    }
    const field=target.dataset.entry;if(!field||!ui.entry)return;
    if(field==='wellbeing'){ui.entry.wellbeing=+target.value;$('wellbeing-output').innerHTML=target.value+'<small> / 10</small>';$('wellbeing-label').textContent=wellbeingLabel(+target.value);}
    else if(field==='note')ui.entry.note=target.value;
    else {
      const index=+target.dataset.index;
      if(['systolic','diastolic','pulse'].includes(field)){
        ui.entry.readings[index]=M.readingWithInput(ui.entry.readings[index],field,target.value);
        target.value=ui.entry.readings[index][field];updateReadingDate(index);
      }else {ui.entry.readings[index][field]=target.value;ui.entry.readings[index].timeSource='manual';}
      updateEntrySummary();
    }
    saveDraft();updateEntryFeedback();
  });
  document.addEventListener('focusin',event=>{
    if(ui.view==='entry'&&event.target.matches('.metric-field input'))updateEntryFeedback(event.target);
  });
  document.addEventListener('focusout',event=>{
    if(ui.view==='entry'&&event.target.matches('.metric-field input'))updateEntryFeedback(null);
    if(event.target.closest('.statistics-comparison-method-picker')&&!event.relatedTarget?.closest('.statistics-comparison-method-picker'))closeStatisticsComparisonMethod();
  });
  document.addEventListener('change',event=>{const target=event.target;if(theme==='clarity'&&modal?.type==='filters'&&target.closest('.history-filter-form')){readHistoryFilterFields();if(target.id==='filter-from'||target.id==='filter-to')modal.filters.interval=modal.filters.from||modal.filters.to?'custom':'all';updateHistoryFilterPreview();return;}if(target.dataset.change==='compare-baseline'){ui.compareBase=target.value;render();return;}if(target.dataset.change==='scope'){ui.scope=target.value;ui.chartSelection={};render();}if(modal?.type==='phase'&&target.id==='phase-open'){$('modal').querySelector('[data-action="phase-datetime"][data-field="end"]').disabled=target.checked;updatePhaseFeedback();}});
  function action(target){
    const a=target.dataset.action;
    switch(a){
      case 'nav':if(target.dataset.view==='history')clearPhaseHistory();if(target.dataset.view==='statistics'){ui.statistics.tab='overview';ui.statistics.restoreScroll=false;}navigate(target.dataset.view);break;
      case 'phase-group-toggle':ui.phaseGroups[target.dataset.group]=!target.closest('details').open;break;
      case 'back':navigate(ui.view==='phase'?'phases':ui.view==='entry'?'home':ui.view==='detail'?ui.detailReturn:'history');break;
      case 'detail':closeModal();navigate('detail',+target.dataset.id);break;
      case 'phase':navigate('phase',+target.dataset.id);break;
      case 'phase-history':ui.filters={...defaultHistoryFilters(),phaseId:target.dataset.id};ui.phaseHistory=true;ui.statisticsHistory=false;ui.limit=30;navigate('history');break;
      case 'statistics-tab':ui.statistics.tab=target.dataset.value;ui.statistics.restoreScroll=false;render();$('app-content').scrollTop=0;break;
      case 'statistics-preset':ui.statistics.selection={scope:'time',preset:target.dataset.value};persistStatisticsPreferences();ui.statistics.restoreScroll=false;delete ui.chartSelection.statistics;render();$('app-content').scrollTop=0;break;
      case 'statistics-summary':ui.statistics.summary=target.dataset.value;persistStatisticsPreferences();renderStatistics();break;
      case 'statistics-comparison-method':toggleStatisticsComparisonMethod();break;
      case 'statistics-comparison-summary':ui.statistics.compareSummary=target.dataset.value;persistStatisticsPreferences();renderStatistics();phone.querySelector('.statistics-comparison-method')?.focus({preventScroll:true});break;
      case 'statistics-settings':statisticsSettingsModal();break;
      case 'statistics-settings-apply':ui.statistics.chartMetric=modal.metric;closeModal();persistStatisticsPreferences();renderStatistics();break;
      case 'statistics-metric':modal.metric=target.dataset.value;renderStatisticsSettingsModal();break;
      case 'statistics-compare-type':ui.statistics.compareType=target.dataset.value;ensureStatisticsComparison();persistStatisticsPreferences();renderStatistics();break;
      case 'statistics-history':statisticsHistory(target.dataset.target);break;
      case 'statistics-range':statisticsRangeModal(target.dataset.target);break;
      case 'statistics-range-scope':switchStatisticsRangeScope(target.dataset.value);break;
      case 'statistics-range-preset':modal.selection={scope:'time',preset:target.dataset.value};modal.rangeAnchor=null;setStatisticsCalendar('to');renderStatisticsRangeModal();break;
      case 'statistics-range-period':modal.selection={scope:target.dataset.value};renderStatisticsRangeModal();break;
      case 'statistics-date':{
        setStatisticsCalendar(target.dataset.field);
        renderStatisticsRangeModal();break;
      }
      case 'statistics-range-apply':{
        statisticsWindow(modal.selection);const {target:selectionTarget,selection}=modal,s=ui.statistics;
        if(selectionTarget==='overview')s.selection=M.clone(selection);
        else if(s.compareType==='phases')s[selectionTarget]=selection.scope;
        else s[selectionTarget+'Dates']=M.clone(selection);
        closeModal();persistStatisticsPreferences();ui.statistics.restoreScroll=false;delete ui.chartSelection.statistics;render();$('app-content').scrollTop=0;break;
      }
      case 'new':ui.entry=M.resumeDraft(state);ui.readingValidation=false;navigate('entry');break;
      case 'resume-draft':{const draft=M.resumableDraft(state);if(draft&&persist(M.storeDraft(state,draft),false)){ui.entry=draft;ui.readingValidation=false;navigate('entry');}break;}
      case 'entry-datetime':entryDateTime(+target.dataset.index);break;
      case 'phase-datetime':phaseDateTime(target.dataset.field);break;
      case 'calendar-month':{const calendar=['filters','statistics-range'].includes(modal.type)?modal.calendar:modal;calendar.month=new Date(calendar.month.getFullYear(),calendar.month.getMonth()+Number(target.dataset.step),1);if(modal.type==='statistics-range')updateStatisticsCalendar();else updateCalendar();break;}
      case 'calendar-day':if(modal.type==='statistics-range')acceptStatisticsRangeDate(target.dataset.value);else if(modal.type==='filters')acceptHistoryFilterDate(target.dataset.value);else{modal.day=target.dataset.value;const day=new Date(modal.day+'T12:00');modal.month=new Date(day.getFullYear(),day.getMonth(),1);updateCalendar();}break;
      case 'calendar-today':{const today=new Date();if(modal.type==='filters')acceptHistoryFilterDate(local(today).slice(0,10));else{modal.day=local(today).slice(0,10);modal.month=new Date(today.getFullYear(),today.getMonth(),1);updateCalendar();}break;}
      case 'time-value':selectTimeValue(target.dataset.field,+target.dataset.value,true);break;
      case 'accept-datetime':{
        const index=modal.index,scroll=$('app-content').scrollTop;
        // Use the visible wheel positions even when a scroll debounce is still pending.
        const wheelValue=field=>Math.max(0,Math.min(field==='hour'?23:59,Math.round($('modal').querySelector(`[data-wheel="${field}"]`).scrollTop/40)));
        const selected=modal.day+'T'+twoDigits(wheelValue('hour'))+':'+twoDigits(wheelValue('minute'));
        if(modal.parent){
          const {parent,field}=modal,key=field==='start'?'startedAt':'endedAt',original=parent.phase[key];
          parent.phase[key]=original&&local(original)===selected?original:new Date(selected).toISOString();
          if(field==='end')parent.endValue=selected;
          closeModal();break;
        }
        ui.entry.readings[index].measuredAt=selected;
        ui.entry.readings[index].timeSource='manual';
        saveDraft();closeModal();render();$('app-content').scrollTop=scroll;
        $('app-content').querySelector(`[data-action="entry-datetime"][data-index="${index}"]`)?.focus({preventScroll:true});
        break;
      }
      case 'close-modal':closeModal();break;
      case 'filters':filtersModal();break;
      case 'reset-filters':ui.filters=defaultHistoryFilters();ui.phaseHistory=false;ui.statisticsHistory=false;ui.limit=30;render();break;
      case 'remove-history-filter':{
        const fields={dates:['from','to','interval'],mode:['mode'],phase:['phaseId'],wellbeing:['wellbeingMin','wellbeingMax'],tags:['tags'],note:['withNote'],sort:['sort']},defaults=defaultHistoryFilters();
        if(target.dataset.key==='phase')ui.phaseHistory=false;
        (fields[target.dataset.key]||[]).forEach(key=>ui.filters[key]=defaults[key]);ui.limit=30;render();break;
      }
      case 'history-filter-interval':Object.assign(modal.filters,{interval:target.dataset.value},M.historyInterval(target.dataset.value));$('filter-from').value=modal.filters.from;$('filter-to').value=modal.filters.to;updateHistoryFilterPreview();break;
      case 'history-filter-mode':modal.filters.mode=target.dataset.value;updateHistoryFilterPreview();break;
      case 'history-filter-date':openHistoryFilterDate(target.dataset.field);break;
      case 'history-filter-calendar-close':closeHistoryFilterPopovers(true);break;
      case 'history-filter-date-clear':acceptHistoryFilterDate('');break;
      case 'history-filter-select':openHistoryFilterSelect(target.dataset.key);break;
      case 'history-filter-select-option':{
        const key=target.dataset.key,value=target.dataset.value;
        if(key==='phase'){modal.filters.phaseId=value;$('filter-phase').value=value;}
        else{$('filter-sort-key').value=value;const direction=filterSortDirection(modal.filters.sort);modal.filters.sort=value==='date'?(direction==='desc'?'newest':'oldest'):value+'-'+direction;}
        closeHistoryFilterPopovers(true);updateHistoryFilterPreview();break;
      }
      case 'history-filter-tag':{const tag=target.dataset.value;modal.filters.tags=modal.filters.tags.includes(tag)?modal.filters.tags.filter(value=>value!==tag):[...modal.filters.tags,tag];updateHistoryFilterPreview();break;}
      case 'history-filter-sort-direction':{const key=$('filter-sort-key').value,direction=target.dataset.value;modal.filters.sort=key==='date'?(direction==='desc'?'newest':'oldest'):key+'-'+direction;updateHistoryFilterPreview();break;}
      case 'reset-filter-fields':if(theme==='clarity')resetHistoryFilterFields();else{$('filter-sort').value='newest';$('filter-from').value='';$('filter-to').value='';}break;
      case 'apply-filters':{
        if(theme==='clarity'){readHistoryFilterFields();updateHistoryFilterPreview();const errors=historyFilterErrors(modal.filters);if(errors.dateError||errors.scoreError)break;if(modal.filters.phaseId!==ui.filters.phaseId)ui.phaseHistory=false;if(['phaseId','from','to'].some(key=>modal.filters[key]!==ui.filters[key]))ui.statisticsHistory=false;ui.filters=M.clone(modal.filters);}
        else{const from=$('filter-from').value,to=$('filter-to').value;if(from&&to&&from>to){$('modal-error').textContent=tr('Дата начала должна быть раньше даты окончания или совпадать с ней.');break;}ui.filters={sort:$('filter-sort').value,from,to};}
        ui.limit=30;closeModal();render();break;
      }
      case 'load-more':{const scroll=$('app-content').scrollTop;ui.limit+=30;render();$('app-content').scrollTop=scroll;break;}
      case 'period':ui.period=target.dataset.value;ui.chartSelection={};render();break;
      case 'metric':ui.metric=target.dataset.value;ui.chartSelection={};render();break;
      case 'chart-point':{
        const chart=target.dataset.chart,index=+target.dataset.point;
        if(theme==='clarity'&&['home','statistics'].includes(chart)){
          const point=chartData[chart]?.points[index];if(point)navigate('detail',point.id);
        }else selectPoint(chart,index);
        break;
      }
      case 'chart-table':{const d=chartData[target.dataset.chart];modal={type:'records'};showModal(tr('Значения графика'),html`<p>${esc(d.title)} · ${recs(d.items.length)}. Здесь показаны все измерения.</p>${M.filter(d.items).map(recordCard).join('')||empty(tr('Нет данных'),tr('Выберите другой интервал.'))}`);break;}
      case 'point-records':{const d=chartData[target.dataset.chart],p=d.points[+target.dataset.point];if(p.count===1)navigate('detail',p.id);else {modal={type:target.dataset.chart==='statistics'?'statistics-records':'records'};showModal(tr('Исходные записи'),`<p>${date(p.from)} — ${date(p.to)} · ${recs(p.count)}</p>${M.filter(d.items.filter(s=>p.ids.includes(s.id))).map(recordCard).join('')}`);if(modal.type==='statistics-records')$('modal').querySelector('.sheet').classList.add('statistics-records-sheet');}break;}
      case 'entry-mode':{const mode=target.dataset.value;if(mode===ui.entry.mode)break;const next=M.switchDraft(state,ui.entry,mode);if(persist(next,false)){ui.entry=M.resumeDraft(state);ui.error='';ui.readingValidation=false;render();}break;}
      case 'add-reading':if(ui.entry.readings.length<M.MAX_SERIES_READINGS){ui.entry.readings.push(newReading());saveDraft();render();}break;
      case 'remove-reading':{ui.entry.readings.splice(+target.dataset.index,1);saveDraft();render();break;}
      case 'tag':{const t=target.dataset.tag;ui.entry.tags=ui.entry.tags.includes(t)?ui.entry.tags.filter(x=>x!==t):[...ui.entry.tags,t];target.classList.toggle('active',ui.entry.tags.includes(t));target.setAttribute('aria-pressed',String(ui.entry.tags.includes(t)));saveDraft();break;}
      case 'keypad':keypad(+target.dataset.index,target.dataset.key);break;
      case 'digit':{const k=target.dataset.value;if(k==='clear'){modal.value='';modal.replace=false;}else if(k==='erase'){modal.value=modal.value.slice(0,-1);modal.replace=false;}else{if(modal.replace){modal.value='';modal.replace=false;}if(modal.value.length<3)modal.value+=k;}$('keypad-value').textContent=modal.value||'—';break;}
      case 'accept-keypad':ui.entry.readings[modal.index]=M.readingWithInput(ui.entry.readings[modal.index],modal.field,modal.value);saveDraft();closeModal();render();break;
      case 'save-entry':saveEntry();break;
      case 'discard-draft':confirm(tr('Удалить черновик'),tr('При удалении черновика все введенные в нем данные также удалятся.'),()=>{const next=M.clearDraft(state,ui.entry.mode);if(persist(next)){ui.entry=null;navigate('home');}},tr('Удалить черновик'));break;
      case 'edit-note':{const item=state.sessions.find(s=>s.id===+target.dataset.id);modal={type:'note',id:item.id};showModal(tr('Заметка к измерению'),html`<label class="form-label" for="note-editor">Текст заметки</label><textarea id="note-editor" class="form-input" style="min-height:170px">${esc(item.note)}</textarea>`,html(`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="save-note">Сохранить</button>`));break;}
      case 'save-note':{const next=M.clone(state);next.sessions.find(s=>s.id===modal.id).note=$('note-editor').value.trim();if(persist(next)){closeModal();render();}break;}
      case 'phase-editor':phaseEditor(target.dataset.id?+target.dataset.id:null);break;
      case 'phase-icon':modal.icon=target.dataset.value;updatePhaseAppearance();break;
      case 'phase-color':modal.color=target.dataset.value;updatePhaseAppearance();break;
      case 'save-phase':saveEditedPhase();break;
      case 'finish-phase':try{const next=M.clone(state);next.phases=M.finishPhase(state.phases,+target.dataset.id);if(theme==='clarity'){if(persist(next)){render();showSaveSuccess('phase-finished');}}else if(persist(next))render();}catch(error){showError(tr('Не удалось завершить период'),tr(error.message));}break;
      case 'delete-phase':{const id=+target.dataset.id;confirm(tr('Удалить период?'),tr('Измерения останутся в дневнике. Удаление периода нельзя отменить.'),()=>{const next=M.clone(state);next.phases=next.phases.filter(p=>p.id!==id);if(persist(next))navigate('phases');},tr('Удалить'));break;}
      case 'auto-backup':{const next=M.clone(state);next.autoBackup=!next.autoBackup;if(persist(next))render();break;}
      case 'language':languageMenu();break;
      case 'set-language':applyLanguage(target.dataset.value);break;
      case 'backup-info':case 'copies':copiesModal();break;
      case 'backup-location':openBackupFolder();break;
      case 'export-xlsx':exportXLSX();break;
      case 'import':closeModal();$('import-file').click();break;
      case 'restore-confirm':{const next=M.clone(state);next.sessions=modal.parsed.sessions;next.phases=modal.parsed.phases;next.draft=null;next.drafts={single:null,series:null};next.draftMode='single';if(persist(next)){closeModal();ui.entry=null;ui.chartSelection={};render();}break;}
      case 'clear':confirm(tr('Удалить все измерения?'),tr`${recs(state.sessions.length)} будут удалены из этого варианта. Периоды и резервная копия сохранятся. Действие нельзя отменить.`,()=>{const next=M.clone(state);next.sessions=[];if(persist(next))render();},tr('Удалить'));break;
      case 'factory-reset':confirm(tr('Сбросить дневник?'),tr('Все измерения, периоды, черновики и сохранённая резервная копия будут удалены. Настройки вернутся к исходным значениям. Это действие нельзя отменить.'),factoryReset,tr('Сбросить всё'));break;
      case 'confirm':{const fn=modal.action;closeModal();fn();break;}
    }
  }
  document.addEventListener('click',event=>{if(!event.target.closest('.statistics-comparison-method-picker'))closeStatisticsComparisonMethod();if(modal?.type==='filters'&&theme==='clarity'&&!event.target.closest('.history-select,.history-filter-dates,.history-calendar-panel'))closeHistoryFilterPopovers();const target=event.target.closest('[data-action]');if(target)action(target);else if(event.target===$('modal'))closeModal();});
  document.addEventListener('pointerdown',()=>{document.body.dataset.inputMode='pointer';});
  document.addEventListener('keydown',()=>{document.body.dataset.inputMode='keyboard';});
  document.addEventListener('keydown',event=>{
    const comparisonPicker=event.target.closest('.statistics-comparison-method-picker');
    if(comparisonPicker){
      if(event.key==='Escape'&&closeStatisticsComparisonMethod(true)){event.preventDefault();return;}
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();const options=comparisonPicker.querySelector('[role="listbox"]');
        if(options.hidden){toggleStatisticsComparisonMethod();return;}
        const buttons=[...options.querySelectorAll('[role="option"]')],index=buttons.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
        buttons[next].focus();return;
      }
    }
    if(event.key==='Escape'&&modal){if(!closeHistoryFilterPopovers(true))closeModal();return;}
    if(modal?.type==='language'&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();const options=[...$('modal').querySelectorAll('[role="option"]')],index=options.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[next].focus();return;
    }
    if(modal?.type==='filters'&&theme==='clarity'&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      const trigger=event.target.closest('.history-select-trigger'),list=event.target.closest('.history-select-options');
      if(trigger&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openHistoryFilterSelect(trigger.dataset.key);return;}
      if(list){event.preventDefault();const options=[...list.querySelectorAll('[role="option"]')],index=options.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next].focus();return;}
    }
    if(theme==='clarity'&&!modal&&event.key==='Enter'&&!event.isComposing&&event.target.matches('.metric-field input')){
      event.preventDefault();advanceMetric(event.target);return;
    }
    const wheel=event.target.closest('.time-wheel');
    if(modal?.type==='datetime'&&wheel&&['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){
      event.preventDefault();const field=wheel.dataset.wheel,max=field==='hour'?23:59;
      const current=Math.round(wheel.scrollTop/40),step={ArrowUp:-1,ArrowDown:1,PageUp:-5,PageDown:5}[event.key];
      selectTimeValue(field,event.key==='Home'?0:event.key==='End'?max:Math.max(0,Math.min(max,current+step)),true);return;
    }
    if(modal?.type==='keypad'&&/^[0-9]$/.test(event.key)){event.preventDefault();action({dataset:{action:'digit',value:event.key}});return;}
    if(modal?.type==='keypad'&&event.key==='Backspace'){event.preventDefault();action({dataset:{action:'digit',value:'erase'}});return;}
    if(modal?.type==='keypad'&&event.key==='Enter'){event.preventDefault();action({dataset:{action:'accept-keypad'}});return;}
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('.chart-target')){event.preventDefault();action(event.target);}
    if(event.key==='Tab'&&modal){const els=[...$('modal').querySelectorAll('button,a[href],input,textarea,select,[tabindex="0"]')].filter(e=>!e.disabled&&e.getClientRects().length);const first=els[0],last=els.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement.classList.contains('sheet'))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){runBackupOnOpen();if(ui.view==='settings')render();}});
  updateLanguageDocument();
  runBackupOnOpen();
  readRoute();
})();
