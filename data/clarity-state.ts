import type { SQLiteDatabase } from "expo-sqlite";
import * as M from "../design-lab/model";
import {
  buildBackupPayload,
  getPhases,
  getSetting,
  setSetting,
} from "./database";

export const DRAFTS_KEY = "clarity_drafts_v1";
export const STATISTICS_KEY = "clarity_statistics_v1";

export async function readClarityState(db: SQLiteDatabase): Promise<M.State> {
  const payload = await buildBackupPayload(db);
  const data = payload.sessions.length
    ? M.restore(payload, [], { enforcePhaseLimit: false })
    : { sessions: [], phases: await getPhases(db) };
  const raw = await getSetting(db, DRAFTS_KEY);
  const state = { ...M.factoryState(), ...data };
  if (raw) {
    const saved = JSON.parse(raw) as Pick<M.State, "drafts" | "draftMode">;
    if (!saved.drafts || !["single", "series"].includes(saved.draftMode))
      throw new Error("Проверьте запись.");
    for (const mode of ["single", "series"] as const) {
      const draft = saved.drafts[mode];
      if (draft === null) continue;
      if (
        !draft ||
        draft.mode !== mode ||
        !Array.isArray(draft.readings) ||
        draft.readings.length < 1 ||
        draft.readings.length > M.MAX_SERIES_READINGS ||
        draft.readings.some(
          (r) =>
            !r ||
            !["systolic", "diastolic", "pulse"].every(
              (key) => typeof r[key as keyof M.DraftReading] === "string",
            ) ||
            !Number.isFinite(Date.parse(r.measuredAt)),
        ) ||
        !Array.isArray(draft.tags) ||
        draft.tags.some((tag) => typeof tag !== "string") ||
        typeof draft.note !== "string" ||
        !Number.isInteger(draft.wellbeing) ||
        draft.wellbeing < 1 ||
        draft.wellbeing > 10
      )
        throw new Error("Проверьте запись.");
    }
    state.drafts = saved.drafts;
    state.draftMode = saved.draftMode;
    state.draft = state.drafts[state.draftMode];
  }
  return state;
}

export async function writeClarityDrafts(db: SQLiteDatabase, state: M.State) {
  await setSetting(
    db,
    DRAFTS_KEY,
    JSON.stringify({ drafts: state.drafts, draftMode: state.draftMode }),
  );
}

export async function readClarityPreferences(
  db: SQLiteDatabase,
  phases: M.Phase[],
) {
  const raw = await getSetting(db, STATISTICS_KEY);
  let saved: unknown = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    /* Preserve invalid bytes while using safe defaults. */
  }
  return M.statisticsPreferences(saved, phases);
}

export async function writeClarityPreferences(
  db: SQLiteDatabase,
  preferences: M.Preferences,
) {
  await setSetting(db, STATISTICS_KEY, JSON.stringify(preferences));
}
