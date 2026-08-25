import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  MeasurementDetails,
  MeasurementDraft,
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

  await seedInitialPhases(db);

  // Remove sample rows created by earlier versions without touching real measurements.
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM measurement_readings
       WHERE session_id IN (
         SELECT id FROM measurement_sessions WHERE is_demo = 1
       )`,
    );
    await db.runAsync('DELETE FROM measurement_sessions WHERE is_demo = 1');
  });
}

export async function addMeasurement(db: SQLiteDatabase, draft: MeasurementDraft) {
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
          (session_id, systolic, diastolic, pulse, position)
         VALUES (?, ?, ?, ?, ?)`,
        session.lastInsertRowId,
        reading.systolic,
        reading.diastolic,
        reading.pulse,
        position,
      );
    }
  });
}

export async function getMeasurements(
  db: SQLiteDatabase,
  limit = 60,
): Promise<MeasurementSummary[]> {
  const rows = await db.getAllAsync<MeasurementRow>(
    `SELECT
      s.id,
      s.measured_at,
      s.wellbeing,
      s.tags_json,
      s.note,
      s.mode,
      ROUND(AVG(r.systolic), 1) AS systolic,
      ROUND(AVG(r.diastolic), 1) AS diastolic,
      ROUND(AVG(r.pulse), 1) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     GROUP BY s.id
     ORDER BY s.measured_at DESC
     LIMIT ?`,
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
      ROUND(AVG(r.systolic), 1) AS systolic,
      ROUND(AVG(r.diastolic), 1) AS diastolic,
      ROUND(AVG(r.pulse), 1) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`,
    id,
  );

  if (!row) return null;

  const readings = await db.getAllAsync<Reading>(
    `SELECT systolic, diastolic, pulse
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
};

function parseBackup(payload: unknown) {
  if (!payload || typeof payload !== 'object') throw new Error('invalid backup');
  const value = payload as Record<string, unknown>;
  if (value.app !== 'Давление' || value.version !== 1) throw new Error('unsupported backup');
  if (!Array.isArray(value.sessions) || !Array.isArray(value.readings)) {
    throw new Error('incomplete backup');
  }

  const sessions = value.sessions as BackupSession[];
  const readings = value.readings as BackupReading[];
  if (!sessions.length || !readings.length) throw new Error('empty backup');

  for (const session of sessions) {
    if (
      !Number.isInteger(session.id) ||
      Number.isNaN(Date.parse(session.measured_at)) ||
      !Number.isInteger(session.wellbeing) ||
      session.wellbeing < 1 ||
      session.wellbeing > 10 ||
      !Array.isArray(session.tags) ||
      typeof session.note !== 'string' ||
      (session.mode !== 'single' && session.mode !== 'series')
    ) {
      throw new Error('invalid session');
    }
  }

  const sessionIds = new Set(sessions.map((session) => session.id));
  for (const reading of readings) {
    if (
      !sessionIds.has(reading.session_id) ||
      !Number.isInteger(reading.systolic) ||
      reading.systolic < 60 ||
      reading.systolic > 260 ||
      !Number.isInteger(reading.diastolic) ||
      reading.diastolic < 35 ||
      reading.diastolic > 160 ||
      !Number.isInteger(reading.pulse) ||
      reading.pulse < 30 ||
      reading.pulse > 220 ||
      !Number.isInteger(reading.position) ||
      reading.position < 0
    ) {
      throw new Error('invalid reading');
    }
  }

  // Периоды появились позже — копии без них должны открываться по-прежнему.
  let phases: BackupPhase[] | null = null;
  if (value.phases !== undefined) {
    if (!Array.isArray(value.phases)) throw new Error('invalid phases');

    phases = (value.phases as BackupPhase[]).map((phase) => ({
      ...phase,
      ended_at: phase.ended_at ?? null,
    }));

    for (const phase of phases) {
      if (
        !Number.isInteger(phase.id) ||
        typeof phase.title !== 'string' ||
        typeof phase.note !== 'string' ||
        !PHASE_KIND_VALUES.some((kind) => kind === phase.kind) ||
        Number.isNaN(Date.parse(phase.started_at)) ||
        (phase.ended_at !== null && Number.isNaN(Date.parse(phase.ended_at)))
      ) {
        throw new Error('invalid phase');
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
          (session_id, systolic, diastolic, pulse, position)
         VALUES (?, ?, ?, ?, ?)`,
        reading.session_id,
        reading.systolic,
        reading.diastolic,
        reading.pulse,
        reading.position,
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

export async function countMeasurements(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM measurement_sessions',
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
    `SELECT r.session_id, r.systolic, r.diastolic, r.pulse, r.position
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
  const row = await db.getFirstAsync<{
    count: number;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    wellbeing: number | null;
  }>(
    `SELECT
       COUNT(*) AS count,
       AVG(agg.systolic) AS systolic,
       AVG(agg.diastolic) AS diastolic,
       AVG(agg.pulse) AS pulse,
       AVG(agg.wellbeing) AS wellbeing
     FROM (
       SELECT
         s.wellbeing AS wellbeing,
         AVG(r.systolic) AS systolic,
         AVG(r.diastolic) AS diastolic,
         AVG(r.pulse) AS pulse
       FROM measurement_sessions s
       JOIN measurement_readings r ON r.session_id = s.id
       WHERE s.measured_at >= ? AND (? IS NULL OR s.measured_at < ?)
       GROUP BY s.id
     ) agg`,
    phase.startedAt,
    phase.endedAt,
    phase.endedAt,
  );

  return {
    count: row?.count ?? 0,
    systolic: Math.round(row?.systolic ?? 0),
    diastolic: Math.round(row?.diastolic ?? 0),
    pulse: Math.round(row?.pulse ?? 0),
    wellbeing: Math.round((row?.wellbeing ?? 0) * 10) / 10,
  };
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
      ROUND(AVG(r.systolic), 1) AS systolic,
      ROUND(AVG(r.diastolic), 1) AS diastolic,
      ROUND(AVG(r.pulse), 1) AS pulse,
      COUNT(r.id) AS reading_count
     FROM measurement_sessions s
     JOIN measurement_readings r ON r.session_id = s.id
     WHERE s.measured_at >= ? AND (? IS NULL OR s.measured_at < ?)
     GROUP BY s.id
     ORDER BY s.measured_at DESC`,
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

/** Новый период закрывает предыдущий открытый — периоды идут встык, без разрывов и нахлёстов. */
export async function createPhase(db: SQLiteDatabase, input: PhaseInput) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE experiment_phases
       SET ended_at = ?
       WHERE ended_at IS NULL AND started_at <= ?`,
      input.startedAt,
      input.startedAt,
    );

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
}

export async function deletePhase(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM experiment_phases WHERE id = ?', id);
}
