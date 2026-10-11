const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const M = require('./model.js');

const filename = 'davlenie-autobackup.json';
const themes = { clarity: 'Ясно', calm: 'Тихий ритм', coral: 'Коралл', night: 'Ночной пульс' };
const maxBytes = 10 * 1024 * 1024;
const defaultRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'BloodPressureDiary', 'Backups');

function openExplorer(folder) {
  if (process.platform !== 'win32') throw Error('Просмотр этой папки доступен в Windows.');
  return new Promise((resolve, reject) => {
    const child = spawn('explorer.exe', [folder], { detached: true, stdio: 'ignore', shell: false });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}

function createLocalBackups({ root = defaultRoot, openFolder = openExplorer, io = fs } = {}) {
  const queues = new Map();
  function folderFor(diary) {
    if (typeof diary !== 'string') throw Error('Неизвестный дневник.');
    if (Object.hasOwn(themes, diary)) return path.join(root, themes[diary]);
    if (/^qa-[a-z0-9-]{1,64}$/.test(diary)) return path.join(root, '_test', diary);
    throw Error('Неизвестный дневник.');
  }
  async function read(file) {
    try { return await io.readFile(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async function write(file, content) {
    const temporary = file + '.' + randomUUID() + '.tmp';
    try {
      await io.writeFile(temporary, content, { flag: 'wx', mode: 0o600 });
      await io.rename(temporary, file);
    } finally { await io.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
  function snapshot(copy) {
    if (!copy || typeof copy.at !== 'string' || !Number.isFinite(Date.parse(copy.at))
      || copy.payload?.exportedAt !== copy.at) throw Error('Не удалось прочитать сохранённую копию.');
    M.restore(copy.payload, [], { enforcePhaseLimit: false });
    return JSON.stringify(copy.payload, null, 2) + '\n';
  }
  async function sync(file, copy) {
    if (copy === null) return false;
    const content = snapshot(copy), current = await read(file);
    if (current === content) return false;
    // A stale browser tab must not replace a newer daily snapshot.
    if (current !== null) {
      let saved;
      try { saved = JSON.parse(current); }
      catch { throw Error('Файл копии повреждён. Сохраните его отдельно перед заменой.'); }
      if (saved.app !== 'Давление' || !Number.isFinite(Date.parse(saved.exportedAt))) {
        throw Error('В папке уже находится другой файл с именем копии.');
      }
      if (Date.parse(saved.exportedAt) >= Date.parse(copy.at)) return false;
    }
    await write(file, content);
    return true;
  }
  async function operate(action, diary, copy, previous) {
    const folder = folderFor(diary), file = path.join(folder, filename);
    await io.mkdir(folder, { recursive: true });
    if (action === 'reset') {
      const saved = await read(file);
      if (saved !== null) await io.unlink(file);
      return { previous: saved };
    }
    if (action === 'rollback') {
      if (previous !== null && typeof previous !== 'string') throw Error('Некорректная копия.');
      if (previous !== null) {
        if (await read(file) !== null) throw Error('Папка уже содержит другую копию.');
        await write(file, previous);
      }
      return {};
    }
    if (!['sync', 'open'].includes(action)) throw Error('Неизвестное действие.');
    let warning, updated = false;
    try {
      updated = await sync(file, copy);
    } catch (error) {
      if (action !== 'open') throw error;
      // Even a damaged file must remain reachable in Explorer for recovery.
      warning = error.code ? 'Не удалось записать файл копии.' : error.message;
    }
    if (action === 'open') await openFolder(folder);
    return { path: folder, opened: action === 'open', updated, ...(warning ? { warning } : {}) };
  }
  return {
    folderFor,
    run(action, diary, copy = null, previous = null) {
      // Validate before touching the filesystem, and serialize operations for one diary.
      folderFor(diary);
      const pending = (queues.get(diary) || Promise.resolve()).then(() => operate(action, diary, copy, previous));
      const settled = pending.catch(() => {});
      queues.set(diary, settled);
      settled.then(() => { if (queues.get(diary) === settled) queues.delete(diary); });
      return pending;
    },
  };
}

function createBackupHandler(manager, port) {
  const allowedHosts = new Set(['localhost:' + port, '127.0.0.1:' + port]);
  return async (req, res, url) => {
    if (!url.pathname.startsWith('/api/backup/')) return false;
    const reply = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    };
    if (req.method !== 'POST') { reply(405, { error: 'Действие недоступно.' }); return true; }
    // No cross-site requests, arbitrary paths, or shell command arguments.
    if (!allowedHosts.has(req.headers.host) || req.headers.origin !== 'http://' + req.headers.host
      || req.headers['content-type']?.split(';')[0] !== 'application/json') {
      reply(403, { error: 'Откройте дневник на localhost.' }); return true;
    }
    const action = url.pathname.slice('/api/backup/'.length);
    if (!['sync', 'open', 'reset', 'rollback'].includes(action)) { reply(404, { error: 'Действие не найдено.' }); return true; }
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > maxBytes) { reply(413, { error: 'Файл копии слишком большой.' }); return true; }
        chunks.push(chunk);
      }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const result = await manager.run(action, input.diary, input.copy ?? null, input.previous ?? null);
      reply(200, result);
    } catch (error) {
      // Do not expose OS errors containing private paths to unrelated requesters.
      reply(400, { error: error.code ? 'Папка копии недоступна. Попробуйте ещё раз.' : error.message });
    }
    return true;
  };
}

module.exports = { createLocalBackups, createBackupHandler, filename, defaultRoot };
