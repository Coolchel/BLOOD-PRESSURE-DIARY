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
const documentDirectory = { list: () => [...files.keys()].map((name) => new FakeFile(documentDirectory, name)) };
class FakeFile {
  constructor(directory, name) { this.name = name; }
  write(value) {
    if (failFileWrite) throw new Error('simulated file write failure');
    files.set(this.name, value);
  }
  delete() { files.delete(this.name); }
}
function loadTS(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'expo-file-system') return { File: FakeFile, Paths: { document: documentDirectory } };
    return name.startsWith('@/') ? loadTS(`${name.slice(2)}.ts`) : require(name);
  };
  new Function('exports', 'require', 'module', code)(module.exports, localRequire, module);
  return module.exports;
}

const api = loadTS('data/database.ts');
const { measurementStats } = loadTS('constants/measurement-stats.ts');
const { cleanBaseline } = loadTS('constants/phase-format.ts');
const { findPhaseFor } = loadTS('types/experiment.ts');
const { savePhase, removePhase } = loadTS('data/phase-actions.ts');
const { setAutoBackupEnabled } = loadTS('data/auto-backup.ts');
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

test('history can reveal all 450 records, including equal timestamps, with the full count', async (t) => {
  const db = await fixture(t);
  for (let index = 0; index < 450; index += 1) await api.addMeasurement(db, draft());
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

test('editor actions update the JSON copy after creating, editing and deleting periods', async (t) => {
  const db = await fixture(t);
  files.clear();
  await api.addMeasurement(db, draft());
  const copied = () => JSON.parse(files.get('davlenie-autobackup.json'));
  await savePhase(db, phase(1));
  assert.equal(copied().phases.length, 1);
  const id = (await api.getPhases(db))[0].id;
  await savePhase(db, { ...phase(1), title: 'edited' }, id);
  assert.equal(copied().phases[0].title, 'edited');
  await removePhase(db, id);
  assert.deepEqual(copied().phases, []);
  assert.equal(copied().sessions.length, 1);
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
