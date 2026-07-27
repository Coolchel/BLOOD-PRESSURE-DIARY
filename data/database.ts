import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  MeasurementDetails,
  MeasurementDraft,
  MeasurementSummary,
  Reading,
} from '@/types/measurement';

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
  `);

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

  return { sessions, readings };
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
  });

  return backup.sessions.length;
}
