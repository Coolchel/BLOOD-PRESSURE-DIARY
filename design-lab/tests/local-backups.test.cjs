const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { test } = require('node:test');
const M = require('../model.js');
const { createLocalBackups, createBackupHandler, filename } = require('../local-backups.cjs');
const { localBackups, resetStoredDiary } = require('../file-actions.js');

const copyAt = (at) => M.withAutoBackup({ ...M.seed(), lastBackup: null, backupCopy: null }, Date.parse(at)).backupCopy;
async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'diary-backup-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('diary-backup-test-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  const opened = [], manager = createLocalBackups({ root, openFolder: async folder => opened.push(folder), ...options });
  const folder = manager.folderFor('clarity'), file = path.join(folder, filename);
  return { manager, folder, file, opened, root };
}

test('the Windows mirror keeps the exact saved snapshot and does not rewrite it when reopened', async t => {
  const { manager, folder, file, opened } = await fixture(t);
  const copy = copyAt('2026-10-10T19:15:00.000Z');
  await manager.run('sync', 'clarity', copy);
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), copy.payload);
  await fs.utimes(file, new Date(0), new Date(0));
  const before = (await fs.stat(file)).mtimeMs;
  const result = await manager.run('open', 'clarity', copy);
  assert.equal(result.path, folder); assert.deepEqual(opened, [folder]);
  assert.equal((await fs.stat(file)).mtimeMs, before);
  assert.deepEqual(await fs.readdir(folder), [filename]);
});

test('a newer snapshot replaces the only file while a stale tab cannot overwrite it', async t => {
  const { manager, folder, file } = await fixture(t);
  const old = copyAt('2026-10-10T19:15:00.000Z'), next = copyAt('2026-10-11T19:15:00.000Z');
  next.payload.sessions[0].note = 'Новая заметка';
  await Promise.all([manager.run('sync', 'clarity', old), manager.run('sync', 'clarity', next), manager.run('sync', 'clarity', old)]);
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), next.payload);
  assert.deepEqual(await fs.readdir(folder), [filename]);
});

test('an empty diary opens its default folder without creating a JSON or deleting an existing file', async t => {
  const { manager, folder, file, opened } = await fixture(t);
  await manager.run('open', 'clarity');
  assert.deepEqual(await fs.readdir(folder), []); assert.deepEqual(opened, [folder]);
  await manager.run('sync', 'clarity', copyAt('2026-10-10T19:15:00.000Z'));
  const content = await fs.readFile(file, 'utf8');
  await manager.run('open', 'clarity');
  assert.equal(await fs.readFile(file, 'utf8'), content);
});

test('a failed atomic replacement preserves the prior backup and removes its temporary file', async t => {
  let fail = false;
  const io = { ...fs, rename: async (...args) => { if (fail) throw Object.assign(Error('write failed'), { code: 'EACCES' }); return fs.rename(...args); } };
  const { manager, folder, file } = await fixture(t, { io });
  await manager.run('sync', 'clarity', copyAt('2026-10-10T19:15:00.000Z'));
  const before = await fs.readFile(file, 'utf8'); fail = true;
  await assert.rejects(manager.run('sync', 'clarity', copyAt('2026-10-11T19:15:00.000Z')), /write failed/);
  assert.equal(await fs.readFile(file, 'utf8'), before); assert.deepEqual(await fs.readdir(folder), [filename]);
});

test('factory reset deletes only the diary backup and rollback restores its exact bytes', async t => {
  const { manager, folder, file } = await fixture(t);
  await manager.run('sync', 'clarity', copyAt('2026-10-10T19:15:00.000Z'));
  await fs.writeFile(path.join(folder, 'user-note.json'), 'keep');
  const before = await fs.readFile(file, 'utf8'), removed = await manager.run('reset', 'clarity');
  assert.equal(removed.previous, before); assert.deepEqual(await fs.readdir(folder), ['user-note.json']);
  await manager.run('rollback', 'clarity', null, removed.previous);
  assert.equal(await fs.readFile(file, 'utf8'), before);
  assert.equal(await fs.readFile(path.join(folder, 'user-note.json'), 'utf8'), 'keep');
});

test('unknown paths and invalid snapshots cannot overwrite a valid file; QA diaries are isolated', async t => {
  const { manager, folder, file, root } = await fixture(t);
  const copy = copyAt('2026-10-10T19:15:00.000Z');
  await manager.run('sync', 'clarity', copy);
  const before = await fs.readFile(file, 'utf8');
  for (const value of ['../clarity', 'qa-../clarity', 'C:\\Users\\yan', '__proto__', 'qa-', ['clarity'], null]) {
    assert.throws(() => manager.run('open', value), /Неизвестный дневник/);
  }
  await assert.rejects(manager.run('sync', 'clarity', { ...copy, at: 'invalid' }));
  assert.equal(await fs.readFile(file, 'utf8'), before);
  const qa = await manager.run('sync', 'qa-folder-check', copy);
  assert.equal(qa.path, path.join(root, '_test', 'qa-folder-check')); assert.notEqual(qa.path, folder);
  await fs.writeFile(file, 'broken JSON');
  await assert.rejects(manager.run('sync', 'clarity', copy), /повреждён/);
  assert.equal(await fs.readFile(file, 'utf8'), 'broken JSON');
  const opened = await manager.run('open', 'clarity', copy);
  assert.equal(opened.opened, true); assert.match(opened.warning, /повреждён/);
  assert.equal(await fs.readFile(file, 'utf8'), 'broken JSON');
});

test('the local bridge rejects cross-origin requests and exposes only its fixed backup actions', async t => {
  const { manager, opened } = await fixture(t);
  let handler;
  const server = http.createServer(async (req, res) => { if (!await handler(req, res, new URL(req.url, 'http://localhost'))) { res.writeHead(404); res.end(); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port, origin = 'http://127.0.0.1:' + port;
  handler = createBackupHandler(manager, port);
  const send = (action, values, headers = {}) => fetch(origin + '/api/backup/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(values) });
  assert.equal((await send('open', { diary: 'clarity' }, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await send('open', { diary: 'clarity' }, { Origin: '' })).status, 403);
  assert.equal((await send('unknown', { diary: 'clarity' })).status, 404);
  assert.equal((await send('open', { diary: '../outside' })).status, 400);
  assert.deepEqual(opened, []);
  const response = await send('open', { diary: 'clarity', copy: copyAt('2026-10-10T19:15:00.000Z') });
  assert.equal(response.status, 200); assert.equal((await response.json()).opened, true); assert.equal(opened.length, 1);
});

test('the client serializes copy and reset operations and restores the disk copy when browser storage fails', async () => {
  const calls = [];
  const client = localBackups('qa-client', { fetch: async (url, options) => {
    calls.push({ url, ...JSON.parse(options.body) });
    return { ok: true, json: async () => url.endsWith('/reset') ? { previous: 'original JSON bytes' } : {} };
  } });
  const values = new Map([['prefs', 'median'], ['diary', 'existing diary']]);
  const storage = { getItem: key => values.get(key) ?? null, removeItem: key => values.delete(key), setItem: (key, value) => {
    if (key === 'diary') throw Error('quota'); values.set(key, value);
  } };
  const sync = client.sync({ at: 'saved' });
  await assert.rejects(client.reset(() => resetStoredDiary(storage, 'diary', 'prefs', {})), /quota/);
  await sync;
  assert.deepEqual(calls.map(call => call.url), ['/api/backup/sync', '/api/backup/reset', '/api/backup/rollback']);
  assert.equal(calls[2].previous, 'original JSON bytes'); assert.equal(values.get('prefs'), 'median'); assert.equal(values.get('diary'), 'existing diary');
});

test('a failed disk reset does not clear the browser diary and successful reset allows subsequent requests', async () => {
  let fail = true, committed = false;
  const client = localBackups('qa-reset', { fetch: async () => ({ ok: !fail, json: async () => fail ? { error: 'Unavailable' } : { previous: null } }) });
  await assert.rejects(client.reset(() => { committed = true; }), /Unavailable/); assert.equal(committed, false);
  fail = false; await client.reset(() => { committed = true; }); assert.equal(committed, true);
  await client.open(null);
});
