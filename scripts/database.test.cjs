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
const documentDirectory = { uri:'file:///documents/', list: () => [...files.keys()].filter(name=>!name.includes('::')).map((name) => new FakeFile(documentDirectory, name)) };
class FakeFile {
  constructor(directory, name) {
    this.name = name;
    this.key = directory.uri === documentDirectory.uri ? name : directory.uri+'::'+name;
    this.uri = directory.uri+'/'+name;
  }
  get exists() { return files.has(this.key); }
  async text() { if(!this.exists)throw Error('missing file');return files.get(this.key); }
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
    if (name === 'expo-file-system') return { File: FakeFile, Directory:FakeDirectory, Paths: { document: documentDirectory, cache:cacheDirectory } };
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
const { measurementStats } = loadTS('constants/measurement-stats.ts');
const { cleanBaseline } = loadTS('constants/phase-format.ts');
const { findPhaseFor } = loadTS('types/experiment.ts');
const { savePhase, removePhase } = loadTS('data/phase-actions.ts');
const { setAutoBackupEnabled, runAutoBackup, getLastAutoBackupAt, getBackupLocation, getBackupError,
  readStoredBackup, changeBackupLocation, factoryResetDiary, BackupDestinationExistsError, BACKUP_INTERVAL_MS } = loadTS('data/auto-backup.ts');
const { backupFacts } = loadTS('data/backup-info.ts');
const { hasBackupFile } = loadTS('data/backup-storage.ts');

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
const { DEFAULT_HISTORY_FILTERS, historyQuery } = loadTS('constants/history-filters.ts');
const { chartTimeline } = loadTS('constants/chart-data.ts');
const { statisticsWindow, measurementsInWindow, statisticsForPhase } = loadTS('constants/statistics-data.ts');
const { isEntryValid, readingsFromEntries } = loadTS('constants/measurement-entry.ts');
const { WeeklyChart } = loadTS('components/weekly-chart.tsx');
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
  files.set(cacheDirectory.uri+'::'+ 'davlenie-autobackup.json','cached copy');
  await factoryResetDiary(db);
  assert.equal(await api.countMeasurements(db),0);assert.deepEqual(await api.getPhases(db),[]);
  assert.equal(await api.getSetting(db,'entry_draft'),null);assert.equal(await getLastAutoBackupAt(db),null);
  assert.equal((await getBackupLocation(db)).kind,'default');assert.equal(await readStoredBackup(db),null);
  assert.deepEqual([...files],[['unrelated.json','keep']]);
  await api.initializeDatabase(db);assert.deepEqual(await api.getPhases(db),[]);
  assert.equal(await runAutoBackup(db,Date.parse(iso(12))),'empty');
  await api.addMeasurement(db,draft());assert.equal((await api.getMeasurements(db))[0].id,1);
});

test('factory reset rolls back database and copy bytes when its database transaction fails',async t=>{
  files.clear();t.after(()=>files.clear());const db=await fixture(t);
  await api.addMeasurement(db,draft());await runAutoBackup(db,Date.parse(iso(10)));
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

test('history can reveal all 450 records, including equal timestamps, with the full count', async (t) => {
  const db = await fixture(t);
  for (let index = 0; index < 450; index += 1) {
    await api.addMeasurement(db, draft(10, [reading(index === 0 ? 200 : 120)]));
  }
  assert.equal(await api.countMeasurements(db), 450);
  const first = await api.getMeasurements(db, 200);
  const second = await api.getMeasurements(db, 400);
  const all = await api.getMeasurements(db, 600);
  assert.equal(first.length, 200);
  assert.equal(second.length, 400);
  assert.equal(all.length, 450);
  assert.deepEqual(second.slice(0, 200), first);
  assert.deepEqual(all.slice(0, 400), second);
  assert.equal(new Set(all.map((item) => item.id)).size, 450);
  assert.equal(all[0].id, 450);
  assert.equal(all[449].id, 1);
  // The highest value belongs to a record outside the first page in chronological order.
  const sorted = await api.getMeasurements(db, 200, { sort: 'systolic-desc' });
  assert.equal(sorted[0].id, 1);
  assert.equal(sorted.length, 200);
});

test('new periods close an open predecessor and boundary measurements belong to one period', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1));
  await api.createPhase(db, phase(10, null, 'coffee'));
  await api.addMeasurement(db, draft(9));
  await api.addMeasurement(db, draft(10));
  const phases = await api.getPhasesWithStats(db);
  assert.equal(phases.find((item) => item.kind === 'clean').endedAt, iso(10));
  assert.deepEqual(phases.map((item) => item.stats.count), [1, 1]);
  assert.equal(findPhaseFor(iso(10), phases).kind, 'coffee');
  const before = await snapshot(db);
  await assert.rejects(api.createPhase(db, phase(10)), api.PhaseOverlapError);
  await assert.rejects(api.createPhase(db, phase(5, 8)), api.PhaseOverlapError);
  assert.deepEqual(await snapshot(db), before);
});

test('closed-period overlaps and conflicting edits are rejected without modifying existing dates', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1, 10));
  await api.createPhase(db, phase(10, 20, 'coffee'));
  const before = await snapshot(db);
  await assert.rejects(api.createPhase(db, phase(5, 12)), api.PhaseOverlapError);
  const coffee = (await api.getPhases(db)).find((item) => item.kind === 'coffee');
  await assert.rejects(api.updatePhase(db, coffee.id, phase(9, 20, 'coffee')), api.PhaseOverlapError);
  await assert.rejects(api.updatePhase(db, coffee.id, phase(20, 10, 'coffee')));
  assert.deepEqual(await snapshot(db), before);
  await api.updatePhase(db, coffee.id, phase(11, 19, 'coffee'));
  assert.equal((await api.getPhaseById(db, coffee.id)).startedAt, iso(11));
});

test('a failed creation does not close an open predecessor', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1));
  // Model a conflicting period left by an older application version.
  await db.runAsync(`INSERT INTO experiment_phases
    (kind, title, started_at, ended_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  'coffee', 'legacy', iso(15), iso(25), '', iso(1));
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
    'series with four readings': (b) => {
      b.sessions[0].mode = 'series';
      for (let position = 1; position < 4; position += 1) b.readings.push({ ...b.readings[0], position });
    },
    'duplicate reading positions': (b) => {
      b.sessions[0].mode = 'series'; b.readings.push({ ...b.readings[0] });
    },
    'gap in reading positions': (b) => { b.readings[0].position = 1; },
    'duplicate phase IDs': (b) => b.phases.push({ ...b.phases[0] }),
    'inverted phase range': (b) => { b.phases[0].ended_at = iso(1); },
    'overlapping phases': (b) => b.phases.push({ ...b.phases[0], id: 2, started_at: iso(10), ended_at: null }),
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
  assert.equal((await api.getMeasurements(db))[0].measuredAt, iso(10));
  assert.deepEqual((await snapshot(db)).phases, before.phases);
});

test('invalid series cannot be written through the data API', async (t) => {
  const db = await fixture(t);
  await assert.rejects(api.addMeasurement(db, { ...draft(), mode: 'series' }));
  await assert.rejects(api.addMeasurement(db, draft(10, Array.from({ length: 4 }, () => reading()))));
  assert.equal(await api.countMeasurements(db), 0);
  await api.addMeasurement(db, draft(10, [reading(), reading()]));
  await api.addMeasurement(db, draft(10, [reading(), reading(), reading()]));
  assert.deepEqual((await api.getMeasurements(db)).map((item) => item.readingCount), [3, 2]);
});

test('period summaries, detail data, exports and baseline retain unrounded means until the final result', async (t) => {
  const db = await fixture(t);
  await api.createPhase(db, phase(1, 15));
  await api.createPhase(db, phase(15, 25));
  // 120.5 and 120: rounding the first series early would produce 121 instead of 120.
  await api.addMeasurement(db, draft(10, [reading(120), reading(121)], 7));
  await api.addMeasurement(db, draft(11, [reading(120)], 8));
  await api.addMeasurement(db, draft(20, [reading(120)], 8));
  const phases = await api.getPhasesWithStats(db);
  for (const item of phases) {
    const detailStats = measurementStats(await api.getMeasurementsInPhase(db, item));
    const exportStats = measurementStats((await api.getMeasurements(db, -1)).filter((m) =>
      findPhaseFor(m.measuredAt, phases)?.id === item.id));
    assert.deepEqual(item.stats, detailStats);
    assert.deepEqual(item.stats, exportStats);
    assert.equal(item.stats.systolic, 120);
  }
  assert.equal(phases.find((p) => p.startedAt === iso(1)).stats.wellbeing, 7.5);
  assert.deepEqual(cleanBaseline(phases), measurementStats(await api.getMeasurements(db, -1)));
  assert.equal((await api.getMeasurementById(db, 1)).averages.systolic, 120.5);
});

test('period actions leave the saved JSON untouched until the next eligible opening', async (t) => {
  const db = await fixture(t);
  files.clear();
  await api.addMeasurement(db, draft());
  const opened=Date.parse('2026-10-10T23:50:00Z');
  assert.equal(await runAutoBackup(db,opened),'written');
  const copied = () => JSON.parse(files.get('davlenie-autobackup.json'));
  await savePhase(db, phase(1));
  assert.equal(copied().phases.length, 0);
  const id = (await api.getPhases(db))[0].id;
  await savePhase(db, { ...phase(1), title: 'edited' }, id);
  assert.equal(await runAutoBackup(db,opened+BACKUP_INTERVAL_MS-1),'recent');
  assert.equal(copied().phases.length,0);
  assert.equal(await runAutoBackup(db,opened+BACKUP_INTERVAL_MS),'written');
  assert.equal(copied().phases[0].title,'edited');
  const before=files.get('davlenie-autobackup.json');
  await removePhase(db, id);
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
  await savePhase(db, phase(1));
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
    await savePhase(db, phase(1));
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
  assert.equal((await api.getMeasurements(db,-1)).length,2);
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

test('history supports both date orders and high/low sorting independently for all three metrics', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft(10, [{ systolic: 140, diastolic: 80, pulse: 60 }]));
  await api.addMeasurement(db, draft(11, [{ systolic: 120, diastolic: 95, pulse: 90 }]));
  await api.addMeasurement(db, draft(12, [
    { systolic: 160, diastolic: 70, pulse: 75 },
    { systolic: 100, diastolic: 70, pulse: 75 },
  ]));
  const expected = {
    newest: [3, 2, 1], oldest: [1, 2, 3],
    'systolic-desc': [1, 3, 2], 'systolic-asc': [2, 3, 1],
    'diastolic-desc': [2, 1, 3], 'diastolic-asc': [3, 1, 2],
    'pulse-desc': [2, 3, 1], 'pulse-asc': [1, 3, 2],
  };
  for (const [sort, ids] of Object.entries(expected)) {
    assert.deepEqual((await api.getMeasurements(db, -1, { sort })).map((item) => item.id), ids, sort);
  }
});

test('history date filtering includes both selected days, excludes adjacent days and counts only matches', async (t) => {
  const db = await fixture(t);
  const start = new Date(2026, 8, 10);
  const end = new Date(2026, 8, 11);
  const nextDay = new Date(2026, 8, 12);
  const moments = [
    new Date(start.getTime() - 1), start,
    new Date(2026, 8, 10, 12), new Date(nextDay.getTime() - 1), nextDay,
  ];
  for (const measuredAt of moments) await api.addMeasurement(db, { ...draft(), measuredAt });
  const query = historyQuery({ sort: 'oldest', startDate: start, endDate: end });
  assert.deepEqual((await api.getMeasurements(db, -1, query)).map((item) => item.id), [2, 3, 4]);
  assert.equal(await api.countMeasurements(db, query), 3);
  assert.equal((await api.getMeasurements(db, 2, query)).length, 2);
  assert.equal(await api.countMeasurements(db, historyQuery({ ...DEFAULT_HISTORY_FILTERS, startDate: start })), 4);
  assert.equal(await api.countMeasurements(db, historyQuery({ ...DEFAULT_HISTORY_FILTERS, endDate: end })), 4);
  assert.equal(await api.countMeasurements(db, historyQuery(DEFAULT_HISTORY_FILTERS)), 5);
  assert.equal(start.getHours(), 0);
  assert.equal(end.getDate(), 11);
});

test('a one-day history filter includes the entire selected local day', async (t) => {
  const db = await fixture(t);
  const day = new Date(2026, 8, 10);
  for (const measuredAt of [day, new Date(2026, 8, 10, 23, 59, 59, 999), new Date(2026, 8, 11)]) {
    await api.addMeasurement(db, { ...draft(), measuredAt });
  }
  const query = historyQuery({ sort: 'newest', startDate: day, endDate: day });
  assert.equal(await api.countMeasurements(db, query), 2);
  assert.deepEqual((await api.getMeasurements(db, -1, query)).map((item) => item.id), [2, 1]);
});

test('upgrading an old readings table preserves measurements and backfills times exactly once', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, { ...draft(10, [reading(120), reading(121)]), note: 'keep this note' });
  await db.execAsync('ALTER TABLE measurement_readings DROP COLUMN measured_at');
  await api.initializeDatabase(db);
  const details = await api.getMeasurementById(db, 1);
  assert.equal(details.note, 'keep this note');
  assert.equal(details.readingCount, 2);
  assert.deepEqual(details.readings.map((item) => item.measuredAt), [iso(10), iso(10)]);
  await db.runAsync('UPDATE measurement_readings SET measured_at = ? WHERE position = 1', iso(11));
  await api.initializeDatabase(db);
  assert.deepEqual((await api.getMeasurementById(db, 1)).readings.map((item) => item.measuredAt), [iso(10), iso(11)]);
});

test('each series reading keeps its own time in details, JSON and restoration', async (t) => {
  const db = await fixture(t);
  const entries = [
    { values: reading(120), measuredAt: new Date(iso(10)) },
    { values: reading(121), measuredAt: new Date(iso(11)) },
  ];
  const readings = readingsFromEntries(entries);
  await api.addMeasurement(db, { ...draft(10, readings), readings });
  let details = await api.getMeasurementById(db, 1);
  assert.equal(details.measuredAt, iso(10));
  assert.deepEqual(details.readings.map((item) => item.measuredAt), [iso(10), iso(11)]);
  const backup = await api.buildBackupPayload(db);
  assert.deepEqual(backup.readings.map((item) => item.measured_at), [iso(10), iso(11)]);
  await api.restoreBackup(db, backup);
  details = await api.getMeasurementById(db, 1);
  assert.deepEqual(details.readings.map((item) => item.measuredAt), [iso(10), iso(11)]);
});

test('backups without individual reading times remain restorable', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft(10, [reading(120), reading(121)]));
  const backup = await api.buildBackupPayload(db);
  for (const item of backup.readings) delete item.measured_at;
  await api.restoreBackup(db, backup);
  assert.deepEqual((await api.getMeasurementById(db, 1)).readings.map((item) => item.measuredAt), [iso(10), iso(10)]);
});

test('incomplete and invalid entry blocks cannot be silently dropped when converting a series', () => {
  const complete = { values: reading(), measuredAt: new Date(iso(10)) };
  const incomplete = { values: { systolic: 120 }, measuredAt: new Date(iso(10)) };
  assert.equal(isEntryValid(incomplete), false);
  assert.equal(isEntryValid(complete), true);
  assert.throws(() => readingsFromEntries([complete, incomplete]));
  assert.throws(() => readingsFromEntries([{ ...complete, values: reading(70) }]));
  assert.throws(() => readingsFromEntries([{ ...complete, measuredAt: new Date('invalid') }]));
  assert.throws(() => readingsFromEntries(Array.from({ length: 4 }, () => complete)));
  assert.equal(readingsFromEntries([complete, complete, complete]).length, 3);
});

test('time statistics exclude records outside each interval while phase averages use the complete phase', async (t) => {
  const db = await fixture(t);
  const now = Date.parse('2026-09-17T12:00:00.000Z');
  for (const daysAgo of [100, 40, 10, 3, -1]) {
    await api.addMeasurement(db, { ...draft(), measuredAt: new Date(now - daysAgo * 86400000) });
  }
  const measurements = await api.getMeasurements(db, -1);
  const counts = { week: 1, month: 2, quarter: 3, all: 5 };
  for (const [interval, count] of Object.entries(counts)) {
    assert.equal(measurementsInWindow(measurements, statisticsWindow(interval, now)).length, count);
  }
  const phase = { id: 1, kind: 'clean', title: 'full phase', startedAt: new Date(now - 50 * 86400000).toISOString(), endedAt: new Date(now - 5 * 86400000).toISOString(), note: '' };
  assert.equal(statisticsForPhase(measurements, phase).count, 2);
  assert.equal(measurementsInWindow(measurements, statisticsWindow('week', now)).length, 1);
});

test('chart phase bands use time boundaries, include gaps without measurements and stay clipped to the interval', async (t) => {
  const db = await fixture(t);
  for (const day of [2, 3, 29]) await api.addMeasurement(db, draft(day));
  await api.createPhase(db, phase(1, 10));
  await api.createPhase(db, phase(10, 20, 'coffee'));
  await api.createPhase(db, phase(20, null, 'energy'));
  const window = { from: Date.parse(iso(5)), until: Date.parse(iso(25)) };
  const timeline = chartTimeline(await api.getMeasurements(db, -1), await api.getPhases(db), undefined, window);
  assert.deepEqual(timeline.bands.map((band) => [band.phase.kind, band.start, band.end]), [
    ['clean', 0, 0.25], ['coffee', 0.25, 0.75], ['energy', 0.75, 1],
  ]);
  const all = chartTimeline(await api.getMeasurements(db, -1));
  assert.deepEqual(all.points.map((item) => item.id), [1, 2, 3]);
  assert.equal(all.fraction(Date.parse(iso(3))), 1 / 27);
});

function descendants(element) {
  if (Array.isArray(element)) return element.flatMap(descendants);
  if (!element || typeof element !== 'object') return [];
  return [element, ...descendants(element.props?.children)];
}

test('rendered pressure charts retain narrow phase names and bands for week, month and three months', async (t) => {
  const db = await fixture(t);
  const now = Date.parse(iso(17));
  for (let minute = 0; minute < 60; minute += 1) {
    await api.addMeasurement(db, { ...draft(), measuredAt: new Date(now - minute * 60000) });
  }
  await api.createPhase(db, { ...phase(1), startedAt: new Date(now - 100 * 86400000).toISOString(), endedAt: new Date(now - 30 * 60000).toISOString() });
  await api.createPhase(db, { ...phase(1, null, 'coffee'), title: 'Short coffee phase', startedAt: new Date(now - 30 * 60000).toISOString() });
  const measurements = await api.getMeasurements(db, -1);
  const phases = await api.getPhases(db);
  for (const interval of ['week', 'month', 'quarter', 'all']) {
    const window = statisticsWindow(interval, now);
    const nodes = descendants(WeeklyChart({ measurements: measurementsInWindow(measurements, window), phases, window }));
    assert.ok(nodes.some((node) => node.type === 'Text' && node.props.children === 'Short coffee phase'), interval);
    assert.ok(nodes.some((node) => node.type === 'Rect' && node.props.fill === '#8B5E3C'), interval);
  }
});

test('a phase starting exactly at the last measurement remains visible at the chart boundary', async (t) => {
  const db = await fixture(t);
  await api.addMeasurement(db, draft(10));
  await api.addMeasurement(db, draft(11));
  await api.createPhase(db, phase(1, 11));
  await api.createPhase(db, phase(11, null, 'coffee'));
  const measurements = await api.getMeasurements(db, -1);
  const phases = await api.getPhases(db);
  const timeline = chartTimeline(measurements, phases);
  assert.deepEqual(timeline.bands.map((band) => band.phase.kind), ['clean', 'coffee']);
  const nodes = descendants(WeeklyChart({ measurements, phases }));
  assert.ok(nodes.some((node) => node.type === 'Text' && node.props.children === 'coffee'));
});

test('home chart spaces measurements evenly even when their timestamps are irregular', () => {
  const measurements = [
    { id: 1, measuredAt: '2026-09-01T08:00:00.000Z', systolic: 120, diastolic: 80, pulse: 70, wellbeing: 7 },
    { id: 2, measuredAt: '2026-09-01T08:01:00.000Z', systolic: 121, diastolic: 81, pulse: 71, wellbeing: 7 },
    { id: 3, measuredAt: '2026-09-10T20:00:00.000Z', systolic: 122, diastolic: 82, pulse: 72, wellbeing: 7 },
  ];
  const nodes = descendants(WeeklyChart({ measurements, pointSpacing: 'uniform' }));
  const systolicDots = nodes.filter((node) => node.type === 'Circle').slice(0, 3);
  assert.deepEqual(systolicDots.map((node) => node.props.cx), [42, 185, 328]);
});

test('an empty filtered chart explains the selected interval instead of claiming the diary is empty', () => {
  const message = 'Нет измерений в выбранном интервале';
  const nodes = descendants(WeeklyChart({ measurements: [], emptyMessage: message }));
  assert.ok(nodes.some((node) => node.type === 'Text' && node.props.children === message));
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
  assert.deepEqual(restored.phases.sort((a, b) => a.id - b.id), state.phases);
});

test('version 2 web backup is rejected by the legacy mobile importer without replacing current data', async (t) => {
  const model = require('../design-lab/model.js');
  const state = model.seed(Date.parse('2026-10-02T12:00:00.000Z'));
  state.phases = model.savePhase(state.phases, {
    kind: 'custom', title: 'Кофе', icon: 'coffee', color: model.PHASE_COLORS[0],
    startedAt: state.phases.at(-1).startedAt, endedAt: null, note: 'Параллельный период',
  });
  const db = await fixture(t);
  await api.addMeasurement(db, draft());
  await api.createPhase(db, phase(1, 20));
  const before = await snapshot(db);
  await assert.rejects(api.restoreBackup(db, model.backup(state)), /unsupported backup/);
  assert.deepEqual(await snapshot(db), before);
});
