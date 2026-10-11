const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const ts=require('typescript');
const I=require('../i18n.js');
const catalog=require('../translations.js');
const {resetStoredDiary}=require('../file-actions.js');

test('all UI entries have complete text in all four translations and preserve every placeholder',()=>{
  for(const [source,translations] of Object.entries(catalog)){
    const placeholders=text=>[...new Set(text.match(/\{\{\d+\}\}/g)||[])].sort();
    for(const language of ['en','fr','es','de']){
      assert.equal(typeof translations[language],'string',source);
      assert.ok(translations[language].trim(),source);
      assert.doesNotMatch(translations[language],/[А-Яа-яЁё]/,source);
      assert.deepEqual(placeholders(translations[language]),placeholders(source),source);
    }
  }
});

test('HTML translation protects interpolated diary text, escaped attributes and canonical tag values',()=>{
  const en=I.create('en'),fr=I.create('fr');
  const title='Давление',note='Настройки <текст> {{0}}';
  const build=language=>language.html`<div><strong>Заметка</strong><p>${note}</p><button data-tag="${title}" title="${title}" aria-label="Измерение ${'10 October'}, ${120} на ${80}">${title}</button></div>`;
  for(const language of [en,fr,I.create('es'),I.create('de')]){
    const result=build(language);
    assert.ok(result.includes('<p>'+note+'</p>'));
    assert.ok(result.includes('data-tag="Давление" title="Давление"'));
    assert.ok(result.includes('>Давление</button>'));
    assert.ok(!result.includes('aria-label="Измерение'));
    assert.ok(!result.includes('<strong>Заметка'));
  }
});

test('source interpolation indices are local to each translated phrase, including repeated tokens',()=>{
  const en=I.create('en');
  assert.equal(en.html`<span>${'<svg></svg>'}История ${'1'}</span>`, '<span><svg></svg>History 1</span>');
  assert.equal(en.html`<i>${'unchanged'}</i><span>Измерение ${'today'}, ${120} на ${80}</span>`, '<i>unchanged</i><span>Measurement today, 120 over 80</span>');
  assert.equal(en.text('  Пульс  '),'  Pulse  ');
  assert.equal(en.text('User note in an unknown language'),'User note in an unknown language');
});

test('language choices update the same translation instance and persist independently of diary data',()=>{
  const values=new Map([['diary','unchanged diary'],['statistics','unchanged statistics']]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const locale=I.create('ru');assert.equal(locale.text('Настройки'),'Настройки');
  const labels={ru:'Настройки',en:'Settings',fr:'Réglages',es:'Ajustes',de:'Einstellungen'};
  for(const code of ['en','fr','es','de','ru']){
    I.saveLanguage(storage,'language',code);locale.setLanguage(I.loadLanguage(storage,'language'));
    assert.equal(locale.language,code);
    assert.equal(locale.text('Настройки'),labels[code]);
    assert.equal(values.get('diary'),'unchanged diary');assert.equal(values.get('statistics'),'unchanged statistics');
  }
  assert.throws(()=>I.saveLanguage(storage,'language','it'));
  const before=values.get('language');
  assert.throws(()=>I.saveLanguage({...storage,setItem:()=>{throw Error('quota');}},'language','en'));
  assert.equal(values.get('language'),before);
});

test('invalid and unavailable preferences use the system language, with English fallback and no storage writes',()=>{
  for(const raw of [null,'invalid',JSON.stringify({version:2,language:'en'}),JSON.stringify({version:1,language:'it'})]){
    assert.equal(I.loadLanguage({getItem:()=>raw},'language','es-MX'),'es');
    assert.equal(I.loadLanguage({getItem:()=>raw},'language','it-IT'),'en');
    assert.equal(I.loadLanguage({getItem:()=>raw},'language'),'en');
  }
  assert.equal(I.loadLanguage({getItem:()=>{throw Error('unavailable');}},'language','de-CH'),'de');
});

test('system languages match regional tags; manual choice overrides the system after relaunch',()=>{
  for(const [tag,expected] of [['ru-RU','ru'],['en-US','en'],['fr-CA','fr'],['es-419','es'],['de-CH','de'],['DE_at','de'],[' it-IT ','en'],['zh-Hans-CN','en'],[null,'en']]){
    assert.equal(I.systemLanguage(tag),expected);
  }
  const storage={getItem:()=>JSON.stringify({version:1,language:'fr'})};
  assert.equal(I.loadLanguage(storage,'language','de-DE'),'fr');
});

test('the selected language is always first without reordering other options or mutating the catalog',()=>{
  const original=I.languages.map(option=>option.code);
  for(const current of original){
    assert.deepEqual(I.orderedLanguages(current).map(option=>option.code),[current,...original.filter(code=>code!==current)]);
    assert.equal(new Set(I.orderedLanguages(current).map(option=>option.code)).size,5);
  }
  assert.deepEqual(I.languages.map(option=>option.code),original);
});

test('numbers, plural counts and calendar dates use the selected locale while time remains 24-hour',()=>{
  const ru=I.create('ru'),en=I.create('en'),fr=I.create('fr'),es=I.create('es'),de=I.create('de');
  assert.equal(ru.number(121.7,1),'121,7');assert.equal(en.number(121.7,1),'121.7');assert.equal(fr.number(121.7,1),'121,7');
  assert.equal(ru.count(21,'records'),'21 запись');assert.equal(ru.count(12,'readings'),'12 замеров');
  assert.equal(en.count(1,'records'),'1 record');assert.equal(en.count(2,'records'),'2 records');
  assert.equal(fr.count(1,'periods'),'1 période');assert.equal(fr.count(3,'periods'),'3 périodes');
  assert.equal(es.count(1,'readings'),'1 medición');assert.equal(es.count(3,'readings'),'3 mediciones');
  assert.equal(de.count(1,'records'),'1 Eintrag');assert.equal(de.count(2,'records'),'2 Einträge');
  assert.equal(es.number(121.7,1),'121,7');assert.equal(de.number(121.7,1),'121,7');
  const day=new Date(2026,9,10,22,15);
  assert.match(en.date(day,{month:'long',year:'numeric'}),/October 2026/);
  assert.match(fr.date(day,{month:'long',year:'numeric'}),/octobre 2026/);
  assert.match(es.date(day,{month:'long',year:'numeric'}),/octubre de 2026/);
  assert.match(de.date(day,{month:'long',year:'numeric'}),/Oktober 2026/);
  for(const locale of [ru,en,fr,es,de])assert.equal(locale.date(day,{hour:'2-digit',minute:'2-digit'}),'22:15');
});

test('model validation sentences translate together without changing canonical model errors',()=>{
  const original='Введите пульс. Верхнее: 60–260; нижнее: 35–160; пульс: 30–220. Верхнее должно быть больше нижнего.';
  const text=I.create('fr').text(original);
  assert.doesNotMatch(text,/[А-Яа-яЁё]/);assert.match(text,/Saisissez le pouls/);
});

test('factory reset clears language and statistics together and restores both when diary write fails',()=>{
  const values=new Map([['diary','previous diary'],['statistics','median'],['language','French']]);
  let fail=true;
  const storage={getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key),setItem:(key,value)=>{
    if(key==='diary'&&fail)throw Error('quota');values.set(key,value);
  }};
  assert.throws(()=>resetStoredDiary(storage,'diary',['statistics','language'],{}),/quota/);
  assert.equal(values.get('statistics'),'median');assert.equal(values.get('language'),'French');assert.equal(values.get('diary'),'previous diary');
  fail=false;resetStoredDiary(storage,'diary',['statistics','language'],{});
  assert.equal(values.has('statistics'),false);assert.equal(values.has('language'),false);assert.equal(values.get('diary'),'{}');
});

test('all explicit interface literals and translated HTML fragments are covered by the catalog',()=>{
  const files=[path.join(__dirname,'../app.js')];
  for(const directory of ['app','components','localization','constants']){
    const root=path.join(__dirname,'../..',directory);
    files.push(...fs.readdirSync(root,{recursive:true}).filter(file=>/\.tsx?$/.test(file)).map(file=>path.join(root,file)));
  }
  const missing=[];
  const check=text=>{const normalized=I.normalize(text.trim()).text;if(/[А-Яа-яЁё]/.test(text)&&!Object.hasOwn(catalog,normalized))missing.push(text);};
  const checkHTML=text=>{
    for(const part of text.match(/<[^>]*>|[^<]+/g)||[]){
      if(part.startsWith('<')){for(const attribute of part.matchAll(/(?:aria-label|title|placeholder)="([^"]*)"/g))check(attribute[1]);}
      else check(part);
    }
  };
  for(const file of files){
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.js')?ts.ScriptKind.JS:ts.ScriptKind.TSX);
  function visit(node){
    if(ts.isCallExpression(node)&&['tr','html'].includes(node.expression.getText(source))){
      const argument=node.arguments[0];
      if(argument&&(ts.isStringLiteral(argument)||ts.isNoSubstitutionTemplateLiteral(argument))) (node.expression.getText(source)==='tr'?check:checkHTML)(argument.text);
    }
    if(ts.isTaggedTemplateExpression(node)&&['tr','html'].includes(node.tag.getText(source))){
      const template=node.template;
      const text=ts.isNoSubstitutionTemplateLiteral(template)?template.text:template.head.text+template.templateSpans.map((span,i)=>'{{'+i+'}}'+span.literal.text).join('');
      (node.tag.getText(source)==='tr'?check:checkHTML)(text);
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
  }
  assert.deepEqual([...new Set(missing)],[]);
});

test('static native choices and errors are translated while canonical tags and backup identifiers remain Russian',()=>{
  const sources=['components/measurement-entry.tsx','components/history-filters.tsx','constants/history-filters.ts','constants/statistics-data.ts','types/experiment.ts'];
  const root=path.join(__dirname,'../..');
  const missing=[];
  for(const file of sources){
    const source=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    function visit(node){
      if(ts.isPropertyAssignment(node)&&['title','label','unit','hint'].includes(node.name.getText(source))&&ts.isStringLiteral(node.initializer)&&/[А-Яа-яЁё]/.test(node.initializer.text)){
        if(!catalog[node.initializer.text])missing.push(node.initializer.text);
      }
      ts.forEachChild(node,visit);
    }
    visit(source);
  }
  assert.deepEqual(missing,[]);
  for(const code of ['en','fr','es','de']){
    const locale=I.create(code);
    assert.doesNotMatch(locale.text('Систолическое давление'),/[А-Яа-яЁё]/);
    assert.doesNotMatch(locale.text('После кофе'),/[А-Яа-яЁё]/);
    assert.ok(locale.html`<p>${'Настройки'}</p>`.includes('Настройки'));
  }
});
