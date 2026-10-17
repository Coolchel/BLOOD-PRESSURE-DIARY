const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');
const ts = require('typescript');

// Run the actual data functions against SQLite without starting Expo or touching user data.
const root = path.resolve(__dirname, '..');
const modules = new Map();
const files = new Map();
let failFileWrite = false;
let failFileDelete = false;
const sharedFiles = [];
let sharingAvailable = true;
let shareFailure = null;
const documentDirectory = { uri:'file:///documents/', list: () => [...files.keys()].filter(name=>!name.includes('::')).map((name) => new FakeFile(documentDirectory, name)) };
class FakeFile {
  constructor(directory, name) {
    this.name = name;
    this.key = directory.uri === documentDirectory.uri ? name : directory.uri+'::'+name;
    this.uri = directory.uri+'/'+name;
  }
  get exists() { return files.has(this.key); }
  async text() { if(!this.exists)throw Error('missing file');return files.get(this.key); }
  async bytes() { if(!this.exists)throw Error('missing file');return new Uint8Array(Buffer.from(files.get(this.key))); }
  write(value) {
    if (failFileWrite) throw new Error('simulated file write failure');
    files.set(this.key, value);
  }
  delete() { if(failFileDelete)throw Error('simulated delete failure');files.delete(this.key); }
}
class FakeDirectory {
  constructor(uri) { this.uri=uri; }
  list() { return [...files.keys()].filter(key=>key.startsWith(this.uri+'::')).map(key=>new FakeFile(this,key.slice(this.uri.length+2))); }
  createFile(name) { const file=new FakeFile(this,name);if(file.exists)throw Error('already exists');files.set(file.key,'');return file; }
}
const cacheDirectory=new FakeDirectory('file:///cache/');
function loadTS(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (name) => {
    if (name === '@/localization/provider') return { useLanguage: () => ({ language: 'ru' }) };
    if (name === '@/localization') return loadTS('localization/index.ts');
    if (name.startsWith('../design-lab/')) return require(path.resolve(path.dirname(filename), name));
    if (name.startsWith('./') && fs.existsSync(path.resolve(path.dirname(filename),name)+'.ts')) return loadTS(path.resolve(path.dirname(filename),name)+'.ts');
    if (name === 'expo-file-system') return { File: FakeFile, Directory:FakeDirectory, Paths: { document: documentDirectory, cache:cacheDirectory } };
    if (name === 'expo-sharing') return { isAvailableAsync: async () => sharingAvailable, shareAsync: async (uri, options) => { sharedFiles.push({uri, options}); if (shareFailure) throw shareFailure; } };
    if (name === 'expo-modules-core') return {requireOptionalNativeModule:()=>null};
    if (name === 'react-native') return { Platform:{OS:'android'}, Text: 'Text', View: 'View', StyleSheet: { create: (styles) => styles } };
    if (name === 'react-native-svg') return Object.fromEntries([
      ['__esModule', true], ['default', 'Svg'], ...['Circle', 'Defs', 'G', 'LinearGradient', 'Line', 'Path', 'Rect', 'Stop', 'Text'].map((key) => [key, key]),
    ]);
    if(name==='@/modules/diary-backup')return loadTS('modules/diary-backup/index.ts');
    return name.startsWith('@/') ? loadTS(`${name.slice(2)}.ts`) : require(name);
  };
  new Function('exports', 'require', 'module', code)(module.exports, localRequire, module);
  return module.exports;
}

const api = loadTS('data/database.ts');
const { appLocale } = loadTS('localization/index.ts');
appLocale.setLanguage('ru');
const { loadAppLanguage, saveAppLanguage, LANGUAGE_SETTING } = loadTS('localization/preferences.ts');
const { setAutoBackupEnabled, runAutoBackup, getLastAutoBackupAt, getBackupLocation, getBackupError,
  readStoredBackup, changeBackupLocation, factoryResetDiary, BackupDestinationExistsError, BACKUP_INTERVAL_MS } = loadTS('data/auto-backup.ts');
const { backupFacts } = loadTS('data/backup-info.ts');
const { hasBackupFile } = loadTS('data/backup-storage.ts');
const clarity = loadTS('data/clarity-state.ts');
const M = require('../design-lab/model.js');
const { comparisonSelections } = loadTS('constants/clarity-comparison.ts');
const { clarityWorkbook } = loadTS('data/clarity-export.ts');
const { shareDiary } = loadTS('data/diary-share.ts');

test('JSON sharing exports current SQLite data, restores exactly and does not overwrite the daily backup', async t => {
  files.clear();sharedFiles.length=0;t.after(()=>{files.clear();sharedFiles.length=0;});
  const db=await fixture(t);
  await api.createPhase(db,{...phase(),title:'Personal title',icon:'moon',color:'#627eaa',note:'Original note'});
  await api.addMeasurement(db,{...draft(10,[reading(121),{...reading(125),measuredAt:iso(11)}]),note:' exact\n',tags:['Кофе']});
  files.set('davlenie-autobackup.json','Unchanged daily backup');
  const before=await snapshot(db),state=await clarity.readClarityState(db);
  await shareDiary(state,'json');
  assert.equal(sharedFiles.length,1);assert.equal(sharedFiles[0].options.mimeType,'application/json');assert.equal(sharedFiles[0].options.UTI,'public.json');
  const saved=[...files.entries()].find(([name])=>name.includes('davlenie-export-')&&name.endsWith('.json'));
  const payload=JSON.parse(saved[1]);assert.equal(payload.version,2);
  assert.equal(payload.sessions[0].note,' exact\n');assert.equal(payload.phases[0].color,'#627eaa');
  assert.deepEqual(payload.readings.map(r=>r.measured_at),state.sessions[0].readings.map(r=>r.measuredAt));
  const restored=await fixture(t);await api.restoreBackup(restored,payload);
  assert.deepEqual(await snapshot(restored),before);
  assert.deepEqual(await snapshot(db),before);assert.equal(files.get('davlenie-autobackup.json'),'Unchanged daily backup');
  assert.ok(files.has(saved[0]),'recipient must be able to read the shared file after the chooser closes');
});

test('Excel sharing creates a readable XLSX with all three sheets and the correct native share metadata', async t => {
  files.clear();sharedFiles.length=0;t.after(()=>{files.clear();sharedFiles.length=0;});
  const db=await fixture(t);await api.addMeasurement(db,draft());
  await shareDiary(await clarity.readClarityState(db),'xlsx');
  const binary=[...files.entries()].find(([name])=>name.endsWith('.xlsx'))[1];
  const workbook=require('@e965/xlsx').read(binary,{type:'array'});
  assert.equal(workbook.SheetNames.length,3);assert.equal(sharedFiles.length,1);
  assert.equal(sharedFiles[0].options.mimeType,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.equal(sharedFiles[0].options.UTI,'org.openxmlformats.spreadsheetml.sheet');
});

test('share failures preserve diary and backup; cache cleanup removes only old app exports', async t => {
  files.clear();sharedFiles.length=0;t.after(()=>{files.clear();sharedFiles.length=0;sharingAvailable=true;shareFailure=null;});
  const db=await fixture(t);await api.addMeasurement(db,draft());const state=await clarity.readClarityState(db),before=await snapshot(db);
  files.set('davlenie-autobackup.json','daily');files.set(cacheDirectory.uri+'::user.json','personal');
  files.set(cacheDirectory.uri+'::davlenie-export-2020-01-01-1577836800000.json','old');
  sharingAvailable=false;await assert.rejects(shareDiary(state,'json'),/недоступно/);assert.equal(sharedFiles.length,0);
  sharingAvailable=true;shareFailure=Error('chooser failed');await assert.rejects(shareDiary(state,'json'),/chooser failed/);
  assert.ok(!files.has(cacheDirectory.uri+'::davlenie-export-2020-01-01-1577836800000.json'));
  assert.equal(files.get('davlenie-autobackup.json'),'daily');assert.equal(files.get(cacheDirectory.uri+'::user.json'),'personal');
  assert.deepEqual(await snapshot(db),before);
});

test('opening a native backup folder checks file presence without parsing its possibly corrupt JSON', async t => {
  files.clear(); t.after(() => files.clear());
  const defaultFolder = { kind: 'default', label: 'Default' };
  const external = { kind: 'android', uri: 'content://backup-folder', label: 'External' };
  assert.equal(await hasBackupFile(defaultFolder), false);
  assert.equal(await hasBackupFile(external), false);
  files.set('davlenie-autobackup.json', 'broken JSON');
  files.set(external.uri + '::davlenie-autobackup.json', 'also broken');
  assert.equal(await hasBackupFile(defaultFolder), true);
  assert.equal(await hasBackupFile(external), true);
  assert.equal(await hasBackupFile({ ...external, uri: 'content://other-folder' }), false);
});
const iso = (day) => `2026-09-${String(day).padStart(2, '0')}T12:00:00.000Z`;
const reading = (systolic = 120) => ({ systolic, diastolic: 80, pulse: 70 });
const draft = (day = 10, readings = [reading()], wellbeing = 7) => ({
  measuredAt: new Date(iso(day)), wellbeing, tags: [], note: '',
  mode: readings.length === 1 ? 'single' : 'series', readings,
});
const phase = (start = 1, end = null, kind = 'clean') => ({
  kind, title: kind, startedAt: iso(start), endedAt: end === null ? null : iso(end), note: '',
});

async function fixture(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  const db = {
    execAsync: async (sql) => sqlite.exec(sql),
    runAsync: async (sql, ...args) => {
      const result = sqlite.prepare(sql).run(...args);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    getFirstAsync: async (sql, ...args) => sqlite.prepare(sql).get(...args),
    getAllAsync: async (sql, ...args) => sqlite.prepare(sql).all(...args),
    withTransactionAsync: async (fn) => {
      sqlite.exec('BEGIN');
      try { await fn(); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  await api.initializeDatabase(db);
  return db;
}

async function snapshot(db) {
  const { exportedAt, ...content } = await api.buildBackupPayload(db);
  return content;
}

async function sessions(db) {
  return (await clarity.readClarityState(db)).sessions;
}

async function session(db, id) {
  return (await sessions(db)).find((item) => item.id === id);
}

async function readingTimes(db, sessionId) {
  const rows = await db.getAllAsync('SELECT measured_at FROM measurement_readings WHERE session_id = ? ORDER BY position', sessionId);
  return rows.map((row) => row.measured_at);
}

test('native first launch uses the system language and unsupported locales use English without writing preferences', async t => {
  const db = await fixture(t);
  for (const [locale, language] of [['ru-RU', 'ru'], ['en-US', 'en'], ['fr-CA', 'fr'], ['es-MX', 'es'], ['de-CH', 'de'], ['it-IT', 'en']]) {
    assert.deepEqual(await loadAppLanguage(db, locale), { language, manual: false });
  }
  assert.equal(await api.getSetting(db, LANGUAGE_SETTING), null);
});

test('native explicit language survives reopening and import without changing diary content or backups', async t => {
  const db = await fixture(t);
  await api.addMeasurement(db, { ...draft(), note: 'Настройки', tags: ['После кофе'] });
  const before = await snapshot(db);
  for (const language of ['ru', 'en', 'fr', 'es', 'de']) {
    await saveAppLanguage(db, language);
    await api.initializeDatabase(db);
    assert.deepEqual(await loadAppLanguage(db, 'it-IT'), { language, manual: true });
    assert.deepEqual(await snapshot(db), before);
  }
  const payload = await api.buildBackupPayload(db);
  await api.restoreBackup(db, payload);
  assert.deepEqual(await loadAppLanguage(db, 'ru-RU'), { language: 'de', manual: true });
});

test('native invalid settings recover from the system; failed or unsupported writes preserve the old choice', async t => {
  const db = await fixture(t);
  for (const value of ['broken', '{"version":2,"language":"fr"}', '{"version":1,"language":"it"}']) {
    await api.setSetting(db, LANGUAGE_SETTING, value);
    assert.deepEqual(await loadAppLanguage(db, 'de-DE'), { language: 'de', manual: false });
  }
  await saveAppLanguage(db, 'es');
  await assert.rejects(() => saveAppLanguage(db, 'it'), /Unsupported language/);
  await assert.rejects(() => saveAppLanguage({ ...db, runAsync: async () => { throw Error('disk full'); } }, 'fr'), /disk full/);
  assert.deepEqual(await loadAppLanguage(db, 'en-US'), { language: 'es', manual: true });
});

test('native factory reset clears the manual language so the next launch follows the system', async t => {
  files.clear(); t.after(() => files.clear());
  const db = await fixture(t);
  await saveAppLanguage(db, 'de');
  await factoryResetDiary(db);
  assert.deepEqual(await loadAppLanguage(db, 'fr-FR'), { language: 'fr', manual: false });
  assert.deepEqual(await loadAppLanguage(db, 'ja-JP'), { language: 'en', manual: false });
});

test('factory reset removes records, phases, drafts and all managed copies without reseeding',async t=>{
  files.clear();t.after(()=>files.clear());const db=await fixture(t);
  await api.addMeasurement(db,draft(10,[reading(),reading()]));
  await api.setSetting(db,'entry_draft','private draft');
  await runAutoBackup(db,Date.parse(iso(10)));
  const location={kind:'android',uri:'content://folder/reset',label:'Reset'};
  await changeBackupLocation(db,location);
  files.set('davlenie-autobackup-2026-09-01.json','old bytes');files.set('unrelated.json','keep');
  files.set(cacheDirectory.uri+'::davlenie-export-2026-09-01.xlsx','private export');
  files.set(cacheDirectory.uri+'::davlenie-export-2026-10-12-1791838800000.json','private JSON export');
  files.set(cacheDirectory.uri+'::'+ 'davlenie-autobackup.json','cached copy');
  await factoryResetDiary(db);
  assert.equal(await api.countMeasurements(db),0);assert.deepEqual(await api.getPhases(db),[]);
  assert.equal(await api.getSetting(db,'entry_draft'),null);assert.equal(await getLastAutoBackupAt(db),null);
  assert.equal((await getBackupLocation(db)).kind,'default');assert.equal(await readStoredBackup(db),null);
  assert.deepEqual([...files],[['unrelated.json','keep']]);
  await api.initializeDatabase(db);assert.deepEqual(await api.getPhases(db),[]);
  assert.equal(await runAutoBackup(db,Date.parse(iso(12))),'empty');
  await api.addMeasurement(db,draft());assert.deepEqual((await sessions(db)).map(item=>item.id),[1]);
});

test('factory reset rolls back database and copy bytes when its database transaction fails',async t=>{
  files.clear();t.after(()=>files.clear());const db=await fixture(t);
  await api.addMeasurement(db,draft());await runAutoBackup(db,Date.parse(iso(10)));
  const binary=new Uint8Array([80,75,3,4,0,255,128,200]);
  files.set(cacheDirectory.uri+'::davlenie-export-2026-09-01.xlsx',binary);
  files.set(cacheDirectory.uri+'::davlenie-export-2026-10-12-1791838800000.json','{"private":"exact bytes"}');
  const before=await snapshot(db),savedFiles=[...files];
  const broken={...db,runAsync:async(sql,...args)=>{if(sql==='DELETE FROM app_settings')throw Error('database busy');return db.runAsync(sql,...args);}};
  await assert.rejects(factoryResetDiary(broken),/database busy/);
  assert.deepEqual(await snapshot(db),before);assert.deepEqual([...files],savedFiles);
});

test('factory reset keeps diary data when the backup cannot be deleted and waits for queued writes',async t=>{
  files.clear();t.after(()=>{files.clear();failFileDelete=false;});const db=await fixture(t);
  await api.addMeasurement(db,draft());await runAutoBackup(db,Date.parse(iso(10)));
  const before=await snapshot(db);failFileDelete=true;
  await assert.rejects(factoryResetDiary(db),/delete failure/);assert.deepEqual(await snapshot(db),before);
  failFileDelete=false;
  await Promise.all([runAutoBackup(db,Date.parse(iso(12))),factoryResetDiary(db),runAutoBackup(db,Date.parse(iso(13)))]);
  assert.equal(await readStoredBackup(db),null);assert.equal(files.size,0);assert.equal(await api.countMeasurements(db),0);
});

test('saved-copy facts use snapshot contents after later journal changes',async t=>{
  files.clear();t.after(()=>files.clear());const db=await fixture(t);
  await api.addMeasurement(db,draft(10,[reading(),reading()]));await api.addMeasurement(db,draft(11));
  await runAutoBackup(db,Date.parse(iso(12)));const copy=await readStoredBackup(db),facts=backupFacts(copy);
  await api.addMeasurement(db,draft(13));await api.clearMeasurements(db);
  assert.equal(facts.records,2);assert.equal(facts.readings,3);assert.equal(facts.series,1);assert.equal(facts.days,2);
  assert.equal(facts.periods,copy.phases.length);assert.equal(facts.at.toISOString(),iso(12));
  assert.throws(()=>backupFacts({app:'Давление',exportedAt:'invalid',sessions:[],readings:[]}),/прочитать/);
});

test('independent periods stay open and one measurement belongs to every matching period', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1));
  await api.createPhase(db, phase(10, null, 'coffee'));
  await api.addMeasurement(db, draft(9));
  await api.addMeasurement(db, draft(10));
  const { sessions: items, phases } = await clarity.readClarityState(db);
  assert.equal(phases.find((item) => item.kind === 'clean').endedAt, null);
  const count = (kind) => items.filter((item) => M.inside(item, phases.find((p) => p.kind === kind))).length;
  assert.deepEqual([count('clean'), count('coffee')], [2, 1]);
  const matching = M.phasesFor(items.find((item) => item.measuredAt === iso(10)), phases);
  assert.deepEqual(matching.map((item) => item.kind).sort(), ['clean', 'coffee']);
  await api.createPhase(db, phase(10));
  const before = await snapshot(db);
  await assert.rejects(api.createPhase(db, phase(10)), api.PhaseOverlapError);
  assert.deepEqual(await snapshot(db), before);
  await api.createPhase(db, phase(5, 8)); // A fourth total period is allowed outside the triple intersection.
});

test('four overlapping closed periods and conflicting edits are rejected without modifying dates', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1, 10));
  await api.createPhase(db, phase(10, 20, 'coffee'));
  await api.createPhase(db, phase(1, 20, 'energy'));
  await api.createPhase(db, phase(1, 20, 'mixed'));
  const before = await snapshot(db);
  await assert.rejects(api.createPhase(db, phase(5, 12)), api.PhaseOverlapError);
  const coffee = (await api.getPhases(db)).find((item) => item.kind === 'coffee');
  await assert.rejects(api.updatePhase(db, coffee.id, phase(9, 20, 'coffee')), api.PhaseOverlapError);
  await assert.rejects(api.updatePhase(db, coffee.id, phase(20, 10, 'coffee')));
  assert.deepEqual(await snapshot(db), before);
  await api.updatePhase(db, coffee.id, phase(11, 19, 'coffee'));
  assert.equal((await api.getPhases(db)).find((item) => item.id === coffee.id).startedAt, iso(11));
});

test('a failed creation does not close an open predecessor', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1));
  // Model a conflicting period left by an older application version.
  await db.runAsync(`INSERT INTO experiment_phases
    (kind, title, started_at, ended_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  'coffee', 'legacy', iso(15), iso(25), '', iso(1));
  await api.createPhase(db, phase(15, 25, 'energy'));
  await assert.rejects(api.createPhase(db, phase(10, 20)), api.PhaseOverlapError);
  assert.equal((await api.getPhases(db)).find((item) => item.kind === 'clean').endedAt, null);
});

test('legacy phase seeding happens once and deleted periods stay deleted after relaunch', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', 'initial_phases_seeded');
  await api.initializeDatabase(db);
  const phases = await api.getPhases(db);
  assert.equal(phases.length, 1);
  await api.deletePhase(db, phases[0].id);
  await api.initializeDatabase(db);
  assert.deepEqual(await api.getPhases(db), []);
});

test('fresh installs and backups with an explicit empty phase list stay empty after relaunch', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  await api.initializeDatabase(db);
  assert.deepEqual(await api.getPhases(db), []);
  const backup = await api.buildBackupPayload(db);
  await api.createPhase(db, phase());
  await api.restoreBackup(db, backup);
  await api.initializeDatabase(db);
  assert.deepEqual(await api.getPhases(db), []);
});

test('a marker at the first measurement does not seed a zero-length period', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, { ...draft(), note: 'Начало эксперимента' });
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', 'initial_phases_seeded');
  await api.initializeDatabase(db);
  assert.deepEqual((await api.getPhases(db)).map((item) => item.kind), ['coffee']);
});

test('invalid backups are rejected before replacement and current records survive', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  await api.createPhase(db, phase(1, 20));
  const good = await api.buildBackupPayload(db);
  const before = await snapshot(db);
  const mutations = {
    'session without readings': (b) => b.sessions.push({ ...b.sessions[0], id: 2 }),
    'duplicate session IDs': (b) => b.sessions.push({ ...b.sessions[0] }),
    'nonstring tag': (b) => b.sessions[0].tags.push(42),
    'null session': (b) => { b.sessions[0] = null; },
    'ambiguous date': (b) => { b.sessions[0].measured_at = '1'; },
    'impossible date': (b) => { b.sessions[0].measured_at = '2026-02-30T12:00:00Z'; },
    'invalid creation date': (b) => { b.sessions[0].created_at = false; },
    'invalid reading date': (b) => { b.readings[0].measured_at = 'not a date'; },
    'null reading date': (b) => { b.readings[0].measured_at = null; },
    'missing reading parent': (b) => { b.readings[0].session_id = 99; },
    'inverted pressure': (b) => { b.readings[0].systolic = 70; },
    'fractional pressure': (b) => { b.readings[0].systolic = 120.5; },
    'single with two readings': (b) => b.readings.push({ ...b.readings[0], position: 1 }),
    'series with one reading': (b) => { b.sessions[0].mode = 'series'; },
    'series with eleven readings': (b) => {
      b.sessions[0].mode = 'series';
      for (let position = 1; position < 11; position += 1) b.readings.push({ ...b.readings[0], position });
    },
    'duplicate reading positions': (b) => {
      b.sessions[0].mode = 'series'; b.readings.push({ ...b.readings[0] });
    },
    'gap in reading positions': (b) => { b.readings[0].position = 1; },
    'duplicate phase IDs': (b) => b.phases.push({ ...b.phases[0] }),
    'inverted phase range': (b) => { b.phases[0].ended_at = iso(1); },
    'four overlapping phases': (b) => { for (let id = 2; id <= 4; id++) b.phases.push({ ...b.phases[0], id, started_at: iso(10), ended_at: null }); },
    'unknown icon': (b) => { b.phases[0].icon = 'not-an-icon'; },
    'nonstring color': (b) => { b.phases[0].color = 42; },
    'null phase': (b) => { b.phases[0] = null; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const backup = structuredClone(good);
      mutate(backup);
      await assert.rejects(api.restoreBackup(db, backup));
      assert.deepEqual(await snapshot(db), before);
    });
  }
});

test('valid backups round-trip, normalize timezones, and older backups preserve existing periods', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft(10, [reading(120), reading(121), reading(122)]));
  await api.createPhase(db, phase(1, 20));
  const backup = await api.buildBackupPayload(db);
  const before = await snapshot(db);
  await api.clearMeasurements(db);
  assert.equal((await api.restoreBackup(db, backup)).sessions, 1);
  assert.deepEqual(await snapshot(db), before);
  const legacy = structuredClone(backup);
  delete legacy.phases;
  legacy.sessions[0].measured_at = '2026-09-10T15:00:00+03:00';
  const result = await api.restoreBackup(db, legacy);
  assert.equal(result.phases, null);
  assert.equal((await db.getFirstAsync('SELECT measured_at FROM measurement_sessions')).measured_at, iso(10));
  assert.deepEqual((await snapshot(db)).phases, before.phases);
});

test('invalid series cannot be written through the data API', async (t) => {
  const db = await fixture(t);
  await assert.rejects(api.addMeasurement(db, { ...draft(), mode: 'series' }));
  await assert.rejects(api.addMeasurement(db, draft(10, Array.from({ length: 11 }, () => reading()))));
  assert.equal(await api.countMeasurements(db), 0);
  await api.addMeasurement(db, draft(10, [reading(), reading()]));
  await api.addMeasurement(db, draft(10, [reading(), reading(), reading()]));
  assert.deepEqual((await sessions(db)).map((item) => [item.id, item.readings.length]).sort((a, b) => a[0] - b[0]), [[1, 2], [2, 3]]);
});

test('period actions leave the saved JSON untouched until the next eligible opening', async (t) => {
  const db = await fixture(t);
  files.clear();
  await api.addMeasurement(db, draft());
  const opened=Date.parse('2026-10-10T23:50:00Z');
  assert.equal(await runAutoBackup(db,opened),'written');
  const copied = () => JSON.parse(files.get('davlenie-autobackup.json'));
  await api.createPhase(db, phase(1));
  assert.equal(copied().phases.length, 0);
  const id = (await api.getPhases(db))[0].id;
  await api.updatePhase(db, id, { ...phase(1), title: 'edited' });
  assert.equal(await runAutoBackup(db,opened+BACKUP_INTERVAL_MS-1),'recent');
  assert.equal(copied().phases.length,0);
  assert.equal(await runAutoBackup(db,opened+BACKUP_INTERVAL_MS),'written');
  assert.equal(copied().phases[0].title,'edited');
  const before=files.get('davlenie-autobackup.json');
  await api.deletePhase(db, id);
  assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal(copied().sessions.length, 1);
  assert.equal(files.size,1);
  await api.initializeDatabase(db);
  assert.deepEqual(await api.getPhases(db), []);
});

test('disabled automatic copying is respected by period actions', async (t) => {
  const db = await fixture(t);
  files.clear();
  await api.addMeasurement(db, draft());
  await setAutoBackupEnabled(db, false);
  await api.createPhase(db, phase(1));
  assert.equal((await api.getPhases(db)).length, 1);
  assert.equal(files.size, 0);
});

test('a copy failure does not prevent a period from being saved', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  failFileWrite = true;
  t.after(() => { failFileWrite = false; });
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await api.createPhase(db, phase(1));
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal((await api.getPhases(db)).length, 1);
});

test('one automatic JSON updates exactly after 24 hours, survives reload and ignores clock rollback', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T23:59:00Z');
  assert.equal(await runAutoBackup(db,first),'written');
  const before=files.get('davlenie-autobackup.json');
  await api.addMeasurement(db,draft(11));
  await api.initializeDatabase(db);
  assert.equal(await runAutoBackup(db,first+60*1000),'recent');
  assert.equal(await runAutoBackup(db,first-60*1000),'recent');
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS-1),'recent');
  assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS),'written');
  assert.equal((await readStoredBackup(db)).sessions.length,2);
  assert.equal(files.size,1);
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first+BACKUP_INTERVAL_MS);
});

test('simultaneous openings create one copy and pass the gate only once', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');
  assert.deepEqual(await Promise.all([runAutoBackup(db,first),runAutoBackup(db,first)]),['written','recent']);
  assert.equal(files.size,1);
});

test('disabled and empty diaries preserve the only copy and do not advance the timer', async (t) => {
  const db=await fixture(t);files.clear();const first=Date.parse('2026-10-10T12:00:00Z');
  assert.equal(await runAutoBackup(db,first),'empty');assert.equal(files.size,0);
  await api.addMeasurement(db,draft());await runAutoBackup(db,first);
  const before=files.get('davlenie-autobackup.json');
  await setAutoBackupEnabled(db,false);
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS),'disabled');
  await setAutoBackupEnabled(db,true);
  assert.equal(files.get('davlenie-autobackup.json'),before);
  await api.clearMeasurements(db);
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS),'empty');
  assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
});

test('failed writes preserve the copy and timestamp, and the next opening can retry', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const before=files.get('davlenie-autobackup.json');
  await api.addMeasurement(db,draft(11));failFileWrite=true;
  t.after(()=>{failFileWrite=false;});
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS),'failed');
  assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
  assert.ok(await getBackupError(db));
  failFileWrite=false;
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS+1),'written');
  assert.equal((await readStoredBackup(db)).sessions.length,2);
  assert.equal(await getBackupError(db),'');
});

test('a failed schedule write rolls the file back before the next opening retries', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const before=files.get('davlenie-autobackup.json');await api.addMeasurement(db,draft(11));
  const run=db.runAsync;let fail=true;
  db.runAsync=async(sql,...args)=>{
    if(args[0]==='auto_backup_last_run'&&fail){fail=false;throw Error('settings write failed');}
    return run(sql,...args);
  };
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS),'failed');
  assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
  assert.equal(await runAutoBackup(db,first+BACKUP_INTERVAL_MS+1),'written');
  assert.equal((await readStoredBackup(db)).sessions.length,2);
});

test('reselecting the same iOS folder renews its bookmark without reading or updating the copy', async (t) => {
  const db=await fixture(t);files.clear();
  const source={kind:'ios',uri:'file:///selected/Diary/',label:'Дневник',bookmark:'expired'};
  const fresh={...source,uri:'file:///selected/Diary',bookmark:'renewed'};
  await api.setSetting(db,'auto_backup_location',JSON.stringify(source));
  await api.setSetting(db,'auto_backup_last_run','2026-10-10T12:00:00.000Z');
  await api.setSetting(db,'auto_backup_error','old access error');
  await changeBackupLocation(db,fresh);
  assert.deepEqual(await getBackupLocation(db),fresh);
  assert.equal((await getLastAutoBackupAt(db)).toISOString(),'2026-10-10T12:00:00.000Z');
  assert.equal(await getBackupError(db),'');assert.equal(files.size,0);
});

test('changing the backup folder moves one snapshot and preserves its 24-hour timestamp', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const before=files.get('davlenie-autobackup.json'),records=await snapshot(db);
  const destination={kind:'android',uri:'content://documents/tree/primary%3ADiary',label:'Документы / Дневник'};
  await changeBackupLocation(db,destination);
  assert.equal(files.size,1);assert.equal(files.has('davlenie-autobackup.json'),false);
  assert.equal(files.get(destination.uri+'::davlenie-autobackup.json'),before);
  await api.initializeDatabase(db);assert.deepEqual(await getBackupLocation(db),destination);
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
  assert.equal(await runAutoBackup(db,first+1),'recent');
  assert.deepEqual(await snapshot(db),records);
  await api.clearMeasurements(db);
  const restored=await api.restoreBackup(db,await readStoredBackup(db));
  assert.equal(restored.sessions,1);
});

test('a destination copy is preserved until explicit replacement and unrelated files survive', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  await runAutoBackup(db,Date.parse('2026-10-10T12:00:00Z'));
  const source=files.get('davlenie-autobackup.json');
  const destination={kind:'android',uri:'content://documents/tree/Diary',label:'Дневник'};
  files.set(destination.uri+'::davlenie-autobackup.json','existing backup');
  files.set(destination.uri+'::important.json','unrelated');
  await assert.rejects(changeBackupLocation(db,destination),BackupDestinationExistsError);
  assert.equal(files.get('davlenie-autobackup.json'),source);
  assert.equal(files.get(destination.uri+'::davlenie-autobackup.json'),'existing backup');
  assert.equal((await getBackupLocation(db)).kind,'default');
  await changeBackupLocation(db,destination,true);
  assert.equal(files.has('davlenie-autobackup.json'),false);
  assert.equal(files.get(destination.uri+'::davlenie-autobackup.json'),source);
  assert.equal(files.get(destination.uri+'::important.json'),'unrelated');
});

test('a failed folder move preserves the source copy, folder and schedule', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const source=files.get('davlenie-autobackup.json');
  const destination={kind:'android',uri:'content://documents/tree/Diary',label:'Дневник'};
  failFileWrite=true;t.after(()=>{failFileWrite=false;});
  await assert.rejects(changeBackupLocation(db,destination));
  failFileWrite=false;
  assert.equal(files.size,1);assert.equal(files.get('davlenie-autobackup.json'),source);
  assert.equal((await getBackupLocation(db)).kind,'default');
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
});

test('a failed folder setting rolls back a completed file move', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const before=files.get('davlenie-autobackup.json');
  const destination={kind:'android',uri:'content://documents/tree/Diary',label:'Дневник'};
  const run=db.runAsync;let fail=true;
  db.runAsync=async(sql,...args)=>{
    if(args[0]==='auto_backup_location'&&fail){fail=false;throw Error('settings write failed');}
    return run(sql,...args);
  };
  await assert.rejects(changeBackupLocation(db,destination));
  assert.equal(files.size,1);assert.equal(files.get('davlenie-autobackup.json'),before);
  assert.equal((await getBackupLocation(db)).kind,'default');
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
});

test('legacy copies retain the newest dated file when the current file is missing and backup is off', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const older=JSON.stringify({...await api.buildBackupPayload(db),exportedAt:'2026-10-09T12:00:00.000Z'});
  await api.addMeasurement(db,draft(11));
  const latest=JSON.stringify({...await api.buildBackupPayload(db),exportedAt:'2026-10-10T12:00:00.000Z'});
  files.set('davlenie-autobackup-2026-10-09.json',older);
  files.set('davlenie-autobackup-2026-10-10.json',latest);
  files.set('unrelated.json','keep');await setAutoBackupEnabled(db,false);
  assert.equal(await runAutoBackup(db,Date.parse('2026-10-12T12:00:00Z')),'disabled');
  assert.equal(files.size,2);assert.equal(files.get('davlenie-autobackup.json'),latest);
  assert.equal(files.get('unrelated.json'),'keep');
  assert.equal((await getLastAutoBackupAt(db)).toISOString(),'2026-10-10T12:00:00.000Z');
  assert.equal(await api.countMeasurements(db),2);
});

test('legacy daily copies consolidate without refreshing a recent snapshot or deleting unrelated JSON', async (t) => {
  const db=await fixture(t);files.clear();await api.addMeasurement(db,draft());
  const first=Date.parse('2026-10-10T12:00:00Z');await runAutoBackup(db,first);
  const source=files.get('davlenie-autobackup.json');
  files.set('davlenie-autobackup-2026-10-09.json',source);
  files.set('davlenie-autobackup-2026-10-10.json',source);
  files.set('davlenie-autobackup-notes.json','unrelated');
  assert.equal(await runAutoBackup(db,first+1),'recent');
  assert.equal(files.size,2);assert.equal(files.get('davlenie-autobackup.json'),source);
  assert.equal(files.get('davlenie-autobackup-notes.json'),'unrelated');
  assert.equal((await getLastAutoBackupAt(db)).getTime(),first);
});

test('upgrading an old readings table preserves measurements and backfills times exactly once', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, { ...draft(10, [reading(120), reading(121)]), note: 'keep this note' });
  await db.execAsync('ALTER TABLE measurement_readings DROP COLUMN measured_at');
  await api.initializeDatabase(db);
  const details = await session(db, 1);
  assert.equal(details.note, 'keep this note');
  assert.equal(details.readings.length, 2);
  assert.deepEqual(await readingTimes(db, 1), [iso(10), iso(10)]);
  await db.runAsync('UPDATE measurement_readings SET measured_at = ? WHERE position = 1', iso(11));
  await api.initializeDatabase(db);
  assert.deepEqual(await readingTimes(db, 1), [iso(10), iso(11)]);
});

test('the installed iOS 0.7.1 database upgrades in place without losing records, periods or settings', async t => {
  const db = await fixture(t);
  // The schema shipped in EAS build b4b41626 (commit 71047d3) lacks these columns and marker.
  await db.execAsync(`
    ALTER TABLE measurement_readings DROP COLUMN measured_at;
    ALTER TABLE experiment_phases DROP COLUMN icon;
    ALTER TABLE experiment_phases DROP COLUMN color;
    DELETE FROM app_settings;
  `);
  await db.runAsync(`INSERT INTO measurement_sessions
    (id, measured_at, wellbeing, tags_json, note, mode, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)`, 42, iso(10), 8, '["coffee"]', 'Моя прежняя заметка', 'series', iso(9));
  for (const [position, systolic] of [120, 122].entries()) {
    await db.runAsync(`INSERT INTO measurement_readings
      (id, session_id, systolic, diastolic, pulse, position) VALUES (?, 42, ?, 80, 70, ?)`,
    100 + position, systolic, position);
  }
  await db.runAsync(`INSERT INTO experiment_phases
    (id, kind, title, started_at, ended_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  17, 'clean', 'Мой прежний период', iso(1), iso(11), 'Заметка периода', iso(1));
  await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', 'auto_backup_enabled', 'no');
  const legacyRows = async () => ({
    sessions: await db.getAllAsync('SELECT * FROM measurement_sessions ORDER BY id'),
    readings: await db.getAllAsync('SELECT id, session_id, systolic, diastolic, pulse, position FROM measurement_readings ORDER BY id'),
    phases: await db.getAllAsync('SELECT id, kind, title, started_at, ended_at, note, created_at FROM experiment_phases ORDER BY id'),
  });
  const before = await legacyRows();
  await api.initializeDatabase(db);
  assert.deepEqual(await legacyRows(), before);
  assert.equal(await api.getSetting(db, 'auto_backup_enabled'), 'no');
  const record = await session(db, 42);
  assert.equal(record.note, 'Моя прежняя заметка');
  assert.deepEqual(record.tags, ['coffee']);
  assert.equal(record.readings.length, 2);
  assert.equal(M.summary(record).systolic, 121);
  assert.deepEqual(record.readings.map(r => r.systolic), [120, 122]);
  assert.deepEqual(await readingTimes(db, 42), [iso(10), iso(10)]);
  const state = await clarity.readClarityState(db);
  assert.deepEqual(state.sessions.map(s => s.id), [42]);
  assert.deepEqual(state.phases.map(p => [p.id, p.title, p.note]), [[17, 'Мой прежний период', 'Заметка периода']]);
  const migrated = await snapshot(db);
  await api.initializeDatabase(db);
  assert.deepEqual(await snapshot(db), migrated);
  await api.addMeasurement(db, draft(12));
  assert.deepEqual((await sessions(db)).map(r => r.id).sort((a, b) => a - b), [42, 43]);
});

test('each series reading keeps its own time in details, JSON and restoration', async (t) => {
  const db = await fixture(t);
  const readings = [{ ...reading(120), measuredAt: iso(10) }, { ...reading(121), measuredAt: iso(11) }];
  await api.addMeasurement(db, draft(10, readings));
  const details = await session(db, 1);
  assert.equal(details.measuredAt, iso(10));
  assert.deepEqual(details.readings.map((item) => item.measuredAt), [iso(10), iso(11)]);
  assert.deepEqual(await readingTimes(db, 1), [iso(10), iso(11)]);
  const backup = await api.buildBackupPayload(db);
  assert.deepEqual(backup.readings.map((item) => item.measured_at), [iso(10), iso(11)]);
  await api.restoreBackup(db, backup);
  assert.deepEqual(await readingTimes(db, 1), [iso(10), iso(11)]);
});

test('backups without individual reading times remain restorable', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft(10, [reading(120), reading(121)]));
  const backup = await api.buildBackupPayload(db);
  for (const item of backup.readings) delete item.measured_at;
  await api.restoreBackup(db, backup);
  assert.deepEqual(await readingTimes(db, 1), [iso(10), iso(10)]);
});

test('legacy version 1 design lab JSON restores into the mobile database and round-trips to the web diary', async (t) => {
  const model = require('../design-lab/model.js');
  const state = model.seed(Date.parse('2026-10-02T12:00:00.000Z'));
  // This fixture uses only legacy periods, without parallel ranges or appearance metadata.
  const legacy = { ...model.backup(state), version: 1 };
  assert.ok(legacy.phases.every((p) => p.kind !== 'custom' && !('icon' in p) && !('color' in p)));
  const db = await fixture(t);
  await api.restoreBackup(db, legacy);
  assert.equal(await api.countMeasurements(db), state.sessions.length);
  const restored = model.restore(await api.buildBackupPayload(db));
  assert.deepEqual(restored.sessions.map(({ createdAt, ...item }) => item).sort((a, b) => a.id - b.id), state.sessions);
  assert.deepEqual(restored.phases.sort((a, b) => a.id - b.id), state.phases.map(p=>({...p,createdAt:p.createdAt || p.startedAt})));
});

test('version 2 web backup restores parallel periods and appearance into SQLite and back', async (t) => {
  const model = require('../design-lab/model.js');
  const state = model.seed(Date.parse('2026-10-02T12:00:00.000Z'));
  state.phases = model.savePhase(state.phases, {
    kind: 'custom', title: 'Кофе', icon: 'coffee', color: model.PHASE_COLORS[0],
    startedAt: state.phases.at(-1).startedAt, endedAt: null, note: 'Параллельный период',
  });
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  await api.createPhase(db, phase(1, 20));
  await api.restoreBackup(db, model.backup(state));
  const restored = model.restore(await api.buildBackupPayload(db));
  assert.deepEqual(restored.sessions.map(({ createdAt, ...s }) => s).sort((a,b) => a.id-b.id), state.sessions);
  assert.deepEqual(restored.phases.sort((a,b) => a.id-b.id), state.phases.map(p=>({...p,createdAt:p.createdAt || p.startedAt})).sort((a,b) => a.id-b.id));
});

test('all series lengths 2 through 10 and their first-reading period membership match the prototype', async t => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1, 11));
  await api.createPhase(db, { ...phase(10, 20), kind: 'custom', icon: 'moon', color: M.PHASE_COLORS[4], title: 'Sleep' });
  for (let count = 2; count <= 10; count++) await api.addMeasurement(db, draft(10, Array.from({length:count}, (_,i)=>({...reading(120+i),measuredAt:iso(10+i)}))));
  const state = await clarity.readClarityState(db);
  assert.deepEqual(state.sessions.map(s=>s.readings.length).sort((a,b)=>a-b),[2,3,4,5,6,7,8,9,10]);
  for (const session of state.sessions) assert.equal(M.phasesFor(session,state.phases).length,2);
  for (const method of ['mean','median']) {
    const web = M.restore(M.backup(state));
    assert.deepEqual(M.statisticsSummary(web.sessions,method),M.statisticsSummary(state.sessions,method));
    assert.deepEqual(M.statisticsExtremes(web.sessions),M.statisticsExtremes(state.sessions));
  }
});

test('a fourth future intersection is rejected but exclusive touching boundaries are allowed', async t => {
  const db=await fixture(t);
  const future={...phase(),startedAt:'2030-01-01T12:00:00.000Z',endedAt:'2030-02-01T12:00:00.000Z'};
  for (let i=0;i<3;i++) await api.createPhase(db,{...future,title:String(i)});
  const before=await snapshot(db);
  await assert.rejects(api.createPhase(db,{...future,title:'Fourth'}),api.PhaseOverlapError);
  assert.deepEqual(await snapshot(db),before);
  await api.createPhase(db,{...future,startedAt:future.endedAt,endedAt:null});
  assert.equal((await api.getPhases(db)).length,4);
});

test('independent drafts survive reload and saving clears only the saved mode atomically', async t => {
  const db=await fixture(t);
  let state=await clarity.readClarityState(db);
  const single=M.newDraft('single',Date.parse(iso(10))), series=M.newDraft('series',Date.parse(iso(10)));
  single.readings[0]=M.readingWithInput(single.readings[0],'systolic','124'); single.note='  Keep whitespace\n';
  series.readings[0]=M.readingWithInput(series.readings[0],'pulse','72');
  state=M.storeDraft(M.storeDraft(state,single),series);
  await clarity.writeClarityDrafts(db,state);
  assert.deepEqual((await clarity.readClarityState(db)).drafts,state.drafts);
  const cleared=M.clearDraft(state,'single');
  await api.addMeasurement(db,{...draft(),note:'  exact\n'},cleared);
  const reopened=await clarity.readClarityState(db);
  assert.equal(reopened.drafts.single,null); assert.deepEqual(reopened.drafts.series,series);
  assert.equal(reopened.sessions[0].note,'  exact\n');
  const previous=await snapshot(db), draftsBefore=await api.getSetting(db,clarity.DRAFTS_KEY);
  const fail={...db,runAsync:async(sql,...args)=>{if(sql.includes('INSERT INTO app_settings'))throw Error('draft disk failure');return db.runAsync(sql,...args);}};
  await assert.rejects(api.addMeasurement(fail,draft(12),M.clearDraft(reopened,'series')),/disk failure/);
  assert.deepEqual(await snapshot(db),previous);assert.equal(await api.getSetting(db,clarity.DRAFTS_KEY),draftsBefore);
});

test('invalid draft bytes are preserved and blocked, invalid statistics recover field by field', async t => {
  const db=await fixture(t);
  await api.setSetting(db,clarity.DRAFTS_KEY,'{"draftMode":"series","drafts":{"single":null,"series":{"mode":"series","readings":[null]}}}');
  const raw=await api.getSetting(db,clarity.DRAFTS_KEY);
  await assert.rejects(clarity.readClarityState(db)); assert.equal(await api.getSetting(db,clarity.DRAFTS_KEY),raw);
  await api.setSetting(db,clarity.STATISTICS_KEY,'broken');
  assert.deepEqual(await clarity.readClarityPreferences(db,[]),M.statisticsPreferences(null));
  const pref=M.statisticsPreferences({selection:{scope:'time',preset:'all'},chartMetric:'combined',summary:'median',compareSummary:'median',compareType:'dates'});
  await clarity.writeClarityPreferences(db,pref); await api.initializeDatabase(db);
  assert.deepEqual(await clarity.readClarityPreferences(db,[]),pref);
});

test('comparison defaults use different populated periods or consecutive seven-day intervals',()=>{
  const state=M.seed(Date.parse('2026-10-11T12:00:00.000Z'));
  const [a,b]=comparisonSelections(state,M.statisticsPreferences(null),Date.parse('2026-10-11T12:00:00Z'));
  assert.notEqual(a.scope,b.scope);
  const [left,right]=comparisonSelections(state,M.statisticsPreferences({compareType:'dates'}),Date.parse('2026-10-11T12:00:00Z'));
  assert.deepEqual(left,{scope:'time',preset:'custom',from:'2026-09-28',to:'2026-10-04'});
  assert.deepEqual(right,{scope:'time',preset:'custom',from:'2026-10-05',to:'2026-10-11'});
});

test('native XLSX retains raw averages, all intersecting periods and every original reading', async t => {
  const db=await fixture(t);await api.createPhase(db,phase(1));await api.createPhase(db,{...phase(1),title:'Second',kind:'custom',icon:'moon',color:M.PHASE_COLORS[4]});
  await api.addMeasurement(db,{...draft(10,[reading(120),reading(121)]),note:'=literal user note'});
  const state=await clarity.readClarityState(db), book=clarityWorkbook(state), XLSX=require('@e965/xlsx');
  const bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx'}), reread=XLSX.read(bytes,{type:'buffer',cellDates:true});
  assert.equal(reread.Sheets['Измерения'].B2.v,120.5);
  assert.equal(reread.Sheets['Измерения'].I2.t,'s');assert.equal(reread.Sheets['Измерения'].I2.v,'=literal user note');
  assert.ok(reread.Sheets['Измерения'].J2.v.includes('Second'));assert.ok(reread.Sheets['Измерения'].J2.v.includes('clean'));
  assert.equal(XLSX.utils.sheet_to_json(reread.Sheets['Замеры']).length,2);
  const periods=XLSX.utils.sheet_to_json(reread.Sheets['Периоды'],{header:1});
  assert.equal(periods.find(row=>row[0]==='Second')[2],M.PHASE_COLORS[4]);
});

test('XLSX builds in every interface language with distinct sheet names and no Russian interface text', async t => {
  const db=await fixture(t);await api.createPhase(db,{...phase(1),title:'Morning coffee',kind:'custom',icon:'coffee',color:M.PHASE_COLORS[4]});
  await api.addMeasurement(db,{...draft(10,[reading(120),reading(122)]),tags:['Спокойно','После кофе'],note:'After a walk'});
  const state=await clarity.readClarityState(db), XLSX=require('@e965/xlsx');
  t.after(()=>appLocale.setLanguage('ru'));
  for(const lang of ['ru','en','fr','es','de']){
    appLocale.setLanguage(lang);
    // Excel rejects two sheets with one name, so a shared translation would break the whole export.
    const book=clarityWorkbook(state);
    assert.equal(new Set(book.SheetNames).size,3,lang);
    if(lang==='ru')continue;
    const reread=XLSX.read(XLSX.write(book,{type:'buffer',bookType:'xlsx'}),{type:'buffer'});
    for(const name of reread.SheetNames){
      assert.doesNotMatch(name,/[А-Яа-яЁё]/,lang);
      for(const row of XLSX.utils.sheet_to_json(reread.Sheets[name],{header:1}))
        for(const cell of row)if(typeof cell==='string')assert.doesNotMatch(cell,/[А-Яа-яЁё]/,`${lang} ${name}: ${cell}`);
    }
  }
});

test('saving an entry uses the current SQLite draft of the other mode rather than a stale screen snapshot', async t => {
  const db = await fixture(t), old = await clarity.readClarityState(db);
  const single = M.newDraft('single', Date.parse(iso(10))), series = M.newDraft('series', Date.parse(iso(10)));
  single.readings[0] = M.readingWithInput(single.readings[0], 'systolic', '124');
  await clarity.writeClarityDrafts(db, M.storeDraft(old, single));
  series.note = 'Written while the single form was still mounted';
  await clarity.writeClarityDrafts(db, M.storeDraft(M.storeDraft(old, single), series));
  await api.addMeasurement(db, draft(), 'single');
  const next = await clarity.readClarityState(db);
  assert.equal(next.drafts.single, null);
  assert.deepEqual(next.drafts.series, series);
  assert.equal(next.draftMode, 'series');
});

test('concurrent initialization and independent writes share the SQLite queue and recover after rejection', async t => {
  const db = await fixture(t);
  await Promise.all([api.initializeDatabase(db), api.addMeasurement(db, draft(10)), api.initializeDatabase(db), api.addMeasurement(db, draft(11)), api.createPhase(db, phase(1))]);
  assert.equal(await api.countMeasurements(db), 2);
  assert.equal((await api.getPhases(db)).length, 1);
  const { withDiaryTransaction } = loadTS('data/write-queue.ts');
  const failed = withDiaryTransaction(db, async () => { await db.runAsync('DELETE FROM measurement_sessions'); throw Error('rollback'); });
  const succeeded = api.addMeasurement(db, draft(12));
  await assert.rejects(failed, /rollback/); await succeeded;
  assert.equal(await api.countMeasurements(db), 3);
});
