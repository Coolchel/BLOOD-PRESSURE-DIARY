import type { SQLiteDatabase } from 'expo-sqlite';

import { createPhase, deletePhase, updatePhase } from '@/data/database';
import type { PhaseInput } from '@/data/database';

export async function savePhase(db: SQLiteDatabase, input: PhaseInput, id: number | null = null) {
  if (id === null) {
    await createPhase(db, input);
  } else {
    await updatePhase(db, id, input);
  }
}

export async function removePhase(db: SQLiteDatabase, id: number) {
  await deletePhase(db, id);
}
