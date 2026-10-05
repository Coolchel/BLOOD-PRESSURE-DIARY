(() => {
  'use strict';
  const M=window.DiaryModel;
  const theme=document.body.dataset.theme;
  const key='pressure-design-lab-v1-'+theme;
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
    heartPulse:'M20 13.5 12 21l-8-7.5C-3.5 6.4 6.1-1.1 12 5.5c5.9-6.6 15.5.9 8 8M3 12h4l2-3 3 6 2-3h7',
    wellbeingGauge:'M4.2 17.2a9 9 0 1 1 15.6 0M6.5 10.5l1.2 1.2M12 5.5v1.8M17.5 10.5l-1.2 1.2M12 15l3-3M10.5 15a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M7 20h10',
    valuesList:'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    singleReading:'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 12h2l1-3 2 6 1-3h2',
    chevronDown:'M6 9l6 6 6-6',
    backArrow:'M19 12H5M11 6l-6 6 6 6',
  });
  const I=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.info}"/></svg>`;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const date=(value,opts={day:'numeric',month:'short'})=>new Intl.DateTimeFormat('ru-RU',opts).format(new Date(value));
  const time=value=>date(value,{hour:'2-digit',minute:'2-digit'});
  const full=value=>date(value,{day:'numeric',month:'long',year:'numeric'})+' · '+time(value);
  const local=value=>{const d=new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+time(value).replace('.',':');};
  const kind=p=>M.KINDS.find(k=>k.kind===p.kind)||M.KINDS[0];
  const range=p=>date(p.startedAt)+' — '+(p.endedAt?date(p.endedAt):'сейчас');
  const recs=n=>n+' '+(n%100>=11&&n%100<=14?'записей':n%10===1?'запись':n%10>=2&&n%10<=4?'записи':'записей');
  const phaseCount=n=>n+' '+(n%100>=11&&n%100<=14?'периодов':n%10===1?'период':n%10>=2&&n%10<=4?'периода':'периодов');
  const readingCount=n=>n+' '+(n===1?'замер':n<5?'замера':'замеров');
  const num=(n,decimals=0)=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:decimals});
  const bp=s=>`${s.systolic}<span class="slash">/</span>${s.diastolic}`;
  const entryMetrics=[['systolic','Верхнее'],['diastolic','Нижнее'],['pulse','Пульс']];
  let storageError='';
  let state;
  try{const saved=localStorage.getItem(key);state=saved?JSON.parse(saved):M.seed();if(state.schema!==1)throw Error('Версия данных не поддерживается.');M.restore(M.backup(state));}
  catch(error){
    if(error.message.includes('непустую')&&state&&Array.isArray(state.sessions)&&state.sessions.length===0&&Array.isArray(state.phases)){}
    else {state=M.seed();storageError='Не удалось прочитать сохранённый дневник. Используются тестовые данные; исходное хранилище не перезаписывается.';}
  }
  const defaultHistoryFilters=()=>({sort:'newest',from:'',to:'',interval:'all',mode:'all',phaseId:'all',wellbeingMin:'',wellbeingMax:'',tags:[],withNote:false});
  const ui={view:'home',id:null,detailReturn:'history',period:'7',scope:'time',metric:'pressure',filters:defaultHistoryFilters(),limit:30,entry:null,error:'',readingValidation:false,chartSelection:{},undo:null};
  let modal=null,toastTimer,saveAnimationTimer,focusBeforeModal;
  document.body.classList.add('theme-'+theme);
  const params=new URLSearchParams(location.search);
  if(params.get('embed')==='1')document.body.classList.add('embedded');
  document.getElementById('studio').innerHTML=`<div class="studio"><aside class="studio-aside"><div class="studio-brand"><span class="brand-mark">${I('pulse')}</span>ДАВЛЕНИЕ / ДИЗАЙН</div><div class="studio-kicker">Вариант ${concept.number} из четырёх</div><h1>${concept.name}</h1><p>${concept.description}</p><div class="concept-links" aria-label="Другие варианты">${Object.entries(concepts).map(([t,c])=>`<a href="${t}.html" class="${t===theme?'active':''}" aria-label="${c.name}">${c.number}</a>`).join('')}</div><div class="studio-tags">${concept.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="studio-foot"><span></span>Рабочий прототип · данные сохраняются</div><a href="index.html#${theme}" class="back-studio">${I('back')} Все варианты</a></aside><div><div class="device-stage"><div class="phone" data-theme="${theme}"><div class="status-bar"><span id="status-time">${time(Date.now())}</span><div class="island"></div><div class="status-icons">${I('signal')}${I('wifi')}${I('battery')}</div></div><div id="storage-warning" class="storage-warning" hidden></div><header id="app-header" class="app-header"></header><main id="app-content" class="app-content" tabindex="-1"></main><nav id="bottom-nav" class="bottom-nav" aria-label="Разделы приложения"></nav><div id="entry-footer" class="entry-footer" hidden></div><div class="home-indicator"></div><div id="modal" class="modal-layer" hidden></div><div id="toast" class="toast" role="status" aria-live="polite" hidden></div><input id="import-file" type="file" accept=".json,application/json" hidden></div></div><div class="presentation-note">Нажимайте на экран. Все данные здесь — тестовые.</div></div></div>`;
  const $=id=>document.getElementById(id);
  const phone=document.querySelector('.phone');
  phone.insertAdjacentHTML('beforeend',`<div id="save-success" class="save-success" role="status" aria-live="polite" tabindex="-1" hidden><div class="save-success-content"><span class="save-success-symbol">${I('check')}</span><strong id="save-success-title"></strong></div></div>`);
  function showSaveSuccess(mode){
    clearTimeout(toastTimer);$('toast').hidden=true;
    clearTimeout(saveAnimationTimer);
    const overlay=$('save-success');
    $('save-success-title').textContent=mode==='series'?'Серия сохранена':'Измерение сохранено';
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
  function persist(next,copy=true){
    try{
      if(storageError.includes('исходное хранилище'))throw Error('Сначала скачайте копию исходного хранилища или используйте другой вариант.');
      const value=copy?M.withAutoBackup(next):next;
      localStorage.setItem(key,JSON.stringify(value));state=value;storageError='';warn();return true;
    }catch(error){storageError='Не удалось сохранить: '+error.message;warn();toast('Не удалось сохранить данные.');return false;}
  }
  function toast(message,undo=false){
    clearTimeout(toastTimer);
    $('toast').innerHTML=`<span>${esc(message)}</span>${undo?'<button data-action="undo">Отменить</button>':''}<span class="toast-countdown" aria-hidden="true"></span>`;
    $('toast').hidden=false;
    toastTimer=setTimeout(()=>$('toast').hidden=true,7000);
  }
  function mutation(next,message){const previous=M.clone(state);if(persist(next)){ui.undo=previous;toast(message,true);return true;}return false;}
  function navigate(view,id=null){
    if(ui.view==='entry'&&view!=='entry')saveDraft();
    if(view==='detail')ui.detailReturn=theme==='clarity'&&ui.view==='home'?'home':'history';
    ui.error='';location.hash=view+(id!==null?'/'+id:'');
    readRoute();
  }
  function readRoute(){
    const [view,id]=location.hash.slice(1).split('/');
    ui.view=['home','history','statistics','phases','settings','detail','phase','entry'].includes(view)?view:'home';ui.id=id?Number(id):null;
    if(ui.view==='entry'&&!ui.entry)ui.entry=M.resumeDraft(state);
    render();$('app-content').scrollTop=0;
  }
  window.addEventListener('hashchange',readRoute);
  const newReading=()=>M.newReading();
  function newDraft(){return M.newDraft();}
  function saveDraft(){if(!ui.entry)return false;return persist(M.storeDraft(state,ui.entry),false);}
  function recordCard(s){
    const v=M.summary(s),p=M.phaseFor(s,state.phases);
    if(theme==='clarity'&&ui.view==='history')return `<button class="card record-card clarity-history-record ${s.mode==='series'?'history-series':'history-single'}" data-action="detail" data-id="${s.id}" aria-label="Измерение ${esc(full(s.measuredAt))}, ${v.systolic} на ${v.diastolic}, пульс ${v.pulse}, самочувствие ${s.wellbeing} из 10">
      <span class="history-record-header"><span class="history-date-block"><time class="history-date" datetime="${esc(s.measuredAt)}">${date(s.measuredAt,{day:'numeric',month:'long'})} <span class="history-date-year">${date(s.measuredAt,{year:'numeric'})}</span></time><span class="history-record-mode">${s.mode==='series'?I('layers')+'Серия · '+readingCount(s.readings.length):I('singleReading')+'Одиночный замер'}</span></span><span class="history-time-block"><time class="history-time" datetime="${esc(s.measuredAt)}">${time(s.measuredAt)}</time>${I('chevron','record-chevron')}</span></span>
      <span class="history-metrics"><span class="history-pressure"><span class="history-metric-label">${s.mode==='series'?'Среднее давление':'Давление'}</span><span class="history-bp"><span class="bp-upper">${v.systolic}</span><span class="slash">/</span><span class="bp-lower">${v.diastolic}</span></span></span><span class="history-pulse" data-metric="pulse"><span class="history-metric-label">Пульс</span><span class="history-pulse-value">${I('heartPulse')}<strong>${v.pulse}</strong></span></span></span>
      <span class="history-context">${p?`<span class="history-period" title="${esc(p.title)} · ${esc(range(p))}">${I(kind(p).icon)}<span class="history-period-text"><strong>${esc(p.title)}</strong><small>${range(p)}</small></span></span>`:''}<span class="history-wellbeing">${I('wellbeingGauge')}<span>Самочувствие <strong>${s.wellbeing}<small>/10</small></strong></span></span></span>
      ${s.note?`<span class="record-note">${esc(s.note)}</span>`:''}
    </button>`;
    return `<button class="card record-card" data-action="detail" data-id="${s.id}" aria-label="Измерение ${esc(full(s.measuredAt))}, ${v.systolic} на ${v.diastolic}"><div class="record-top"><span>${date(s.measuredAt)} · ${time(s.measuredAt)}</span><span>${s.mode==='series'?'Серия · '+readingCount(s.readings.length):'Один замер'}</span></div><div class="record-values"><span class="record-bp">${v.systolic}<span class="muted"> / </span>${v.diastolic}</span><span class="record-pulse" data-metric="pulse">${I('pulse')}${v.pulse}</span>${I('chevron','record-chevron')}</div><div class="record-foot">${p?`<span class="pill">${esc(p.title)}</span>`:''}<span class="pill">Самочувствие ${s.wellbeing}/10</span></div>${s.note?`<p class="record-note">${esc(s.note.length>80?s.note.slice(0,80)+'…':s.note)}</p>`:''}</button>`;
  }
  const empty=(title,desc,action='')=>`<div class="empty">${I('chart')}<strong>${title}</strong>${desc}${action}</div>`;
  function statGrid(s){return `<div class="stats-grid">${[['systolic','Верхнее давление','мм рт. ст.','up'],['diastolic','Нижнее давление','мм рт. ст.','down'],['pulse','Пульс','уд/мин','pulse'],['wellbeing','Самочувствие','из 10','smile']].map(([key,label,unit,icon])=>`<div class="stat-tile" data-metric="${key}"><span class="metric-icon">${I(icon)}</span><strong>${s.count?num(s[key],key==='wellbeing'?1:0):'—'}</strong><small>${label}<br>${unit}</small></div>`).join('')}</div>`;}
  function compactStats(s){return `<div class="compact-stats"><div><strong>${s.count?s.systolic+'/'+s.diastolic:'—'}</strong><small>мм рт. ст.</small></div><div data-metric="pulse"><strong>${s.count?s.pulse:'—'}</strong><small>пульс</small></div><div><strong>${s.count?num(s.wellbeing,1):'—'}</strong><small>самочувствие</small></div></div>`;}
  function chartMarkup(id,title,items,metric='pressure',phases=[],window=null){
    const points=M.chartPoints(items,24); chartData[id]={id,title,items,metric,phases,window,points};
    if(theme==='clarity'&&id==='home')return `<div class="card chart-card home-chart"><div class="chart-heading row between"><strong>${title}</strong><button class="text-button" data-action="chart-table" data-chart="${id}" aria-label="Все значения графика ${title}" title="Значения графика">${I('valuesList')}</button></div><div class="chart-legend"><span><i class="line-key"></i>Верхнее</span><span><i class="line-key second"></i>Нижнее</span></div>${items.length?`<div class="chart-mount" data-chart="${id}"></div>`:empty('Нет записей в этом интервале','Выберите другой интервал или добавьте измерение.')}</div>`;
    return `<div class="card chart-card" data-metric="${metric}"><div class="chart-heading row between"><strong>${title}</strong><button class="text-button" data-action="chart-table" data-chart="${id}" aria-label="Все значения графика ${title}">${I('table')}</button></div><div class="chart-legend">${metric==='pressure'?'<span><i class="line-key"></i>Верхнее</span><span><i class="line-key second"></i>Нижнее · пунктир</span>':`<span><i class="line-key"></i>${metric==='pulse'?'Пульс · уд/мин':'Самочувствие · 1–10'}</span>`}</div>${items.length?`<div class="chart-mount" data-chart="${id}"></div><div id="readout-${id}" class="point-readout">Нажмите на точку, чтобы увидеть значения.</div><div class="chart-caption">${points.length<items.length?'Средние по '+points.length+' временным интервалам. Исходные записи — в таблице.':'Каждая точка — запись; для серии показано среднее.'}</div>`:empty('Нет записей в этом интервале','Выберите другой интервал или добавьте измерение.')}</div>`;
  }
  let chartData={};
  function clarityMeasurementCard(item,open=false){
    const s=M.summary(item),tag=open?'button':'div';
    const attributes=open?`data-action="detail" data-id="${item.id}"`:'role="group"';
    return `<${tag} class="card latest clarity-latest" ${attributes} aria-label="${open?'Последнее измерение':'Измерение'}: ${s.systolic} на ${s.diastolic}, пульс ${s.pulse}, самочувствие ${item.wellbeing} из 10, ${esc(full(item.measuredAt))}"><span class="topline"><span class="pill">${date(item.measuredAt,{day:'numeric',month:'long'})} в ${time(item.measuredAt)}</span></span><span class="bp"><span class="bp-upper">${s.systolic}</span><span class="slash">/</span><span class="bp-lower">${s.diastolic}</span></span><span class="latest-bottom"><span class="latest-metric" data-metric="pulse"><span class="latest-metric-icon">${I('heartPulse')}</span><span><span class="latest-metric-label">Пульс</span><span class="latest-metric-value"><strong>${s.pulse}</strong><small>уд/мин</small></span></span></span><span class="latest-metric"><span class="latest-metric-icon">${I('wellbeingGauge')}</span><span><span class="latest-metric-label">Самочувствие</span><span class="latest-metric-value"><strong>${item.wellbeing}</strong><small>из 10</small></span></span></span>${open?I('chevron','latest-chevron'):''}</span></${tag}>`;
  }
  function clarityPeriodCard(p){
    const content=`<span class="home-period-icon">${I(p?kind(p).icon:'calendar')}</span><span class="grow"><strong>${p?esc(p.title):'Без периода'}</strong><span class="home-period-meta">${p?range(p):'Выбрать период наблюдения'}</span></span>${I('chevron','home-period-chevron')}`;
    return `<button class="card home-period" data-action="${p?'phase':'nav'}" ${p?`data-id="${p.id}"`:'data-view="phases"'}>${content}</button>`;
  }
  function clarityDetail(item,p){
    const source=`<h2 class="form-section">Исходные замеры</h2><div class="card source-readings-card"><table class="reading-table source-readings-table" aria-label="Исходные замеры"><colgroup><col class="source-date-column"><col><col><col></colgroup><thead><tr><th scope="col">Дата и время</th><th scope="col">Верхнее</th><th scope="col">Нижнее</th><th scope="col">Пульс</th></tr></thead><tbody>${item.readings.map(r=>`<tr><td><time datetime="${esc(r.measuredAt)}">${time(r.measuredAt)}<small>${date(r.measuredAt)}</small></time></td><td data-metric="systolic"><strong>${r.systolic}</strong></td><td data-metric="diastolic"><strong>${r.diastolic}</strong></td><td data-metric="pulse"><strong>${r.pulse}</strong></td></tr>`).join('')}</tbody></table></div>`;
    return `<h2 class="form-section">Показания</h2>`+clarityMeasurementCard(item)+`<h2 class="form-section">Период</h2>`+clarityPeriodCard(p)+source+`<h2 class="form-section">Самочувствие</h2><div class="card"><div class="row between"><span class="muted">Оценка</span><strong>${item.wellbeing} из 10</strong></div>${item.tags.length?`<div class="tag-grid" style="margin-top:15px">${item.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}</div><div class="entry-note-block"><label class="form-label" for="saved-note">Заметка</label><textarea id="saved-note" class="form-input" placeholder="Что важно помнить об этом измерении?" data-session-note="${item.id}">${esc(item.note)}</textarea></div>`;
  }
  function home(){
    const recent=M.filter(state.sessions).slice(0,12),latest=recent[0],s=latest?M.summary(latest):null,p=latest?M.phaseFor(latest,state.phases):null;
    const latestCard=latest?`<button class="card latest" data-action="detail" data-id="${latest.id}"><div class="topline"><span class="label">Последнее измерение</span>${theme==='night'?'<span class="night-tag"><i></i>сохранено</span>':`<span class="pill">${date(latest.measuredAt)}</span>`}</div><div class="bp">${bp(s)}</div><div class="unit">мм рт. ст. ${theme==='clarity'?'· '+time(latest.measuredAt):''}</div><div class="latest-bottom"><span class="row" data-metric="pulse">${I('pulse')}<strong>${s.pulse}</strong><span class="small">уд/мин</span></span><span class="row">${I('smile')}<strong>${latest.wellbeing}/10</strong>${I('chevron')}</span></div></button>`:empty('Ваш первый замер','Добавьте измерение, чтобы начать дневник.');
    const add=`<button class="measure-cta" data-action="new">${I('plus')}Новое измерение</button>`;
    const resume=M.resumableDraft(state)?`<button class="draft-resume" data-action="resume-draft">${I('edit')}<span${theme==='clarity'?'':' class="grow"'}>Продолжить запись</span>${theme==='clarity'?'':I('chevron')}</button>`:'';
    if(theme==='clarity'){
      const measurement=latest?clarityMeasurementCard(latest,true):latestCard;
      const period=clarityPeriodCard(p);
      return measurement+(resume||add)+period+`<div class="section-title">Динамика<button data-action="nav" data-view="statistics">Вся статистика ↗</button></div>`+chartMarkup('home','Последние 12 измерений',recent);
    }
    const a=M.stats(recent);
    const averages=`<div class="section-title">Средние значения<span class="small muted">${recs(recent.length)}</span></div><div class="card home-averages">${compactStats(a)}</div>`;
    if(theme==='coral')return resume+latestCard+add+`<div class="coral-bento"><div class="bento">${I('pulse')}<strong>${a.count?a.pulse:'—'}<span class="small"> уд/мин</span></strong><small>Средний пульс · ${recs(recent.length)}</small></div><div class="bento">${I('smile')}<strong>${a.count?num(a.wellbeing,1):'—'}<span class="small"> / 10</span></strong><small>Среднее самочувствие</small></div></div><div class="section-title">Динамика<button data-action="nav" data-view="statistics">Подробнее ↗</button></div>`+chartMarkup('home','Последние 12 измерений',recent)+averages;
    if(theme==='night')return resume+latestCard+`<div class="night-metrics"><div><strong>${a.count?a.pulse:'—'} <span class="small">уд/мин</span></strong><small>Средний пульс · ${recs(recent.length)}</small></div><div><strong>${a.count?num(a.wellbeing,1):'—'}<span class="small"> / 10</span></strong><small>Среднее самочувствие</small></div></div>`+add+`<div class="section-title">Динамика<button data-action="nav" data-view="statistics">Подробнее ↗</button></div>`+chartMarkup('home','Последние 12 измерений',recent)+averages;
    return (theme==='calm'?`<p class="home-greeting">${date(Date.now(),{weekday:'long',day:'numeric',month:'long'})}</p>`:'')+resume+latestCard+add+(p?`<div class="scope-caption row" style="justify-content:center">${I(kind(p).icon)}<span>Период: ${esc(p.title)}</span></div>`:'')+`<div class="section-title">Динамика<button data-action="nav" data-view="statistics">Вся статистика ↗</button></div>`+chartMarkup('home','Последние 12 измерений',recent)+averages;
  }
  function historyItems(filters){
    const phaseId=filters.phaseId||'all',phase=state.phases.find(p=>String(p.id)===phaseId);
    if(phaseId!=='all'&&phaseId!=='none'&&!phase)return [];
    return M.filter(state.sessions,{...filters,phase:phase||null,withoutPhase:phaseId==='none',phases:state.phases});
  }
  const filterSortKey=sort=>['newest','oldest'].includes(sort)?'date':sort.split('-')[0];
  const filterSortDirection=sort=>sort==='oldest'||sort.endsWith('-asc')?'asc':'desc';
  function filterSortLabel(sort){
    if(sort==='newest')return 'Сначала новые';if(sort==='oldest')return 'Сначала старые';
    return ({systolic:'Верхнее',diastolic:'Нижнее',pulse:'Пульс'})[filterSortKey(sort)]+(filterSortDirection(sort)==='desc'?' · по убыванию':' · по возрастанию');
  }
  function historyFilterChips(f){
    const chips=[];
    if(f.from||f.to){
      const day=value=>date(value+'T12:00',{day:'numeric',month:'short',year:'numeric'});
      const label=({today:'Сегодня','7':'7 дней','30':'30 дней'})[f.interval]||(f.from&&f.to?day(f.from)+(f.from===f.to?'':' — '+day(f.to)):f.from?'С '+day(f.from):'По '+day(f.to));
      chips.push({key:'dates',label});
    }
    if(f.mode&&f.mode!=='all')chips.push({key:'mode',label:f.mode==='series'?'Серии':'Одиночные'});
    if(f.phaseId&&f.phaseId!=='all')chips.push({key:'phase',label:f.phaseId==='none'?'Без периода':state.phases.find(p=>String(p.id)===f.phaseId)?.title||'Период удалён'});
    if(f.wellbeingMin!==''||f.wellbeingMax!=='')chips.push({key:'wellbeing',label:'Самочувствие '+(f.wellbeingMin!==''&&f.wellbeingMin===f.wellbeingMax?f.wellbeingMin+'/10':(f.wellbeingMin||1)+'–'+(f.wellbeingMax||10))});
    if(f.tags?.length)chips.push({key:'tags',label:f.tags.length===1?f.tags[0]:'Отметки: '+f.tags.length});
    if(f.withNote)chips.push({key:'note',label:'С заметкой'});
    if(f.sort!=='newest')chips.push({key:'sort',label:filterSortLabel(f.sort)});
    return chips;
  }
  const activeHistoryFilterCount=()=>historyFilterChips(ui.filters).filter(c=>c.key!=='sort').length;
  function historyScreen(){
    const items=theme==='clarity'?historyItems(ui.filters):M.filter(state.sessions,ui.filters),chips=theme==='clarity'?historyFilterChips(ui.filters):[];
    const filtered=theme==='clarity'?activeHistoryFilterCount()>0:ui.filters.from||ui.filters.to||ui.filters.sort!=='newest';
    const summary=theme==='clarity'?`<div class="history-summary clarity-history-summary"><span>${filtered?'Найдено записей':'Записей в дневнике'}</span><strong>${items.length}</strong></div>`:`<div class="history-summary"><strong>${items.length}</strong><span>${filtered?'найдено':'в дневнике'}</span></div>`;
    const applied=theme==='clarity'?(chips.length?`<div class="history-active-filters" aria-label="Выбранные фильтры">${chips.map(c=>`<button class="history-filter-chip" data-action="remove-history-filter" data-key="${c.key}" aria-label="Убрать: ${esc(c.label)}"><span>${esc(c.label)}</span>${I('close')}</button>`).join('')}<button class="history-filter-reset" data-action="reset-filters">Сбросить все</button></div>`:''):(filtered?`<div class="filter-chip">${esc(M.SORTS.find(s=>s[0]===ui.filters.sort)?.[1])} ${ui.filters.from?'· с '+esc(ui.filters.from):''} ${ui.filters.to?'· по '+esc(ui.filters.to):''}<button data-action="reset-filters">Сбросить</button></div>`:'');
    return summary+applied+items.slice(0,ui.limit).map(recordCard).join('')+(items.length>ui.limit?`<button class="secondary" style="width:100%" data-action="load-more">${theme==='clarity'?'Показать еще':`Показать ещё · ${ui.limit} из ${items.length}`}</button>`:'')+(!items.length?empty(filtered?'Ничего не найдено':'История пока пустая',filtered?(theme==='clarity'?'Попробуйте убрать один из фильтров.':'Измените даты в фильтрах.'):'Сохранённые измерения появятся здесь.',filtered&&theme==='clarity'?'<button class="secondary" data-action="reset-filters">Сбросить фильтры</button>':''):'');
  }
  function statistics(){
    const selectedPhase=ui.scope==='time'?null:state.phases.find(p=>String(p.id)===ui.scope);
    if(ui.scope!=='time'&&!selectedPhase)ui.scope='time';
    const items=M.filter(state.sessions,selectedPhase?{phase:selectedPhase}:{days:ui.period});
    const s=M.stats(items),r=M.ranges(items),window=selectedPhase?{from:Date.parse(selectedPhase.startedAt),until:selectedPhase.endedAt?Date.parse(selectedPhase.endedAt):Date.now()}:ui.period==='all'?null:{from:Date.now()-+ui.period*M.DAY,until:Date.now()};
    const title=selectedPhase?selectedPhase.title:ui.period==='all'?'Все записи':'Последние '+ui.period+' дней';
    return `<label class="sr-only" for="stats-scope">Интервал или период наблюдения</label><select class="scope-select" id="stats-scope" data-change="scope"><option value="time" ${ui.scope==='time'?'selected':''}>По времени</option>${state.phases.map(p=>`<option value="${p.id}" ${ui.scope===String(p.id)?'selected':''}>${esc(p.title)} · ${range(p)}</option>`).join('')}</select>${ui.scope==='time'?`<div class="segmented" aria-label="Интервал статистики">${[['7','7 дней'],['30','30 дней'],['90','90 дней'],['all','Всё']].map(([v,l])=>`<button data-action="period" data-value="${v}" class="${v===ui.period?'active':''}" aria-pressed="${v===ui.period}">${l}</button>`).join('')}</div>`:''}<div class="scope-caption">${esc(title)} · ${recs(items.length)}<br>${items.length?date(window?window.from:items.at(-1).measuredAt)+' — '+date(window?window.until:items[0].measuredAt):'Записей пока нет'}</div><div class="segmented" aria-label="Показатель графика">${[['pressure','Давление'],['pulse','Пульс'],['wellbeing','Самочувствие']].map(([v,l])=>`<button data-action="metric" data-value="${v}" class="${v===ui.metric?'active':''}" aria-pressed="${v===ui.metric}">${l}</button>`).join('')}</div>`+chartMarkup('stats',ui.metric==='pressure'?'Давление · мм рт. ст.':ui.metric==='pulse'?'Пульс · уд/мин':'Самочувствие · баллы',items,ui.metric,selectedPhase?[selectedPhase]:state.phases,window)+`<div class="section-title">Средние значения</div><div class="scope-caption">${esc(title)} · ${recs(items.length)}. Серия учитывается как одна запись.</div>`+statGrid(s)+`<div class="section-title">Диапазон замеров</div><div class="scope-caption">Самые низкие и высокие значения. В серии учитывается каждый замер.</div><div class="card">${[['systolic','Верхнее','мм рт. ст.'],['diastolic','Нижнее','мм рт. ст.'],['pulse','Пульс','уд/мин']].map(([key,label,unit])=>`<div class="range-row" data-metric="${key}"><span>${label}<br><small class="muted">${unit}</small></span><strong>${r[key]?r[key].join(' — '):'—'}</strong></div>`).join('')}</div>`;
  }
  function phaseCard(p){const info=kind(p),s=M.stats(state.sessions.filter(m=>M.inside(m,p)));return `<button class="card phase-card" style="--phase-color:${info.color}" data-action="phase" data-id="${p.id}"><div class="row between"><span class="pill phase-kind">${I(info.icon)}${info.label}</span>${p.endedAt===null?'<span class="small muted">Идёт сейчас</span>':I('chevron')}</div><h3>${esc(p.title)}</h3><div class="phase-meta">${range(p)}<br>${recs(s.count)}</div>${s.count?compactStats(s):'<p class="form-hint">Измерений в периоде пока нет</p>'}</button>`;}
  function comparisons(){const base=M.baseline(state.sessions,state.phases),compared=state.phases.filter(p=>p.kind!=='clean').map(p=>({...p,stats:M.stats(state.sessions.filter(s=>M.inside(s,p)))})).filter(p=>p.stats.count);return `<div class="section-title">Сравнение периодов</div>${base.count?`<div class="card"><div class="small muted">Без напитков · ${recs(base.count)}</div>${compactStats(base)}</div>`:empty('Пока не с чем сравнить','Добавьте записи в период «Без напитков».')}`+(base.count?compared.length?compared.map(p=>`<div class="card"><div class="compare-head">${esc(p.title)}</div><div class="small muted">${recs(p.stats.count)} · разница с периодами без напитков</div>${[['systolic','Верхнее','мм'],['diastolic','Нижнее','мм'],['pulse','Пульс','уд/мин'],['wellbeing','Самочувствие','балл']].map(([k,l,u])=>{const delta=Math.round((p.stats.averages[k]-base.averages[k])*10)/10;return `<div class="compare-row" data-metric="${k}"><span>${l}</span><span>${num(base.averages[k],1)} → ${num(p.stats.averages[k],1)}</span><strong class="delta">${delta>0?'+':''}${num(delta,1)} ${u}</strong></div>`;}).join('')}</div>`).join(''):'<div class="settings-info">Сравнение появится, когда будут записи в другом типе периода.</div>':'');}
  function phases(){return `<p class="scope-caption">Отмечайте периоды привычек и сравнивайте показатели. Записи распределяются по дате автоматически.</p><button class="measure-cta" data-action="phase-editor">${I('plus')}Новый период</button><div class="section-title">Периоды наблюдения<span class="small muted">${state.phases.length}</span></div>`+(state.phases.length?state.phases.slice().sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).map(phaseCard).join(''):empty('Периодов пока нет','Создайте первый период наблюдения.'))+comparisons();}
  function phaseDetail(){const p=state.phases.find(p=>p.id===ui.id);if(!p)return empty('Период не найден','Вернитесь к списку периодов.');const items=M.filter(state.sessions,{phase:p}),s=M.stats(items);return `<span class="pill">${I(kind(p).icon)}${kind(p).label}</span><p class="scope-caption">${range(p)} · ${recs(items.length)}</p><button class="secondary" style="width:100%" data-action="phase-editor" data-id="${p.id}">${I('edit')}Изменить период</button><div class="section-title">Средние за период</div>`+statGrid(s)+chartMarkup('phase','Давление за период',items,'pressure',[p])+`<div class="section-title">Заметка</div><div class="card phase-detail-note">${p.note?esc(p.note):'<span class="muted">Заметка не добавлена</span>'}</div><div class="section-title">Измерения<span class="small muted">${items.length}</span></div>`+(items.length?items.map(recordCard).join(''):empty('Пока нет измерений','Записи появятся здесь, если их дата попадёт в период.'));}
  function detail(){
    const item=state.sessions.find(s=>s.id===ui.id);if(!item)return empty('Запись не найдена','Вернитесь в историю.');const s=M.summary(item),p=M.phaseFor(item,state.phases);
    if(theme==='clarity')return clarityDetail(item,p);
    return `<div class="scope-caption">${full(item.measuredAt)}<br>${item.mode==='series'?'Среднее серии из '+item.readings.length+' замеров':'Одиночное измерение'}</div><div class="card"><div class="bp">${bp(s)}</div><div class="unit">мм рт. ст.</div><div class="latest-bottom"><span class="row" data-metric="pulse">${I('pulse')}<strong>${s.pulse}</strong> <span class="small muted">уд/мин</span></span><span class="row">${I('smile')}<strong>${item.wellbeing}/10</strong></span></div></div>${p?`<button class="draft-resume" data-action="phase" data-id="${p.id}">${I(kind(p).icon)}<span class="grow">${esc(p.title)}</span>${I('chevron')}</button>`:''}<div class="section-title">Исходные замеры<span class="small muted">${item.readings.length}</span></div><div class="card"><table class="reading-table"><thead><tr><th>Дата / время</th><th>Верхнее</th><th>Нижнее</th><th>Пульс</th></tr></thead><tbody>${item.readings.map(r=>`<tr><td>${time(r.measuredAt)}<small>${date(r.measuredAt)}</small></td><td>${r.systolic}</td><td>${r.diastolic}</td><td data-metric="pulse">${r.pulse}</td></tr>`).join('')}</tbody></table><div class="form-hint">Давление — мм рт. ст.; пульс — уд/мин.</div></div><div class="section-title">Самочувствие</div><div class="card"><div class="row between"><span class="muted">Оценка</span><strong>${item.wellbeing} из 10</strong></div>${item.tags.length?`<div class="tag-grid" style="margin-top:15px">${item.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}</div><div class="section-title">Заметка<button data-action="edit-note" data-id="${item.id}">Изменить</button></div><div class="card note-display">${item.note?esc(item.note):'<span class="muted">Добавьте, как вы себя чувствовали или что происходило перед замером.</span>'}</div>`;
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
      if(message.textContent!==(error?.message||''))message.textContent=error?.message||'';
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
      const input=`<input id="${field}-${index}" aria-label="${label}, замер ${index+1}" type="text" inputmode="numeric" enterkeyhint="${last?'done':'next'}" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="—" value="${esc(r[field])}" data-entry="${field}" data-index="${index}">`;
      return clarity?`<label class="metric-field" data-metric="${field}" for="${field}-${index}"><span class="metric-field-label">${label}</span>${input}</label>`:`<div class="metric-field"><label for="${field}-${index}">${label}</label>${input}<button class="keypad-trigger" data-action="keypad" data-key="${field}" data-index="${index}" aria-label="Цифровая панель: ${label}, замер ${index+1}">${I('keyboard')}</button></div>`;
    }).join('');
    return `<div class="card reading-block ${ui.entry.mode==='series'?'series-reading':''}"><div class="reading-label"><span>${ui.entry.mode==='series'?'Замер '+(index+1):'Показатели'}</span>${ui.entry.mode==='series'&&ui.entry.readings.length>1?`<button data-action="remove-reading" data-index="${index}" aria-label="Удалить замер ${index+1}">${I('close')}</button>`:''}</div><div class="metrics-inputs">${fields}</div><div id="reading-error-${index}" class="reading-validation" role="alert" hidden>${I('info')}<div><strong>Некорректные показатели. Проверьте:</strong><p class="reading-validation-message"></p></div></div>${clarity?`<button class="datetime-card" data-action="entry-datetime" data-index="${index}" aria-label="Дата и время замера ${index+1}"><span class="datetime-title">Дата и время замера</span><span class="datetime-values">${readingDateValues(r)}</span></button>`:`<label class="datetime-field">Дата и время замера<input type="datetime-local" step="60" value="${esc(hasDate?local(r.measuredAt):'')}" aria-label="Дата и время замера ${index+1}" data-entry="measuredAt" data-index="${index}"></label>`}</div>`;
  }
  function entry(){
    const draft=ui.entry;
    const clarity=theme==='clarity';
    const addReading=draft.mode==='single'?(clarity?'':'<button class="secondary" style="width:100%" data-action="entry-mode" data-value="series">'+I('layers')+'Добавить в серию</button>'):draft.readings.length<M.MAX_SERIES_READINGS?'<button class="secondary add-reading" style="width:100%" data-action="add-reading">'+I('plus')+'Добавить замер</button>':'<p class="form-hint">В серии максимум 10 замеров.</p>';
    return `<div class="segmented entry-mode" aria-label="Способ измерения"><button data-action="entry-mode" data-value="single" class="${draft.mode==='single'?'active':''}" aria-pressed="${draft.mode==='single'}">Один замер</button><button data-action="entry-mode" data-value="series" class="${draft.mode==='series'?'active':''}" aria-pressed="${draft.mode==='series'}">${clarity?'Серия':'Серия · 2–10'}</button></div><div id="entry-error" class="error-box" role="alert">${esc(ui.error)}</div>${draft.readings.map(readingBlock).join('')}${addReading?`<div class="row">${addReading}</div>`:''}${clarity?'':'<div id="series-summary"></div>'}<div class="form-section">Как вы себя чувствуете?</div><div class="card wellbeing-card"><div class="row between"><span id="wellbeing-label" class="muted">${wellbeingLabel(draft.wellbeing)}</span><span id="wellbeing-output" class="wellbeing-value">${draft.wellbeing}<small> / 10</small></span></div><input class="wellbeing-slider" aria-label="Самочувствие" type="range" min="1" max="10" step="1" value="${draft.wellbeing}" data-entry="wellbeing"><div class="wellbeing-endpoints"><span>Очень плохо</span><span>Отлично</span></div></div><div class="form-section">Отметки</div><div class="tag-grid">${M.TAGS.map(t=>`<button data-action="tag" data-tag="${t}" class="tag ${draft.tags.includes(t)?'active':''}" aria-pressed="${draft.tags.includes(t)}">${t}</button>`).join('')}</div><div class="entry-note-block"><label class="form-label" for="entry-note">Заметка</label><textarea id="entry-note" class="form-input" placeholder="Что важно помнить об этом измерении?" data-entry="note">${esc(draft.note)}</textarea></div><button class="${clarity?'draft-clear':'text-button danger'}" data-action="discard-draft">${clarity?I('trash'):''}Удалить черновик</button>`;
  }
  const wellbeingLabel=value=>value>=9?'Отлично':value>=7?'Хорошо':value>=5?'Средне':value>=3?'Плохо':'Очень плохо';
  function updateEntrySummary(){const mount=$('series-summary');if(!mount)return;const readings=ui.entry.readings.map(r=>({systolic:+r.systolic,diastolic:+r.diastolic,pulse:+r.pulse}));mount.innerHTML=readings.every(M.validReading)?`<div class="summary-preview">${ui.entry.mode==='series'?'Среднее серии':'Показатели'}: <strong>${Math.round(readings.reduce((s,r)=>s+r.systolic,0)/readings.length)} / ${Math.round(readings.reduce((s,r)=>s+r.diastolic,0)/readings.length)}</strong> · пульс <strong>${Math.round(readings.reduce((s,r)=>s+r.pulse,0)/readings.length)}</strong></div>`:'';}
  function settings(){return `<div class="card settings-hero"><span class="hero-symbol">${I('shield')}</span><div><strong>Ваш дневник, ваши данные</strong><small>${recs(state.sessions.length)} · ${phaseCount(state.phases.length)}</small></div></div><div class="section-title">Резервные копии</div><div class="card settings-group"><button class="settings-row" role="switch" aria-checked="${state.autoBackup}" data-action="auto-backup">${I('refresh')}<span class="grow"><strong>Автоматическая копия</strong><small>Сохраняется после каждого изменения</small></span><span class="switch ${state.autoBackup?'on':''}"></span></button><button class="settings-row" data-action="copies">${I('clock')}<span class="grow"><strong>Сохранённые копии</strong><small>${state.lastBackup?'Обновлено '+full(state.lastBackup):'Копия появится после первого изменения'}</small></span>${I('chevron','chevron')}</button></div><div class="settings-info">Копии хранятся в этом браузере. Скачайте JSON, чтобы сохранить дневник на устройстве или перенести его.</div><div class="section-title">Экспорт и восстановление</div><div class="card settings-group">${[['export-xlsx','table','Экспорт Excel','Измерения, замеры и периоды · .xlsx'],['export-json','download','Скачать резервную копию','Все данные дневника · .json'],['import','upload','Восстановить из JSON','Выберите сохранённую копию дневника']].map(([a,i,t,d])=>`<button class="settings-row" data-action="${a}">${I(i)}<span class="grow"><strong>${t}</strong><small>${d}</small></span>${I('chevron','chevron')}</button>`).join('')}</div><div class="section-title">Дневник</div><div class="card settings-group"><button class="settings-row" data-action="clear">${I('trash')}<span class="grow"><strong class="danger">Удалить все измерения</strong><small>Периоды останутся. Действие можно отменить.</small></span>${I('chevron','chevron')}</button><button class="settings-row" data-action="about">${I('info')}<span class="grow"><strong>О варианте «${concept.name}»</strong><small>Функции и особенности веб-версии</small></span>${I('chevron','chevron')}</button></div>`;}
  function render(){
    chartData={};const top=['home','history','statistics','phases','settings'].includes(ui.view);
    const showNav=top||(theme==='clarity'&&ui.view==='detail');
    const navView=ui.view==='detail'?ui.detailReturn:ui.view;
    const titles={home:concept.home,history:'История',statistics:'Статистика',phases:'Периоды',settings:'Настройки',entry:'Новое измерение',detail:'Измерение',phase:'Период'};
    let actions='';
    if(ui.view==='history')actions=`<button class="icon-button history-filter-trigger ${theme==='clarity'&&activeHistoryFilterCount()?'has-filters':''}" data-action="filters" aria-label="Фильтры истории" ${theme==='clarity'&&activeHistoryFilterCount()?'aria-describedby="history-filter-count"':''}>${I('filter')}${theme==='clarity'&&activeHistoryFilterCount()?`<span class="history-filter-badge" aria-hidden="true">${activeHistoryFilterCount()}</span><span class="sr-only" id="history-filter-count">Выбрано фильтров: ${activeHistoryFilterCount()}</span>`:''}</button><button class="icon-button solid" data-action="new" aria-label="Добавить измерение">${I('plus')}</button>`;
    else if(top&&ui.view!=='home'&&ui.view!=='settings')actions=`<button class="icon-button" data-action="${ui.view==='phases'?'phase-editor':'new'}" aria-label="${ui.view==='phases'?'Создать период':'Добавить измерение'}">${I('plus')}</button>`;
    else if(ui.view==='home'&&theme!=='clarity')actions=`<button class="icon-button" data-action="nav" data-view="settings" aria-label="Настройки">${I('settings')}</button>`;
    $('app-header').innerHTML=top?`<h1>${titles[ui.view]}</h1><div class="header-actions">${actions}</div>`:`<div class="header-back"><button class="icon-button back-button" data-action="back" aria-label="Назад">${I(theme==='clarity'?'backArrow':'back')}</button><h1>${titles[ui.view]}</h1></div>`;
    $('app-content').dataset.view=ui.view;
    $('app-content').innerHTML=({home,history:historyScreen,statistics,phases,settings,detail,phase:phaseDetail,entry}[ui.view]||home)();
    $('bottom-nav').hidden=!showNav;$('bottom-nav').style.display=showNav?'flex':'none';
    $('bottom-nav').innerHTML=[['home','home','Главная'],['history','history','История'],['statistics','chart','Статистика'],['phases','layers','Периоды'],['settings','settings','Настройки']].map(([v,i,l])=>`<button class="nav-item ${navView===v?'active':''}" data-action="nav" data-view="${v}" ${navView===v?'aria-current="page"':''}><span class="nav-icon">${I(i)}</span>${l}</button>`).join('');
    $('entry-footer').hidden=ui.view!=='entry';
    $('entry-footer').innerHTML=ui.view==='entry'?'<button class="measure-cta" data-action="save-entry">'+I('check')+'Сохранить '+(ui.entry.mode==='series'?'серию':'измерение')+'</button>':'';
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
      const keys=data.metric==='pressure'?['systolic','diastolic']:[data.metric];
      const values=pts.flatMap(p=>keys.map(k=>p[k]));
      const min=data.metric==='wellbeing'?1:Math.max(0,Math.floor((Math.min(...values)-10)/10)*10),max=data.metric==='wellbeing'?10:Math.max(min+40,Math.ceil((Math.max(...values)+10)/10)*10);
      let from=data.window?.from??Date.parse(pts[0].measuredAt),until=data.window?.until??Date.parse(pts.at(-1).measuredAt);if(until<=from){from-=M.DAY/2;until+=M.DAY/2;}
      const uniform=data.id==='home';const x=i=>left+(uniform?(pts.length===1?.5:i/(pts.length-1)):(Date.parse(pts[i].measuredAt)-from)/(until-from))*(right-left);const y=v=>bottom-(v-min)/(max-min)*(bottom-top);
      const ticks=data.metric==='wellbeing'?[1,5,10]:[min,Math.round((min+max)/2),max];
      const bands=data.phases.filter(p=>Date.parse(p.startedAt)<=until&&(p.endedAt===null||Date.parse(p.endedAt)>from));
      let markup=`<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(data.title)}, ${data.items.length} записей. Нажмите на точку или откройте таблицу."><title>${esc(data.title)}</title>`;
      if(!uniform)bands.forEach(p=>{const start=Math.max(from,Date.parse(p.startedAt)),end=Math.min(until,p.endedAt===null?until:Date.parse(p.endedAt));const a=left+(start-from)/(until-from)*(right-left),b=left+(end-from)/(until-from)*(right-left);markup+=`<rect x="${a}" y="${top}" width="${Math.max(0,b-a)}" height="${bottom-top}" fill="${kind(p).color}" opacity=".08"/><rect x="${a}" y="${bottom+3}" width="${Math.max(1,b-a)}" height="3" fill="${kind(p).color}" opacity=".7"/>`;});
      ticks.forEach(v=>{markup+=`<path class="grid-line" d="M${left} ${y(v)}H${right}"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`;});
      keys.forEach((k,idx)=>{markup+=`<path class="plot-line ${idx?'second':''}" d="${pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(p[k]).toFixed(2)).join(' ')}"/>`;pts.forEach((p,i)=>{markup+=`<circle class="point-dot ${idx?'second':''}" cx="${x(i)}" cy="${y(p[k])}" r="${pts.length>15?2:3}"/>`;});});
      const labelCount=Math.min(4,pts.length);
      for(let n=0;n<labelCount;n++){const i=labelCount===1?0:Math.round(n*(pts.length-1)/(labelCount-1));const t=uniform?Date.parse(pts[i].measuredAt):labelCount===1?Date.parse(pts[i].measuredAt):from+n*(until-from)/(labelCount-1);const xp=uniform?x(i):left+(t-from)/(until-from)*(right-left);markup+=`<text x="${xp}" y="186" text-anchor="${n===0?'start':n===labelCount-1?'end':'middle'}">${date(t,{day:'2-digit',month:'2-digit'})}</text>`;}
      if(theme!=='clarity'||data.id!=='home')markup+=`<text x="${left}" y="12">${data.metric==='pressure'?'мм рт. ст.':data.metric==='pulse'?'уд/мин':'баллы'}</text>`;
      pts.forEach((p,i)=>{const before=i===0?left:(x(i-1)+x(i))/2,after=i===pts.length-1?right:(x(i)+x(i+1))/2;markup+=`<rect class="chart-target" x="${Math.max(left,before)}" y="${top}" width="${Math.max(8,after-before)}" height="${bottom-top}" data-action="chart-point" data-chart="${data.id}" data-point="${i}" role="button" tabindex="0" aria-label="${esc(date(p.measuredAt))}: ${keys.map(k=>num(p[k],1)).join(', ')}"/>`;});
      markup+='</svg>';
      if(bands.length)markup+=`<div class="band-legend">${bands.map(p=>`<span><i style="background:${kind(p).color}"></i>${esc(p.title)}</span>`).join('')}</div>`;
      mount.innerHTML=markup;
      if(ui.chartSelection[data.id]!==undefined)selectPoint(data.id,Math.min(ui.chartSelection[data.id],pts.length-1));
    });
  }
  function selectPoint(id,index){const d=chartData[id],p=d?.points[index],mount=$('readout-'+id);if(!p||!mount)return;ui.chartSelection[id]=index;mount.hidden=false;mount.innerHTML=`<div>${p.count>1?date(p.from)+' — '+date(p.to)+' · '+recs(p.count):full(p.measuredAt)}</div><strong>${d.metric==='pressure'?num(p.systolic,1)+' / '+num(p.diastolic,1)+(theme==='clarity'&&id==='home'?'':' мм рт. ст.'):d.metric==='pulse'?num(p.pulse,1)+' уд/мин':num(p.wellbeing,1)+' из 10'}</strong><div><button data-action="point-records" data-chart="${id}" data-point="${index}">${p.count>1?'Открыть исходные записи':'Открыть измерение'} ${I('chevron')}</button></div>`;}
  let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawCharts,50);}).observe(phone);
  function showModal(title,body,actions=''){
    focusBeforeModal=document.activeElement;$('modal').hidden=false;$('modal').innerHTML=`<section class="sheet ${modal?.type==='datetime'?'datetime-sheet':modal?.type==='filters'&&theme==='clarity'?'history-filters-sheet':''}" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"><div class="sheet-handle"></div><div class="sheet-header"><h2 id="sheet-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Закрыть окно">${I('close')}</button></div><div class="sheet-content">${body}</div>${actions?`<div class="sheet-actions">${actions}</div>`:''}</section>`;
    $('app-content').inert=true;$('app-header').inert=true;$('bottom-nav').inert=true;$('entry-footer').inert=true;
    $('modal').querySelector('.sheet').focus({preventScroll:true});
  }
  function closeModal(){if(modal?.type==='download'){const url=modal.url;setTimeout(()=>URL.revokeObjectURL(url),10000);}if(modal?.wheelTimers)Object.values(modal.wheelTimers).forEach(clearTimeout);modal=null;$('modal').hidden=true;$('modal').innerHTML='';['app-content','app-header','bottom-nav','entry-footer'].forEach(id=>$(id).inert=false);if(focusBeforeModal?.isConnected)focusBeforeModal.focus({preventScroll:true});}
  function confirm(title,body,action,label='Подтвердить'){modal={type:'confirm',action};showModal(title,`<p>${body}</p>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="confirm">${label}</button>`);}
  const twoDigits=value=>String(value).padStart(2,'0');
  function calendarMarkup(calendar=modal){
    const year=calendar.month.getFullYear(),month=calendar.month.getMonth();
    const first=new Date(year,month,1),offset=(first.getDay()+6)%7;
    const totalDays=new Date(year,month+1,0).getDate();
    const cells=Math.ceil((offset+totalDays)/7)*7,today=local(Date.now()).slice(0,10);
    return `<div class="calendar-heading"><strong>${date(first,{month:'long',year:'numeric'})}</strong><div class="row"><button class="calendar-nav" data-action="calendar-month" data-step="-1" aria-label="Предыдущий месяц">${I('back')}</button><button class="calendar-nav" data-action="calendar-month" data-step="1" aria-label="Следующий месяц">${I('chevron')}</button></div></div><div class="calendar-weekdays" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-grid">${Array.from({length:cells},(_,i)=>{
      const day=new Date(year,month,i-offset+1),value=local(day).slice(0,10);
      return `<button class="calendar-day ${day.getMonth()!==month?'outside':''} ${value===calendar.day?'selected':''} ${value===today?'today':''}" data-action="calendar-day" data-value="${value}" aria-label="${esc(date(day,{day:'numeric',month:'long',year:'numeric'}))}" aria-pressed="${value===calendar.day}" ${value===today?'aria-current="date"':''}>${day.getDate()}</button>`;
    }).join('')}</div>`;
  }
  function timeWheel(field,count,label){
    return `<div class="time-wheel-frame"><div class="time-wheel" data-wheel="${field}" role="group" aria-label="${label}" tabindex="0">${Array.from({length:count},(_,value)=>`<button class="time-wheel-value ${modal[field]===value?'selected':''}" data-action="time-value" data-field="${field}" data-value="${value}" aria-label="${twoDigits(value)} ${field==='hour'?'часов':'минут'}" aria-pressed="${modal[field]===value}">${twoDigits(value)}</button>`).join('')}</div></div>`;
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
    modal={type:'datetime',index,day:local(value).slice(0,10),month:new Date(value.getFullYear(),value.getMonth(),1),hour:value.getHours(),minute:value.getMinutes(),wheelTimers:{}};
    showModal('Дата и время',`<div id="calendar-picker">${calendarMarkup()}</div><div class="calendar-footer"><button class="text-button" data-action="calendar-today">Сегодня</button><span class="muted">${date(value,{day:'numeric',month:'long'})}</span></div><div class="time-picker"><span class="time-picker-label">Время замера</span><div class="time-wheels">${timeWheel('hour',24,'Часы')}<span class="time-colon" aria-hidden="true">:</span>${timeWheel('minute',60,'Минуты')}</div></div>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="accept-datetime">Готово</button>`);
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
    modal={type:'filters'};showModal('Фильтры истории',`<label class="form-label" for="filter-sort">Порядок записей</label><select id="filter-sort" class="form-input">${M.SORTS.map(([v,l])=>`<option value="${v}" ${v===ui.filters.sort?'selected':''}>${l}</option>`).join('')}</select><label class="form-label" for="filter-from">С какой даты</label><input class="form-input" id="filter-from" type="date" value="${ui.filters.from}"><label class="form-label" for="filter-to">По какую дату</label><input class="form-input" id="filter-to" type="date" value="${ui.filters.to}"><p class="form-hint">Обе даты входят в выбранный интервал.</p><div id="modal-error" class="error-box" role="alert"></div><button class="text-button" data-action="reset-filter-fields">Сбросить фильтры</button>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="apply-filters">Применить</button>`);
  }
  function clarityFiltersModal(){
    modal={type:'filters',filters:M.clone(ui.filters),calendar:null};
    const f=modal.filters,extra=!!(f.wellbeingMin||f.wellbeingMax||f.tags.length||f.withNote);
    const option=(action,value,label,selected,icon='')=>`<button class="history-filter-option ${selected?'active':''}" data-action="${action}" data-value="${value}" aria-pressed="${selected}">${icon?I(icon):''}${label}</button>`;
    showModal('Фильтры',`<div class="history-filter-form">
      <section class="history-filter-section"><h3>Дата измерения</h3><div class="history-date-presets" role="group" aria-label="Быстрый выбор дат">${[['all','Все'],['today','Сегодня'],['7','7 дней'],['30','30 дней']].map(([value,label])=>option('history-filter-interval',value,label,f.interval===value)).join('')}</div><div class="history-filter-dates">${[['from','С','Дата начала'],['to','По','Дата окончания']].map(([field,label,name],index)=>`${index?'<span aria-hidden="true">—</span>':''}<div class="history-date-field"><span>${label}</span><input id="filter-${field}" type="hidden" value="${esc(f[field])}"><button id="filter-${field}-trigger" class="history-date-trigger" data-action="history-filter-date" data-field="${field}" aria-label="${name}" aria-controls="filter-calendar-picker" aria-expanded="false"><span></span>${I('calendar')}</button></div>`).join('')}</div><div id="filter-calendar-picker" class="history-calendar-panel" role="group" aria-labelledby="filter-calendar-title" hidden></div><p id="filter-date-error" class="history-filter-error" role="status" hidden></p></section>
      <section class="history-filter-section"><h3>Тип записи</h3><div class="history-mode-options" role="group" aria-label="Тип записи">${[['all','Все',''],['single','Одиночные','singleReading'],['series','Серии','layers']].map(([value,label,icon])=>option('history-filter-mode',value,label,f.mode===value,icon)).join('')}</div></section>
      <section class="history-filter-section"><h3 id="filter-phase-label">Период наблюдения</h3>${historyFilterSelect('phase',f.phaseId)}</section>
      <details class="history-extra-filters" ${extra?'open':''}><summary>Самочувствие и отметки<span class="history-extra-count" id="filter-extra-count"></span>${I('chevron')}</summary><div class="history-extra-content"><h3>Самочувствие</h3><div class="history-wellbeing-range"><label for="filter-wellbeing-min">От<input class="form-input" id="filter-wellbeing-min" type="text" inputmode="numeric" enterkeyhint="next" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="1" aria-label="Самочувствие от" aria-describedby="filter-wellbeing-error" value="${esc(f.wellbeingMin)}"></label><span aria-hidden="true">—</span><label for="filter-wellbeing-max">До<input class="form-input" id="filter-wellbeing-max" type="text" inputmode="numeric" enterkeyhint="done" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="10" aria-label="Самочувствие до" aria-describedby="filter-wellbeing-error" value="${esc(f.wellbeingMax)}"></label><span class="history-range-unit">из 10</span></div><div id="filter-wellbeing-error" class="reading-validation history-filter-validation" role="alert" hidden>${I('info')}<div><strong>Некорректное самочувствие. Проверьте:</strong><p class="reading-validation-message"></p></div></div><h3>Отметки</h3><p class="history-filter-hint">Подойдёт любая из выбранных отметок.</p><div class="history-filter-tags tag-grid" role="group" aria-label="Отметки измерения">${M.TAGS.map(tag=>`<button class="history-filter-tag tag ${f.tags.includes(tag)?'active':''}" data-action="history-filter-tag" data-value="${esc(tag)}" aria-pressed="${f.tags.includes(tag)}">${esc(tag)}</button>`).join('')}</div><label class="history-note-toggle"><span>${I('file')}Только с заметкой</span><input id="filter-with-note" class="history-note-input sr-only" type="checkbox" ${f.withNote?'checked':''}><span class="history-note-check" aria-hidden="true">${I('check')}</span></label></div></details>
      <section class="history-filter-section history-sort-section"><h3 id="filter-sort-label">Порядок записей</h3>${historyFilterSelect('sort',filterSortKey(f.sort))}<div class="history-sort-directions" role="group" aria-label="Направление сортировки">${['desc','asc'].map(value=>option('history-filter-sort-direction',value,'',filterSortDirection(f.sort)===value)).join('')}</div></section>
    </div>`,`<button class="secondary" data-action="reset-filter-fields">Сбросить</button><button class="measure-cta" id="filter-apply" data-action="apply-filters"></button>`);
    updateHistoryFilterPreview();
  }
  function historyFilterSelectOptions(key){
    if(key==='sort')return [['date','По дате','calendar'],['systolic','По верхнему давлению','up'],['diastolic','По нижнему давлению','down'],['pulse','По пульсу','heartPulse']].map(([value,label,icon])=>({value,label,icon}));
    return [{value:'all',label:'Все периоды',icon:'layers'},{value:'none',label:'Без периода',icon:'calendar'},...state.phases.slice().sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).map(p=>({value:String(p.id),label:p.title,description:range(p),icon:kind(p).icon}))];
  }
  function historyFilterSelect(key,value){
    const options=historyFilterSelectOptions(key),selected=options.find(option=>option.value===value)||options[0];
    return `<div class="history-select"><input id="${key==='sort'?'filter-sort-key':'filter-phase'}" type="hidden" value="${esc(value)}"><button class="history-select-trigger" id="filter-${key}-trigger" data-action="history-filter-select" data-key="${key}" aria-haspopup="listbox" aria-controls="filter-${key}-options" aria-expanded="false" aria-labelledby="filter-${key}-label filter-${key}-value"><span id="filter-${key}-icon" class="history-select-icon">${I(selected.icon)}</span><span class="history-select-value" id="filter-${key}-value">${esc(selected.label)}</span>${I('chevronDown','history-select-chevron')}</button><div class="history-select-options" id="filter-${key}-options" role="listbox" aria-labelledby="filter-${key}-label" hidden>${options.map(option=>`<button class="history-select-option" role="option" aria-selected="${option.value===value}" data-action="history-filter-select-option" data-key="${key}" data-value="${esc(option.value)}">${I(option.icon)}<span><strong>${esc(option.label)}</strong>${option.description?`<small>${esc(option.description)}</small>`:''}</span>${I('check','history-select-check')}</button>`).join('')}</div></div>`;
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
    picker.innerHTML=`<div class="history-calendar-title"><strong id="filter-calendar-title">${field==='from'?'Дата начала':'Дата окончания'}</strong><button class="calendar-nav" data-action="history-filter-calendar-close" aria-label="Закрыть календарь">${I('close')}</button></div><div id="filter-calendar-grid">${calendarMarkup(modal.calendar)}</div><div class="history-calendar-actions"><button data-action="calendar-today">Сегодня</button><button data-action="history-filter-date-clear">Сбросить дату</button></div>`;
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
    const dateError=f.from&&f.to&&f.from>f.to?'Дата начала должна быть не позже даты окончания.':'';
    const scores=[f.wellbeingMin,f.wellbeingMax].filter(value=>value!=='').map(Number);
    const scoreError=scores.some(value=>!Number.isInteger(value)||value<1||value>10)?'Укажите оценку от 1 до 10.':f.wellbeingMin!==''&&f.wellbeingMax!==''&&Number(f.wellbeingMin)>Number(f.wellbeingMax)?'Начальная оценка должна быть не больше конечной.':'';
    return {dateError,scoreError};
  }
  function updateHistoryFilterPreview(){
    const f=modal.filters,{dateError,scoreError}=historyFilterErrors(f);
    $('filter-date-error').hidden=!dateError;$('filter-date-error').textContent=dateError;
    $('filter-wellbeing-error').hidden=!scoreError;$('filter-wellbeing-error').querySelector('.reading-validation-message').textContent=scoreError;
    ['filter-from-trigger','filter-to-trigger'].forEach(id=>$(id).setAttribute('aria-invalid',String(!!dateError)));
    ['filter-wellbeing-min','filter-wellbeing-max'].forEach(id=>$(id).setAttribute('aria-invalid',String(!!scoreError)));
    $('filter-apply').disabled=!!(dateError||scoreError);
    $('filter-apply').textContent=dateError?'Проверьте даты':scoreError?'Проверьте оценку':'Показать '+recs(historyItems(f).length);
    const extra=Number(!!(f.wellbeingMin||f.wellbeingMax))+Number(!!f.tags.length)+Number(f.withNote);
    $('filter-extra-count').textContent=extra?String(extra):'';$('filter-extra-count').hidden=!extra;
    ['from','to'].forEach(field=>{const button=$('filter-'+field+'-trigger');button.querySelector('span').textContent=f[field]?date(f[field]+'T12:00',{day:'2-digit',month:'2-digit',year:'numeric'}):'Выбрать';button.classList.toggle('is-empty',!f[field]);});
    ['phase','sort'].forEach(key=>{const value=key==='phase'?f.phaseId:filterSortKey(f.sort),options=historyFilterSelectOptions(key),selected=options.find(option=>option.value===value)||options[0];$('filter-'+key+'-value').textContent=selected.label;$('filter-'+key+'-icon').innerHTML=I(selected.icon);$('filter-'+key+'-options').querySelectorAll('[role="option"]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.value===value)));});
    $('modal').querySelectorAll('[data-action="history-filter-interval"],[data-action="history-filter-mode"],[data-action="history-filter-tag"],[data-action="history-filter-sort-direction"]').forEach(button=>{
      const {action,value}=button.dataset,selected=action==='history-filter-interval'?f.interval===value:action==='history-filter-mode'?f.mode===value:action==='history-filter-tag'?f.tags.includes(value):filterSortDirection(f.sort)===value;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
      if(action==='history-filter-sort-direction')button.textContent=filterSortKey(f.sort)==='date'?(value==='desc'?'Сначала новые':'Сначала старые'):(value==='desc'?'Сначала большие':'Сначала меньшие');
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
    const p=id===null?{kind:'clean',title:'',startedAt:local(Date.now()),endedAt:null,note:''}:state.phases.find(p=>p.id===id);if(!p)return;
    modal={type:'phase',id};showModal(id===null?'Новый период':'Изменить период',`<label class="form-label" for="phase-title">Название</label><input id="phase-title" class="form-input" maxlength="100" value="${esc(p.title)}" placeholder="Например, спокойная неделя"><label class="form-label" for="phase-kind">Тип периода</label><select id="phase-kind" class="form-input">${M.KINDS.map(k=>`<option value="${k.kind}" ${k.kind===p.kind?'selected':''}>${k.label}</option>`).join('')}</select><label class="form-label" for="phase-start">Дата начала</label><input id="phase-start" type="datetime-local" class="form-input" value="${id===null?p.startedAt:local(p.startedAt)}"><label class="form-label row"><input id="phase-open" type="checkbox" ${p.endedAt===null?'checked':''} data-change="phase-open">Период продолжается</label><div id="phase-end-wrap" ${p.endedAt===null?'hidden':''}><label class="form-label" for="phase-end">Дата завершения</label><input id="phase-end" type="datetime-local" class="form-input" value="${local(p.endedAt||Date.now())}"><p class="form-hint">В период войдут замеры, сделанные до этого времени.</p></div><label class="form-label" for="phase-note">Заметка</label><textarea id="phase-note" class="form-input">${esc(p.note)}</textarea><p class="form-hint">Предыдущий период завершится, когда начнётся новый. Один замер может относиться только к одному периоду.</p><div class="error-box" id="modal-error" role="alert"></div>${id!==null?'<button class="danger-button" data-action="delete-phase" data-id="'+id+'">Удалить период</button>':''}`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="save-phase">Сохранить</button>`);
  }
  function keypad(index,field){modal={type:'keypad',index,field,value:String(ui.entry.readings[index][field]),replace:true};const labels={systolic:'Верхнее давление',diastolic:'Нижнее давление',pulse:'Пульс'};showModal(labels[field],`<p style="text-align:center">${field==='systolic'?'60–260 мм рт. ст.':field==='diastolic'?'35–160 мм рт. ст.':'30–220 уд/мин'}</p><div id="keypad-value" class="keypad-value" data-metric="${field}" aria-live="polite">${modal.value||'—'}</div><div class="keypad-grid">${['1','2','3','4','5','6','7','8','9','clear','0','erase'].map(k=>`<button data-action="digit" data-value="${k}" ${k==='clear'?'class="small"':''} ${k==='erase'?'aria-label="Стереть цифру"':''}>${k==='clear'?'Очистить':k==='erase'?I('erase'):k}</button>`).join('')}</div>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="accept-keypad">Готово</button>`);}
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
    }catch(error){ui.error=error instanceof RangeError?'Укажите дату и время каждого замера.':error.message;const el=$('entry-error');el.textContent=ui.error;el.scrollIntoView({block:'nearest'});}
  }
  function download(name,content,type='application/json'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob);closeModal();modal={type:'download',url};showModal('Файл готов',`<div class="card"><div class="row">${I('file')}<strong class="grow" style="overflow-wrap:anywhere">${esc(name)}</strong></div><p style="margin:15px 0 0">${num(blob.size/1024,1)} КБ · ${type.includes('spreadsheet')?'Excel, три листа':'резервная копия JSON'}</p></div><p>Сохраните файл на устройстве, чтобы он всегда был под рукой.</p>`,`<button class="secondary" data-action="close-modal">Закрыть</button><a class="measure-cta" href="${url}" download="${esc(name)}" data-action="download-ready">${I('download')}Скачать файл</a>`);}
  function exportJSON(){if(!state.sessions.length){toast('Нет измерений для экспорта.');return;}download('davlenie-'+theme+'-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(M.backup(state),null,2));}
  function exportXLSX(){
    if(!state.sessions.length){toast('Нет измерений для экспорта.');return;}
    try{
      if(!window.XLSX)throw Error('Библиотека Excel не загрузилась.');
      const workbook=XLSX.utils.book_new();
      const sheets=[['Измерения',[['Дата и время','Верхнее, мм рт. ст.','Нижнее, мм рт. ст.','Пульс, уд/мин','Самочувствие, 1–10','Тип','Замеров','Отметки','Заметка','Период'],...M.filter(state.sessions).map(s=>{const v=M.summary(s);return [full(s.measuredAt),v.averages.systolic,v.averages.diastolic,v.averages.pulse,s.wellbeing,s.mode==='series'?'Серия':'Один замер',s.readings.length,s.tags.join('; '),s.note,M.phaseFor(s,state.phases)?.title||''];})]],['Замеры',[['Номер записи','Замер','Дата и время','Верхнее, мм рт. ст.','Нижнее, мм рт. ст.','Пульс, уд/мин'],...M.filter(state.sessions).flatMap(s=>s.readings.map((r,i)=>[s.id,i+1,full(r.measuredAt),r.systolic,r.diastolic,r.pulse]))]],['Периоды',[['Название','Тип','Начало','Конец','Заметка','Записей','Верхнее, мм рт. ст.','Нижнее, мм рт. ст.','Пульс, уд/мин','Самочувствие'],...state.phases.map(p=>{const s=M.stats(state.sessions.filter(m=>M.inside(m,p)));return [p.title,kind(p).label,full(p.startedAt),p.endedAt?full(p.endedAt):'Идёт сейчас',p.note,s.count,s.count?s.averages.systolic:'',s.count?s.averages.diastolic:'',s.count?s.averages.pulse:'',s.count?s.averages.wellbeing:''];})]]];
      sheets.forEach(([name,rows])=>{const sheet=XLSX.utils.aoa_to_sheet(rows);sheet['!cols']=rows[0].map((_,i)=>({wch:i===0?29:20}));sheet['!autofilter']={ref:sheet['!ref']};XLSX.utils.book_append_sheet(workbook,sheet,name);});
      download('davlenie-'+theme+'.xlsx',XLSX.write(workbook,{bookType:'xlsx',type:'array'}),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }catch(error){toast('Экспорт не выполнен: '+error.message);}
  }
  function copiesModal(){modal={type:'copies'};showModal('Сохранённые копии',`<p>Здесь хранятся последняя копия и копии за семь дней. Выберите нужную, чтобы скачать или восстановить дневник.</p>${state.copies.length?state.copies.map((c,i)=>`<div class="card"><div class="row between"><strong>${i===0?'Последняя · ':''}${esc(c.date)}</strong><span class="small muted">${recs(c.payload.sessions.length)}</span></div><div class="sheet-actions"><button class="secondary" data-action="download-copy" data-index="${i}">${I('download')}Скачать</button><button class="secondary" data-action="restore-copy" data-index="${i}">Восстановить</button></div></div>`).join(''):empty('Копий пока нет','Сохраните измерение или включите автоматическую копию.')}`);}
  function restorePreview(payload){try{const parsed=M.restore(payload,state.phases);modal={type:'restore',parsed};showModal('Восстановить дневник?',`<p>В копии: <strong>${recs(parsed.sessions.length)}</strong>, периодов: <strong>${parsed.phases.length}</strong>.</p><p>Записи в этом варианте заменятся данными из копии. Восстановление можно отменить.</p>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="restore-confirm">Восстановить</button>`);}catch(error){modal={type:'error'};showModal('Не удалось восстановить копию',`<p>${esc(error.message)}</p><p>Ваши текущие записи сохранены.</p>`,`<button class="measure-cta" data-action="close-modal">Понятно</button>`);}}
  $('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{restorePreview(JSON.parse(await file.text()));}catch{modal={type:'error'};showModal('Не удалось прочитать',`<p>Выберите резервную копию JSON приложения «Давление».</p>`,`<button class="measure-cta" data-action="close-modal">Понятно</button>`);}event.target.value='';});
  document.addEventListener('input',event=>{
    const target=event.target;
    if(theme==='clarity'&&modal?.type==='filters'&&target.closest('.history-filter-form')){
      readHistoryFilterFields();
      if(target.id==='filter-from'||target.id==='filter-to')modal.filters.interval=modal.filters.from||modal.filters.to?'custom':'all';
      updateHistoryFilterPreview();return;
    }
    if(target.dataset.sessionNote){
      try{persist(M.withSessionNote(state,Number(target.dataset.sessionNote),target.value));}
      catch(error){storageError='Не удалось сохранить заметку: '+error.message;warn();}
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
  });
  document.addEventListener('change',event=>{const target=event.target;if(theme==='clarity'&&modal?.type==='filters'&&target.closest('.history-filter-form')){readHistoryFilterFields();if(target.id==='filter-from'||target.id==='filter-to')modal.filters.interval=modal.filters.from||modal.filters.to?'custom':'all';updateHistoryFilterPreview();return;}if(target.dataset.change==='scope'){ui.scope=target.value;ui.chartSelection={};render();}if(target.dataset.change==='phase-open')$('phase-end-wrap').hidden=target.checked;});
  function action(target){
    const a=target.dataset.action;
    switch(a){
      case 'nav':navigate(target.dataset.view);break;
      case 'back':navigate(ui.view==='phase'?'phases':ui.view==='entry'?'home':ui.view==='detail'?ui.detailReturn:'history');break;
      case 'detail':closeModal();navigate('detail',+target.dataset.id);break;
      case 'phase':navigate('phase',+target.dataset.id);break;
      case 'new':ui.entry=M.resumeDraft(state);ui.readingValidation=false;navigate('entry');break;
      case 'resume-draft':{const draft=M.resumableDraft(state);if(draft&&persist(M.storeDraft(state,draft),false)){ui.entry=draft;ui.readingValidation=false;navigate('entry');}break;}
      case 'entry-datetime':entryDateTime(+target.dataset.index);break;
      case 'calendar-month':{const calendar=modal.type==='filters'?modal.calendar:modal;calendar.month=new Date(calendar.month.getFullYear(),calendar.month.getMonth()+Number(target.dataset.step),1);updateCalendar();break;}
      case 'calendar-day':if(modal.type==='filters')acceptHistoryFilterDate(target.dataset.value);else{modal.day=target.dataset.value;const day=new Date(modal.day+'T12:00');modal.month=new Date(day.getFullYear(),day.getMonth(),1);updateCalendar();}break;
      case 'calendar-today':{const today=new Date();if(modal.type==='filters')acceptHistoryFilterDate(local(today).slice(0,10));else{modal.day=local(today).slice(0,10);modal.month=new Date(today.getFullYear(),today.getMonth(),1);updateCalendar();}break;}
      case 'time-value':selectTimeValue(target.dataset.field,+target.dataset.value,true);break;
      case 'accept-datetime':{
        const index=modal.index,scroll=$('app-content').scrollTop;
        // Use the visible wheel positions even when a scroll debounce is still pending.
        const wheelValue=field=>Math.max(0,Math.min(field==='hour'?23:59,Math.round($('modal').querySelector(`[data-wheel="${field}"]`).scrollTop/40)));
        ui.entry.readings[index].measuredAt=modal.day+'T'+twoDigits(wheelValue('hour'))+':'+twoDigits(wheelValue('minute'));
        ui.entry.readings[index].timeSource='manual';
        saveDraft();closeModal();render();$('app-content').scrollTop=scroll;
        $('app-content').querySelector(`[data-action="entry-datetime"][data-index="${index}"]`)?.focus({preventScroll:true});
        break;
      }
      case 'close-modal':closeModal();break;
      case 'filters':filtersModal();break;
      case 'reset-filters':ui.filters=defaultHistoryFilters();ui.limit=30;render();break;
      case 'remove-history-filter':{
        const fields={dates:['from','to','interval'],mode:['mode'],phase:['phaseId'],wellbeing:['wellbeingMin','wellbeingMax'],tags:['tags'],note:['withNote'],sort:['sort']},defaults=defaultHistoryFilters();
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
        if(theme==='clarity'){readHistoryFilterFields();updateHistoryFilterPreview();const errors=historyFilterErrors(modal.filters);if(errors.dateError||errors.scoreError)break;ui.filters=M.clone(modal.filters);}
        else{const from=$('filter-from').value,to=$('filter-to').value;if(from&&to&&from>to){$('modal-error').textContent='Дата начала должна быть раньше даты окончания или совпадать с ней.';break;}ui.filters={sort:$('filter-sort').value,from,to};}
        ui.limit=30;closeModal();render();break;
      }
      case 'load-more':{const scroll=$('app-content').scrollTop;ui.limit+=30;render();$('app-content').scrollTop=scroll;break;}
      case 'period':ui.period=target.dataset.value;ui.chartSelection={};render();break;
      case 'metric':ui.metric=target.dataset.value;ui.chartSelection={};render();break;
      case 'chart-point':{
        const chart=target.dataset.chart,index=+target.dataset.point;
        if(theme==='clarity'&&chart==='home'){
          const point=chartData[chart]?.points[index];if(point)navigate('detail',point.id);
        }else selectPoint(chart,index);
        break;
      }
      case 'chart-table':{const d=chartData[target.dataset.chart];modal={type:'records'};showModal('Значения графика',`<p>${esc(d.title)} · ${recs(d.items.length)}. Здесь показаны все измерения.</p>${M.filter(d.items).map(recordCard).join('')||empty('Нет данных','Выберите другой интервал.')}`);break;}
      case 'point-records':{const d=chartData[target.dataset.chart],p=d.points[+target.dataset.point];if(p.count===1)navigate('detail',p.id);else {modal={type:'records'};showModal('Исходные записи',`<p>${date(p.from)} — ${date(p.to)}</p>${d.items.filter(s=>p.ids.includes(s.id)).map(recordCard).join('')}`);}break;}
      case 'entry-mode':{const mode=target.dataset.value;if(mode===ui.entry.mode)break;const next=M.switchDraft(state,ui.entry,mode);if(persist(next,false)){ui.entry=M.resumeDraft(state);ui.error='';ui.readingValidation=false;render();}break;}
      case 'add-reading':if(ui.entry.readings.length<M.MAX_SERIES_READINGS){ui.entry.readings.push(newReading());saveDraft();render();}break;
      case 'remove-reading':{const before=M.clone(state);ui.entry.readings.splice(+target.dataset.index,1);saveDraft();ui.undo=before;render();toast('Замер удалён из черновика',true);break;}
      case 'tag':{const t=target.dataset.tag;ui.entry.tags=ui.entry.tags.includes(t)?ui.entry.tags.filter(x=>x!==t):[...ui.entry.tags,t];target.classList.toggle('active',ui.entry.tags.includes(t));target.setAttribute('aria-pressed',String(ui.entry.tags.includes(t)));saveDraft();break;}
      case 'keypad':keypad(+target.dataset.index,target.dataset.key);break;
      case 'digit':{const k=target.dataset.value;if(k==='clear'){modal.value='';modal.replace=false;}else if(k==='erase'){modal.value=modal.value.slice(0,-1);modal.replace=false;}else{if(modal.replace){modal.value='';modal.replace=false;}if(modal.value.length<3)modal.value+=k;}$('keypad-value').textContent=modal.value||'—';break;}
      case 'accept-keypad':ui.entry.readings[modal.index]=M.readingWithInput(ui.entry.readings[modal.index],modal.field,modal.value);saveDraft();closeModal();render();break;
      case 'save-entry':saveEntry();break;
      case 'discard-draft':confirm('Удалить черновик','При удалении черновика все введенные в нем данные также удалятся.',()=>{const next=M.clearDraft(state,ui.entry.mode);if(persist(next)){ui.entry=null;ui.undo=null;clearTimeout(toastTimer);$('toast').hidden=true;navigate('home');}},'Удалить черновик');break;
      case 'edit-note':{const item=state.sessions.find(s=>s.id===+target.dataset.id);modal={type:'note',id:item.id};showModal('Заметка к измерению',`<label class="form-label" for="note-editor">Текст заметки</label><textarea id="note-editor" class="form-input" style="min-height:170px">${esc(item.note)}</textarea>`,`<button class="secondary" data-action="close-modal">Отмена</button><button class="measure-cta" data-action="save-note">Сохранить</button>`);break;}
      case 'save-note':{const next=M.clone(state);next.sessions.find(s=>s.id===modal.id).note=$('note-editor').value.trim();if(persist(next)){closeModal();render();toast('Заметка сохранена');}break;}
      case 'phase-editor':phaseEditor(target.dataset.id?+target.dataset.id:null);break;
      case 'save-phase':try{const input={title:$('phase-title').value,kind:$('phase-kind').value,startedAt:new Date($('phase-start').value).toISOString(),endedAt:$('phase-open').checked?null:new Date($('phase-end').value).toISOString(),note:$('phase-note').value};const next=M.clone(state);next.phases=M.savePhase(state.phases,input,modal.id);if(persist(next)){closeModal();render();toast('Период сохранён');}}catch(error){$('modal-error').textContent=error instanceof RangeError?'Проверьте даты периода.':error.message;}break;
      case 'delete-phase':{const id=+target.dataset.id;confirm('Удалить период?','Измерения останутся в дневнике. Удаление периода можно отменить.',()=>{const next=M.clone(state);next.phases=next.phases.filter(p=>p.id!==id);if(mutation(next,'Период удалён'))navigate('phases');},'Удалить');break;}
      case 'auto-backup':{const next=M.clone(state);next.autoBackup=!next.autoBackup;if(persist(next)){render();toast(next.autoBackup?'Автокопия включена':'Автокопия выключена');}break;}
      case 'copies':copiesModal();break;
      case 'download-copy':{const c=state.copies[+target.dataset.index];download('davlenie-copy-'+c.date+'.json',JSON.stringify(c.payload,null,2));toast('Копия скачана');break;}
      case 'restore-copy':restorePreview(state.copies[+target.dataset.index].payload);break;
      case 'export-json':exportJSON();break;
      case 'export-xlsx':exportXLSX();break;
      case 'download-ready':toast('Скачивание начато');break;
      case 'import':$('import-file').click();break;
      case 'restore-confirm':{const next=M.clone(state);next.sessions=modal.parsed.sessions;next.phases=modal.parsed.phases;next.draft=null;next.drafts={single:null,series:null};next.draftMode='single';if(mutation(next,'Дневник восстановлен')){closeModal();ui.entry=null;ui.chartSelection={};render();}break;}
      case 'clear':confirm('Удалить все измерения?',`${recs(state.sessions.length)} будут удалены из этого варианта. Периоды и резервные копии сохранятся. Действие можно отменить.`,()=>{const next=M.clone(state);next.sessions=[];if(mutation(next,'Измерения удалены'))render();},'Удалить');break;
      case 'confirm':{const fn=modal.action;closeModal();fn();break;}
      case 'undo':if(ui.undo){const previous=M.clone(ui.undo);if(persist(previous,false)){ui.undo=null;ui.entry=state.draft?M.clone(state.draft):null;if(ui.view==='entry'&&!ui.entry)ui.entry=newDraft();render();toast('Изменение отменено');}}break;
      case 'about':modal={type:'about'};showModal(concept.name,`<p>${concept.description}</p><p><strong>Все функции:</strong> одиночный замер и серия 2–10; время каждого замера; самочувствие 1–10; 16 отметок; заметки; история с 8 сортировками и датами; три графика; интервалы 7/30/90 дней и все записи; периоды, их редактирование, удаление и сравнение; Excel и JSON; восстановление и автокопии.</p><p>Это рабочий веб-аналог. Данные сохраняются в браузере отдельно от мобильного приложения. Тактильный отклик и системное меню «Поделиться» заменены браузерными действиями скачивания.</p>`,`<button class="measure-cta" data-action="close-modal">Понятно</button>`);break;
    }
  }
  document.addEventListener('click',event=>{if(modal?.type==='filters'&&theme==='clarity'&&!event.target.closest('.history-select,.history-filter-dates,.history-calendar-panel'))closeHistoryFilterPopovers();const target=event.target.closest('[data-action]');if(target)action(target);else if(event.target===$('modal'))closeModal();});
  document.addEventListener('pointerdown',()=>{document.body.dataset.inputMode='pointer';});
  document.addEventListener('keydown',()=>{document.body.dataset.inputMode='keyboard';});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&modal){if(!closeHistoryFilterPopovers(true))closeModal();return;}
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
  readRoute();
})();
