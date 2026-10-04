(() => {
  'use strict';
  const names={current:'Исходный вариант',inter:'Inter',manrope:'Manrope',golostext:'Golos Text',nunitosans:'Nunito Sans'};
  const frame=document.getElementById('phone-preview');
  const screens={360:780,390:844,402:874,430:932};
  const requested=new URLSearchParams(location.search).get('font');
  let selected=Object.hasOwn(names,requested)?requested:'manrope',width=402;
  const origin=location.protocol==='file:'?'*':location.origin;
  function sendPreferences(){
    frame.contentWindow.postMessage({type:'diary-font',font:selected},origin);
    frame.contentWindow.postMessage({type:'diary-width',width},origin);
  }
  function selectFont(font){
    if(!Object.hasOwn(names,font))return;
    selected=font;
    document.querySelectorAll('.font-option').forEach(button=>{const active=button.dataset.font===font;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    document.getElementById('font-name').textContent=names[font];
    document.getElementById('open-font').href='clarity.html'+(font==='manrope'?'':'?font='+font);
    const url=new URL(location.href);if(font==='manrope')url.searchParams.delete('font');else url.searchParams.set('font',font);history.replaceState(null,'',url);
    sendPreferences();
  }
  function sizePreview(){
    const scale=Math.min(1,(frame.clientWidth-24)/(width+14));
    frame.style.height=(Math.ceil((screens[width]+14)*scale)+24)+'px';
    document.getElementById('screen-size').textContent=(width===402?'iPhone 17 Pro · ':'')+width+' × '+screens[width];
  }
  document.addEventListener('pointerdown',()=>{document.body.dataset.inputMode='pointer';});
  document.addEventListener('keydown',()=>{document.body.dataset.inputMode='keyboard';});
  document.querySelectorAll('.font-option').forEach(button=>button.addEventListener('click',()=>selectFont(button.dataset.font)));
  document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>{
    width=Number(button.dataset.width);sizePreview();sendPreferences();
    document.querySelectorAll('[data-width]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});
  }));
  frame.addEventListener('load',sendPreferences);
  window.addEventListener('resize',sizePreview);
  sizePreview();selectFont(selected);
})();
