import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DangerZone, SafePlace, Alert, RumorNotice, SosRequest } from '../../../shared/types.js';

interface SafeStayDB extends DBSchema {
  zones: {
    key: string;
    value: DangerZone;
  };
  shelters: {
    key: string;
    value: SafePlace;
  };
  alerts: {
    key: string;
    value: Alert;
  };
  rumors: {
    key: string;
    value: RumorNotice;
  };
  sosQueue: {
    key: string;
    value: SosRequest;
  };
  meta: {
    key: string;
    value: { id: string; lastUpdated: number };
  };
}

let dbPromise: Promise<IDBPDatabase<SafeStayDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SafeStayDB>('safestay-cache-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('zones')) {
          db.createObjectStore('zones', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('shelters')) {
          db.createObjectStore('shelters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('rumors')) {
          db.createObjectStore('rumors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sosQueue')) {
          db.createObjectStore('sosQueue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

export async function cacheAllData(data: {
  zones?: DangerZone[];
  shelters?: SafePlace[];
  alerts?: Alert[];
  rumors?: RumorNotice[];
}) {
  const db = await getDb();
  const tx = db.transaction(['zones', 'shelters', 'alerts', 'rumors', 'meta'], 'readwrite');

  if (data.zones) {
    for (const z of data.zones) await tx.objectStore('zones').put(z);
  }
  if (data.shelters) {
    for (const s of data.shelters) await tx.objectStore('shelters').put(s);
  }
  if (data.alerts) {
    for (const a of data.alerts) await tx.objectStore('alerts').put(a);
  }
  if (data.rumors) {
    for (const r of data.rumors) await tx.objectStore('rumors').put(r);
  }

  await tx.objectStore('meta').put({ id: 'last_sync', lastUpdated: Date.now() });
  await tx.done;
}

export async function getCachedZones(): Promise<DangerZone[]> {
  const db = await getDb();
  return db.getAll('zones');
}

export async function getCachedShelters(): Promise<SafePlace[]> {
  const db = await getDb();
  return db.getAll('shelters');
}

export async function getCachedRumors(): Promise<RumorNotice[]> {
  const db = await getDb();
  return db.getAll('rumors');
}

export async function getLastSyncTime(): Promise<number | null> {
  const db = await getDb();
  const meta = await db.get('meta', 'last_sync');
  return meta ? meta.lastUpdated : null;
}

export async function queueOfflineSos(sos: SosRequest): Promise<void> {
  const db = await getDb();
  await db.put('sosQueue', sos);
}

export async function getQueuedSos(): Promise<SosRequest[]> {
  const db = await getDb();
  return db.getAll('sosQueue');
}

export async function removeQueuedSos(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sosQueue', id);
}
