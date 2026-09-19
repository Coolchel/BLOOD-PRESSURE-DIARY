import type { SQLiteDatabase } from 'expo-sqlite';

import { measurementStats } from '@/constants/measurement-stats';

import type {
  MeasurementDetails,
  MeasurementDraft,
  MeasurementQuery,
  MeasurementReading,
  MeasurementSort,
  MeasurementSummary,
  Reading,
} from '@/types/measurement';
import type {
  ExperimentPhase,
  PhaseKind,
  PhaseStats,
  PhaseWithStats,
} from '@/types/experiment';

type MeasurementRow = {
  id: number;
  measured_at: string;
  wellbeing: number;
  tags_json: string;
  note: string;
  mode: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  reading_count: number;
};

function rowToSummary(row: MeasurementRow): MeasurementSummary {
  let tags: string[] = [];

  try {
    tags = JSON.parse(row.tags_json) as string[];
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    measuredAt: row.measured_at,
    wellbeing: row.wellbeing,
    tags,
    note: row.note,
    mode: row.mode === 'series' ? 'series' : 'single',
    systolic: Math.round(row.systolic),
    diastolic: Math.round(row.diastolic),
    pulse: Math.round(row.pulse),
    readingCount: row.reading_count,
    averages: { systolic: row.systolic, diastolic: row.diastolic, pulse: row.pulse },
  };
}

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS measurement_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      measured_at TEXT NOT NULL,
      wellbeing INTEGER NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      note TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL CHECK (mode IN ('single', 'series')),
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS measurement_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      systolic INTEGER NOT NULL,
      diastolic INTEGER NOT NULL,
      pulse INTEGER NOT NULL,
      position INTEGER NOT NULL,
      measured_at TEXT,
      FOREIGN KEY (session_id) REFERENCES measurement_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiment_phases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  const readingColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(measurement_readings)');
  if (!readingColumns.some((column) => column.name === 'measured_at')) {
    await db.execAsync('ALTER TABLE measurement_readings ADD COLUMN measured_at TEXT');
  }

  // Remove sample rows created by earlier versions without touching real measurements.
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM measurement_readings
       WHERE session_id IN (
         SELECT id FROM measurement_sessions WHERE is_demo = 1
       )`,
    );
    await db.runAsync('DELETE FROM measurement_sessions WHERE is_demo = 1');
    await db.runAsync(`UPDATE measurement_readings SET measured_at =
      (SELECT measured_at FROM measurement_sessions WHERE id = session_id)
      WHERE measured_at IS NULL`);
    if ((await getSetting(db, 'initial_phases_seeded')) !== 'yes') {
      await seedInitialPhases(db);
      await setSetting(db, 'initial_phases_seeded', 'yes');
    }
  });
}

export async function addMeasurement(db: SQLiteDatabase, draft: MeasurementDraft) {
  validateReadings(draft.mode, draft.readings);
  const readingTimes = draft.readings.map((reading) => backupDate(reading.measuredAt ?? draft.measuredAt.toISOString()));
  await db.withTransactionAsync(async () => {
    const session = await db.runAsync(
      `INSERT INTO measurement_sessions
        (measured_at, wellbeing, tags_json, note, mode, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      draft.measuredAt.toISOString(),
      draft.wellbeing,
      JSON.stringify(draft.tags),
      draft.note.trim(),
      draft.mode,
      new Date().toISOString(),
    );

    for (const [position, reading] of draft.readings.entries()) {
      await db.runAsync(
        `INSERT INTO measurement_readings
          (session_id, systolic, diastolic, pulse, position, measured_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        session.lastInsertRowId,
        reading.systolic,
        reading.diastolic,
        reading.pulse,
        position,
        readingTimes[position],
      );
    }
  });
}

export async function getMeasurements(
  db: SQLiteDatabase,
  limit = 60,
  query: MeasurementQuery = {},
): Promise<MeasurementSummary[]> {
  const orders: Record<MeasurementSort, string> = {
    newest: 's.measured_at DESC, s.id DESC',
    oldest: 's.measured_at ASC, s.id ASC',
    'systolic-desc': 'AVG(r.systolic) DESC, s.measured_at DESC, s.id DESC',
    'systolic-asc': 'AVG(r.systolic) ASC, s.measured_at DESC, s.id DESC',
    'diastolic-desc': 'AVG(r.diastolic) DESC, s.measured_at DESC, s.id DESC',
    'diastolic-asc': 'AVG(r.diastolic) ASC, s.measured_at DESC, s.id DESC',
    'pulse-desc': 'AVG(r.pulse) DESC, s.measured_at DESC, s.id DESC',
    'pulse-asc': 'AVG(r.pulse) ASC, s.measured_at DESC, s.id DESC',
  };
  const rows = await db.getAllAsync<MeasurementRow>(
    `SELECT
      s.id,
      s.measured_at,
      s.wellbeing,
      s.tags_json,
      s.note,
      s.mode,
      AVG(r.systolic) AS systolic,
      AVG(r.diastolic) AS diastolic,
      AVG(r.pulse) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     WHERE (? IS NULL OR s.measured_at >= ?) AND (? IS NULL OR s.measured_at < ?)
     GROUP BY s.id
     ORDER BY ${orders[query.sort ?? 'newest'] ?? orders.newest}
     LIMIT ?`,
    query.from ?? null,
    query.from ?? null,
    query.until ?? null,
    query.until ?? null,
    limit,
  );

  return rows.map(rowToSummary);
}

export async function getMeasurementById(
  db: SQLiteDatabase,
  id: number,
): Promise<MeasurementDetails | null> {
  const row = await db.getFirstAsync<MeasurementRow>(
    `SELECT
      s.id,
      s.measured_at,
      s.wellbeing,
      s.tags_json,
      s.note,
      s.mode,
      AVG(r.systolic) AS systolic,
      AVG(r.diastolic) AS diastolic,
      AVG(r.pulse) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`,
    id,
  );

  if (!row) return null;

  const readings = await db.getAllAsync<MeasurementReading>(
    `SELECT systolic, diastolic, pulse, measured_at AS measuredAt
     FROM measurement_readings
     WHERE session_id = ?
     ORDER BY position`,
    id,
  );

  return { ...rowToSummary(row), readings };
}

export async function clearMeasurements(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM measurement_readings');
    await db.runAsync('DELETE FROM measurement_sessions');
  });
}

type BackupSession = {
  id: number;
  measured_at: string;
  wellbeing: number;
  tags: string[];
  note: string;
  mode: MeasurementDraft['mode'];
  created_at: string;
};

type BackupReading = Reading & {
  session_id: number;
  position: number;
  measured_at?: string;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('invalid object');
  }
  return value as Record<string, unknown>;
}

function backupDate(value: unknown): string {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      Number.isNaN(Date.parse(value))) {
    throw new Error('invalid date');
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  if (calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) {
    throw new Error('invalid date');
  }
  return new Date(value).toISOString();
}

function createdAt(value: unknown): string {
  return value === undefined || value === '' ? new Date().toISOString() : backupDate(value);
}

function validReading(reading: Reading) {
  return (
    Number.isInteger(reading.systolic) && reading.systolic >= 60 && reading.systolic <= 260 &&
    Number.isInteger(reading.diastolic) && reading.diastolic >= 35 && reading.diastolic <= 160 &&
    reading.systolic > reading.diastolic &&
    Number.isInteger(reading.pulse) && reading.pulse >= 30 && reading.pulse <= 220
  );
}

function validateReadings(mode: MeasurementDraft['mode'], readings: Reading[]) {
  if (
    (mode !== 'single' && mode !== 'series') ||
    (mode === 'single' ? readings.length !== 1 : readings.length < 2 || readings.length > 3) ||
    readings.some((reading) => !validReading(reading))
  ) {
    throw new Error('invalid readings');
  }
}

function parseBackup(payload: unknown) {
  if (!payload || typeof payload !== 'object') throw new Error('invalid backup');
  const value = payload as Record<string, unknown>;
  if (value.app !== 'Давление' || value.version !== 1) throw new Error('unsupported backup');
  if (!Array.isArray(value.sessions) || !Array.isArray(value.readings)) {
    throw new Error('incomplete backup');
  }

  if (!value.sessions.length || !value.readings.length) throw new Error('empty backup');
  const sessions = value.sessions.map((item): BackupSession => {
    const session = record(item);
    if (
      typeof session.id !== 'number' || !Number.isSafeInteger(session.id) || session.id <= 0 ||
      typeof session.wellbeing !== 'number' || !Number.isInteger(session.wellbeing) ||
      session.wellbeing < 1 ||
      session.wellbeing > 10 ||
      !Array.isArray(session.tags) ||
      !session.tags.every((tag) => typeof tag === 'string') ||
      typeof session.note !== 'string' ||
      (session.mode !== 'single' && session.mode !== 'series')
    ) {
      throw new Error('invalid session');
    }
    return {
      id: session.id,
      measured_at: backupDate(session.measured_at),
      wellbeing: session.wellbeing,
      tags: session.tags,
      note: session.note,
      mode: session.mode,
      created_at: createdAt(session.created_at),
    };
  });

  const sessionIds = new Set(sessions.map((session) => session.id));
  const sessionTimes = new Map(sessions.map((session) => [session.id, session.measured_at]));
  if (sessionIds.size !== sessions.length) throw new Error('duplicate sessions');
  const readings = value.readings.map((item): BackupReading => {
    const reading = record(item);
    if (
      typeof reading.session_id !== 'number' ||
      !sessionIds.has(reading.session_id) ||
      typeof reading.systolic !== 'number' ||
      typeof reading.diastolic !== 'number' ||
      typeof reading.pulse !== 'number' ||
      typeof reading.position !== 'number' || !Number.isInteger(reading.position) ||
      reading.position < 0
    ) {
      throw new Error('invalid reading');
    }
    const parsed = {
      session_id: reading.session_id,
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      pulse: reading.pulse,
      position: reading.position,
      measured_at: backupDate(reading.measured_at === undefined ? sessionTimes.get(reading.session_id) : reading.measured_at),
    };
    if (!validReading(parsed)) throw new Error('invalid reading');
    return parsed;
  });
  const grouped = new Map<number, BackupReading[]>();
  for (const reading of readings) {
    const group = grouped.get(reading.session_id) ?? [];
    group.push(reading);
    grouped.set(reading.session_id, group);
  }
  for (const session of sessions) {
    const group = (grouped.get(session.id) ?? []).sort((a, b) => a.position - b.position);
    validateReadings(session.mode, group);
    if (group.some((reading, index) => reading.position !== index)) {
      throw new Error('invalid reading positions');
    }
  }

  // Периоды появились позже — копии без них должны открываться по-прежнему.
  let phases: BackupPhase[] | null = null;
  if (value.phases !== undefined) {
    if (!Array.isArray(value.phases)) throw new Error('invalid phases');

    phases = value.phases.map((item): BackupPhase => {
      const phase = record(item);
      if (
        typeof phase.id !== 'number' || !Number.isSafeInteger(phase.id) || phase.id <= 0 ||
        typeof phase.title !== 'string' || !phase.title.trim() ||
        typeof phase.note !== 'string' ||
        !PHASE_KIND_VALUES.some((kind) => kind === phase.kind)
      ) {
        throw new Error('invalid phase');
      }
      const parsed = {
        id: phase.id,
        kind: phase.kind as PhaseKind,
        title: phase.title,
        note: phase.note,
        started_at: backupDate(phase.started_at),
        ended_at: phase.ended_at == null ? null : backupDate(phase.ended_at),
        created_at: createdAt(phase.created_at),
      };
      if (parsed.ended_at !== null && parsed.ended_at <= parsed.started_at) {
        throw new Error('invalid phase range');
      }
      return parsed;
    });
    if (new Set(phases.map((phase) => phase.id)).size !== phases.length) {
      throw new Error('duplicate phases');
    }
    const ordered = phases.slice().sort((a, b) => a.started_at.localeCompare(b.started_at));
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      if (previous.ended_at === null || previous.ended_at > ordered[index].started_at) {
        throw new PhaseOverlapError();
      }
    }
  }

  return { sessions, readings, phases };
}

export async function restoreBackup(db: SQLiteDatabase, payload: unknown) {
  const backup = parseBackup(payload);

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM measurement_readings');
    await db.runAsync('DELETE FROM measurement_sessions');

    for (const session of backup.sessions) {
      await db.runAsync(
        `INSERT INTO measurement_sessions
          (id, measured_at, wellbeing, tags_json, note, mode, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        session.id,
        session.measured_at,
        session.wellbeing,
        JSON.stringify(session.tags),
        session.note,
        session.mode,
        session.created_at || new Date().toISOString(),
      );
    }

    for (const reading of backup.readings) {
      await db.runAsync(
        `INSERT INTO measurement_readings
          (session_id, systolic, diastolic, pulse, position, measured_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        reading.session_id,
        reading.systolic,
        reading.diastolic,
        reading.pulse,
        reading.position,
        reading.measured_at ?? null,
      );
    }

    // Копию без раздела периодов считаем «не знающей» о них и текущие не трогаем.
    if (backup.phases) {
      await db.runAsync('DELETE FROM experiment_phases');

      for (const phase of backup.phases) {
        await db.runAsync(
          `INSERT INTO experiment_phases
            (id, kind, title, started_at, ended_at, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          phase.id,
          phase.kind,
          phase.title,
          phase.started_at,
          phase.ended_at,
          phase.note,
          phase.created_at || new Date().toISOString(),
        );
      }
    }
    await setSetting(db, 'initial_phases_seeded', 'yes');
  });

  return { sessions: backup.sessions.length, phases: backup.phases?.length ?? null };
}

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key,
  );

  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function updateMeasurementNote(db: SQLiteDatabase, id: number, note: string) {
  await db.runAsync('UPDATE measurement_sessions SET note = ? WHERE id = ?', note.trim(), id);
}

export async function countMeasurements(db: SQLiteDatabase, query: MeasurementQuery = {}) {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM measurement_sessions
     WHERE (? IS NULL OR measured_at >= ?) AND (? IS NULL OR measured_at < ?)`,
    query.from ?? null,
    query.from ?? null,
    query.until ?? null,
    query.until ?? null,
  );

  return row?.total ?? 0;
}

export type BackupPhase = {
  id: number;
  kind: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  note: string;
  created_at: string;
};

export type BackupPayload = {
  app: string;
  version: number;
  exportedAt: string;
  sessions: BackupSession[];
  readings: BackupReading[];
  phases: BackupPhase[];
};

/** Собирает ту же структуру, что принимает restoreBackup — для ручного и автоматического экспорта. */
export async function buildBackupPayload(db: SQLiteDatabase): Promise<BackupPayload> {
  const sessions = await db.getAllAsync<{
    id: number;
    measured_at: string;
    wellbeing: number;
    tags_json: string;
    note: string;
    mode: string;
    created_at: string;
  }>(
    `SELECT id, measured_at, wellbeing, tags_json, note, mode, created_at
     FROM measurement_sessions
     ORDER BY measured_at DESC`,
  );

  const readings = await db.getAllAsync<BackupReading>(
    `SELECT r.session_id, r.systolic, r.diastolic, r.pulse, r.position, r.measured_at
     FROM measurement_readings r
     JOIN measurement_sessions s ON s.id = r.session_id
     ORDER BY r.session_id, r.position`,
  );

  const phases = await db.getAllAsync<BackupPhase>(
    `SELECT id, kind, title, started_at, ended_at, note, created_at
     FROM experiment_phases
     ORDER BY started_at`,
  );

  return {
    app: 'Давление',
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: sessions.map((session) => {
      let tags: string[] = [];

      try {
        tags = JSON.parse(session.tags_json) as string[];
      } catch {
        tags = [];
      }

      return {
        id: session.id,
        measured_at: session.measured_at,
        wellbeing: session.wellbeing,
        tags,
        note: session.note,
        mode: session.mode === 'series' ? 'series' : 'single',
        created_at: session.created_at,
      };
    }),
    readings,
    phases,
  };
}

type PhaseRow = {
  id: number;
  kind: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  note: string;
};

const PHASE_KIND_VALUES: PhaseKind[] = ['clean', 'coffee', 'energy', 'alcohol', 'mixed'];

function rowToPhase(row: PhaseRow): ExperimentPhase {
  const kind = PHASE_KIND_VALUES.find((value) => value === row.kind) ?? 'clean';

  return {
    id: row.id,
    kind,
    title: row.title,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    note: row.note,
  };
}

/**
 * Восстанавливает уже прожитые периоды при первом запуске: границу берём не из воздуха,
 * а из собственной заметки «Начало эксперимента…».
 */
async function seedInitialPhases(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM experiment_phases',
  );
  if ((existing?.total ?? 0) > 0) return;

  const first = await db.getFirstAsync<{ measured_at: string }>(
    'SELECT measured_at FROM measurement_sessions ORDER BY measured_at LIMIT 1',
  );
  if (!first) return;

  const marker = await db.getFirstAsync<{ measured_at: string }>(
    `SELECT measured_at FROM measurement_sessions
     WHERE note LIKE '%Начало эксперимента%'
     ORDER BY measured_at LIMIT 1`,
  );

  const createdAt = new Date().toISOString();

  if (!marker || marker.measured_at > first.measured_at) {
    await db.runAsync(
      `INSERT INTO experiment_phases (kind, title, started_at, ended_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      'clean',
      'Без всего',
      first.measured_at,
      marker?.measured_at ?? null,
      'Наблюдение без кофе, энергетиков и алкоголя.',
      createdAt,
    );
  }

  if (marker) {
    await db.runAsync(
      `INSERT INTO experiment_phases (kind, title, started_at, ended_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      'coffee',
      'Кофе',
      marker.measured_at,
      null,
      '1–2 чашки в день.',
      createdAt,
    );
  }
}

export async function getPhases(db: SQLiteDatabase): Promise<ExperimentPhase[]> {
  const rows = await db.getAllAsync<PhaseRow>(
    `SELECT id, kind, title, started_at, ended_at, note
     FROM experiment_phases
     ORDER BY started_at DESC`,
  );

  return rows.map(rowToPhase);
}

export async function getPhaseById(db: SQLiteDatabase, id: number) {
  const row = await db.getFirstAsync<PhaseRow>(
    `SELECT id, kind, title, started_at, ended_at, note
     FROM experiment_phases
     WHERE id = ?`,
    id,
  );

  return row ? rowToPhase(row) : null;
}

async function getPhaseStats(db: SQLiteDatabase, phase: ExperimentPhase): Promise<PhaseStats> {
  return measurementStats(await getMeasurementsInPhase(db, phase));
}

export async function getPhasesWithStats(db: SQLiteDatabase): Promise<PhaseWithStats[]> {
  const phases = await getPhases(db);
  const stats = await Promise.all(phases.map((phase) => getPhaseStats(db, phase)));

  return phases.map((phase, index) => ({ ...phase, stats: stats[index] }));
}

export async function getMeasurementsInPhase(
  db: SQLiteDatabase,
  phase: ExperimentPhase,
): Promise<MeasurementSummary[]> {
  const rows = await db.getAllAsync<MeasurementRow>(
    `SELECT
      s.id,
      s.measured_at,
      s.wellbeing,
      s.tags_json,
      s.note,
      s.mode,
      AVG(r.systolic) AS systolic,
      AVG(r.diastolic) AS diastolic,
      AVG(r.pulse) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     WHERE s.measured_at >= ? AND (? IS NULL OR s.measured_at < ?)
     GROUP BY s.id
     ORDER BY s.measured_at DESC, s.id DESC`,
    phase.startedAt,
    phase.endedAt,
    phase.endedAt,
  );

  return rows.map(rowToSummary);
}

export type PhaseInput = {
  kind: PhaseKind;
  title: string;
  startedAt: string;
  endedAt: string | null;
  note: string;
};

export class PhaseOverlapError extends Error {
  constructor() {
    super('Даты пересекаются с другим периодом. Измени начало или окончание периода.');
    this.name = 'PhaseOverlapError';
  }
}

function normalizedPhase(input: PhaseInput): PhaseInput {
  const startedAt = backupDate(input.startedAt);
  const endedAt = input.endedAt === null ? null : backupDate(input.endedAt);
  if (!input.title.trim() || !PHASE_KIND_VALUES.includes(input.kind) ||
      (endedAt !== null && endedAt <= startedAt)) {
    throw new Error('invalid phase');
  }
  return { ...input, startedAt, endedAt };
}

function overlaps(input: PhaseInput, phase: ExperimentPhase) {
  return (input.endedAt === null || phase.startedAt < input.endedAt) &&
    (phase.endedAt === null || input.startedAt < phase.endedAt);
}

/** Новый период может закрыть предыдущий открытый, но не пересекать остальные. */
export async function createPhase(db: SQLiteDatabase, input: PhaseInput) {
  input = normalizedPhase(input);
  await db.withTransactionAsync(async () => {
    const phases = await getPhases(db);
    const previous = phases.find((phase) => phase.endedAt === null && phase.startedAt < input.startedAt);
    if (phases.some((phase) => overlaps(input,
      phase.id === previous?.id ? { ...phase, endedAt: input.startedAt } : phase))) {
      throw new PhaseOverlapError();
    }
    if (previous) {
      await db.runAsync(
        `UPDATE experiment_phases
         SET ended_at = ?
         WHERE id = ?`,
        input.startedAt,
        previous.id,
      );
    }

    await db.runAsync(
      `INSERT INTO experiment_phases (kind, title, started_at, ended_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.kind,
      input.title.trim(),
      input.startedAt,
      input.endedAt,
      input.note.trim(),
      new Date().toISOString(),
    );
  });
}

export async function updatePhase(db: SQLiteDatabase, id: number, input: PhaseInput) {
  input = normalizedPhase(input);
  await db.withTransactionAsync(async () => {
    if ((await getPhases(db)).some((phase) => phase.id !== id && overlaps(input, phase))) {
      throw new PhaseOverlapError();
    }
    await db.runAsync(
      `UPDATE experiment_phases
       SET kind = ?, title = ?, started_at = ?, ended_at = ?, note = ?
       WHERE id = ?`,
      input.kind,
      input.title.trim(),
      input.startedAt,
      input.endedAt,
      input.note.trim(),
      id,
    );
  });
}

export async function deletePhase(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM experiment_phases WHERE id = ?', id);
}
