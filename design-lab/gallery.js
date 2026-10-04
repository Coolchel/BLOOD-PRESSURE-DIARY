(() => {
  const names={calm:'Тихий ритм',coral:'Коралл',night:'Ночной пульс',clarity:'Ясно'};
  const frame=document.getElementById('phone-preview');
  document.addEventListener('pointerdown',()=>{document.body.dataset.inputMode='pointer';});
  document.addEventListener('keydown',()=>{document.body.dataset.inputMode='keyboard';});
  const screens={360:780,390:844,402:874,430:932};
  let width=402;
  function sizePreview(){const scale=Math.min(1,(frame.clientWidth-24)/(width+14));frame.style.height=(Math.ceil((screens[width]+14)*scale)+24)+'px';document.getElementById('screen-size').textContent=(width===402?'iPhone 17 Pro · ':'')+width+' × '+screens[width];}
  function setVariant(key){
    if(!names[key])return;
    document.querySelectorAll('[data-variant]').forEach(b=>{b.classList.toggle('selected',b.dataset.variant===key);b.setAttribute('aria-pressed',String(b.dataset.variant===key));});
    document.getElementById('concept-name').textContent=names[key];
    document.getElementById('open-standalone').href=key+'.html';
    frame.src=key+'.html?embed=1&width='+width;
    frame.title=names[key]+' — рабочий аналог приложения';
    history.replaceState(null,'','#'+key);
  }
  document.querySelectorAll('[data-variant]').forEach(b=>b.addEventListener('click',()=>setVariant(b.dataset.variant)));
  document.querySelectorAll('[data-width]').forEach(b=>b.addEventListener('click',()=>{
    width=Number(b.dataset.width);
    sizePreview();
    document.querySelectorAll('[data-width]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});
    frame.contentWindow.postMessage({type:'diary-width',width},location.protocol==='file:'?'*':location.origin);
  }));
  sizePreview();
  window.addEventListener('resize',sizePreview);
  setVariant(names[location.hash.slice(1)]?location.hash.slice(1):'clarity');
})();
