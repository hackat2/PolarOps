import Dexie, { type EntityTable } from "dexie";

export interface SnapshotRecord {
  id: string;
  savedAt: number;
  payload: string;
}

export interface QueuedAction {
  id?: number;
  kind: string;
  payload: string;
  createdAt: number;
}

class PolarDatabase extends Dexie {
  snapshots!: EntityTable<SnapshotRecord, "id">;
  actions!: EntityTable<QueuedAction, "id">;

  constructor() {
    super("polar-ops-local");
    this.version(1).stores({
      snapshots: "id, savedAt",
      actions: "++id, createdAt",
    });
  }
}

export const offlineDb = new PolarDatabase();

export async function saveSnapshot(payload: unknown) {
  await offlineDb.snapshots.put({
    id: "latest",
    savedAt: Date.now(),
    payload: JSON.stringify(payload),
  });
}

export async function loadSnapshot<T>() {
  const record = await offlineDb.snapshots.get("latest");
  return record ? { data: JSON.parse(record.payload) as T, savedAt: record.savedAt } : undefined;
}

export async function queueAction(kind: string, payload: unknown) {
  await offlineDb.actions.add({
    kind,
    payload: JSON.stringify(payload),
    createdAt: Date.now(),
  });
}

export async function actionQueueSize() {
  return offlineDb.actions.count();
}

export async function clearQueuedActions() {
  await offlineDb.actions.clear();
}
