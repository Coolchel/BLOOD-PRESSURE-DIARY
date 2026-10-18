(function(root){
  'use strict';
  const catalog=typeof module==='object'&&module.exports?require('./translations.js'):root.DiaryTranslations;
  const languages=[{code:'ru',name:'Русский',locale:'ru-RU'},{code:'en',name:'English',locale:'en-GB'},{code:'fr',name:'Français',locale:'fr-FR'},{code:'es',name:'Español',locale:'es-ES'},{code:'de',name:'Deutsch',locale:'de-DE'}];
  const valid=code=>languages.some(language=>language.code===code);
  function systemLanguage(locale){
    const code=typeof locale==='string'?locale.trim().split(/[-_]/)[0].toLowerCase():'';
    return valid(code)?code:'en';
  }
  function orderedLanguages(current){
    return [...languages.filter(language=>language.code===current),...languages.filter(language=>language.code!==current)];
  }
  function normalize(source){
    const tokens=new Map();
    const text=source.replace(/\{\{(\d+)\}\}/g,(token)=>{if(!tokens.has(token))tokens.set(token,'{{'+tokens.size+'}}');return tokens.get(token);});
    return {text,tokens};
  }
  function create(language='en'){
    let code=valid(language)?language:'en';
    function translate(source){
      source=String(source??'');if(code==='ru')return source;
      const trimmed=source.trim(),normalized=normalize(trimmed),entry=catalog[normalized.text];
      if(!entry){
        // Model validation can join two independently translated sentences.
        const first=trimmed.match(/^(.+?\.)\s+(?=[А-ЯЁ])/u);
        return first&&catalog[normalize(first[1]).text]
          ?source.replace(trimmed,translate(first[1])+' '+translate(trimmed.slice(first[0].length))):source;
      }
      const originalTokens=new Map([...normalized.tokens].map(([original,local])=>[local,original]));
      const result=entry[code].replace(/\{\{\d+\}\}/g,token=>originalTokens.get(token)||token);
      return source.slice(0,source.indexOf(trimmed))+result+source.slice(source.indexOf(trimmed)+trimmed.length);
    }
    function template(strings,values,translateSource){
      const source=strings.reduce((text,part,i)=>text+(i?'{{'+(i-1)+'}}':'')+part,'');
      // Only developer-authored literal parts are translated. Interpolated notes,
      // period titles, canonical tag values and escaped HTML are never inspected.
      return translateSource(source).replace(/\{\{(\d+)\}\}/g,(_,index)=>String(values[Number(index)]??''));
    }
    function text(source,...values){return Array.isArray(source)?template(source,values,translate):translate(source);}
    function htmlSource(source){
      return source.replace(/<[^>]*>|[^<]+/g,part=>part.startsWith('<')
        ?part.replace(/((?:aria-label|title|placeholder)=")([^"]*)(")/g,(_,start,value,end)=>start+translate(value)+end)
        :translate(part));
    }
    function html(source,...values){return Array.isArray(source)?template(source,values,htmlSource):htmlSource(String(source));}
    const nouns={
      records:{ru:['запись','записи','записей'],en:['record','records'],fr:['mesure','mesures'],es:['registro','registros'],de:['Eintrag','Einträge']},
      periods:{ru:['период','периода','периодов'],en:['period','periods'],fr:['période','périodes'],es:['período','períodos'],de:['Zeitraum','Zeiträume']},
      readings:{ru:['замер','замера','замеров'],en:['reading','readings'],fr:['relevé','relevés'],es:['medición','mediciones'],de:['Messung','Messungen']},
    };
    function pluralCategory(value){
      if(typeof Intl!=='undefined'&&typeof Intl.PluralRules==='function')return new Intl.PluralRules(api.locale).select(value);
      // Some native runtimes format numbers and dates but do not provide
      // PluralRules. Keep the cardinal forms for the app's five languages local.
      const number=Math.abs(Number(value));
      if(code==='ru'){
        if(!Number.isInteger(number))return 'other';
        const last=number%10,lastTwo=number%100;
        if(last===1&&lastTwo!==11)return 'one';
        if(last>=2&&last<=4&&(lastTwo<12||lastTwo>14))return 'few';
        return 'other';
      }
      return (code==='fr'?number<2:number===1)?'one':'other';
    }
    // The app's own name: «Давление» in Russian, Pressure Diary in every other language. It differs from
    // the «Давление» metric label outside Russian, so it cannot share that catalog key.
    const appNames={ru:'Давление',en:'Pressure Diary',fr:'Pressure Diary',es:'Pressure Diary',de:'Pressure Diary'};
    const api={
      text,html,
      appName(){return appNames[code]||translate('Давление');},
      get language(){return code;},
      get locale(){return languages.find(language=>language.code===code).locale;},
      setLanguage(value){if(!valid(value))throw Error('Unsupported language');code=value;},
      number(value,decimals=0){return Number(value).toLocaleString(api.locale,{maximumFractionDigits:decimals});},
      date(value,options){return new Intl.DateTimeFormat(api.locale,{...options,hourCycle:'h23'}).format(new Date(value));},
      count(value,unit){
        const category=pluralCategory(value),words=nouns[unit][code];
        const index=code==='ru'?(category==='one'?0:category==='few'?1:2):category==='one'?0:1;
        return api.number(value)+' '+words[index];
      },
    };
    return api;
  }
  function savedLanguage(raw){
    try{const saved=JSON.parse(raw);return saved?.version===1&&valid(saved.language)?saved.language:null;}
    catch{return null;}
  }
  function loadLanguage(storage,key,locale){
    try{return savedLanguage(storage.getItem(key))||systemLanguage(locale);}
    catch{return systemLanguage(locale);}
  }
  function saveLanguage(storage,key,language){
    if(!valid(language))throw Error('Unsupported language');
    storage.setItem(key,JSON.stringify({version:1,language}));
  }
  const api={create,languages,loadLanguage,saveLanguage,normalize,systemLanguage,orderedLanguages,savedLanguage};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.DiaryI18n=api;
})(typeof window==='object'?window:globalThis);
