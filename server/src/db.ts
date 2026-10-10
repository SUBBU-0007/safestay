import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../safestay.db');

export interface DatabaseAdapter {
  exec(sql: string): void;
  pragma(str: string): void;
  prepare(sql: string): {
    all(...params: any[]): any[];
    get(...params: any[]): any | undefined;
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
  };
  transaction?<T>(fn: (...args: any[]) => T): (...args: any[]) => T;
}

let dbInstance: DatabaseAdapter;

try {
  // Attempt native better-sqlite3 first
  const Database = (await import('better-sqlite3')).default;
  const nativeDb = new Database(dbPath);
  nativeDb.pragma('journal_mode = WAL');
  dbInstance = nativeDb as unknown as DatabaseAdapter;
  console.log('[DB] Connected via native better-sqlite3 engine');
} catch {
  // Pure WebAssembly fallback (Node 24 / cross-platform compatible without C++ compiler)
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();
  let fileBuffer: Buffer | null = null;
  if (fs.existsSync(dbPath)) {
    try {
      fileBuffer = fs.readFileSync(dbPath);
    } catch {
      // ignore read error
    }
  }
  const wasmDb = fileBuffer && fileBuffer.length > 0 ? new SQL.Database(fileBuffer) : new SQL.Database();
  console.log('[DB] Connected via WebAssembly SQLite engine (sql.js)');

  const persist = () => {
    try {
      const data = wasmDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (err) {
      console.error('[DB] Persist error:', err);
    }
  };

  dbInstance = {
    exec(sql: string) {
      wasmDb.exec(sql);
      persist();
    },
    pragma(_str: string) {
      // no-op for wasm SQLite
    },
    prepare(sql: string) {
      return {
        all(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params.map((p) => (p === undefined ? null : p)));
          }
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
        get(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params.map((p) => (p === undefined ? null : p)));
          }
          let row: any = undefined;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          return row;
        },
        run(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params.map((p) => (p === undefined ? null : p)));
          }
          stmt.step();
          stmt.free();
          persist();
          return {
            changes: wasmDb.getRowsModified(),
            lastInsertRowid: 0
          };
        }
      };
    },
    transaction<T>(fn: (...args: any[]) => T) {
      return (...args: any[]) => fn(...args);
    }
  };
}

export const db = dbInstance;

function safeAddColumn(table: string, columnDef: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err: any) {
    // Ignore duplicate column errors during migrations
    if (!err.message?.includes('duplicate column name')) {
      // ignore
    }
  }
}

// Initialize database schema
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tourists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL,
      language TEXT NOT NULL,
      hotel TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'safe',
      last_updated INTEGER NOT NULL,
      notification_consent INTEGER NOT NULL DEFAULT 1,
      last_location_time INTEGER
    );

    CREATE TABLE IF NOT EXISTS danger_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      coordinates_json TEXT NOT NULL,
      center_lat REAL,
      center_lng REAL,
      radius_km REAL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS safe_places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      capacity INTEGER NOT NULL,
      current_occupancy INTEGER NOT NULL DEFAULT 0,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      amenities_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      zone_id TEXT,
      hazard_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      incident_id TEXT
    );

    CREATE TABLE IF NOT EXISTS alert_deliveries (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      tourist_id TEXT NOT NULL,
      tourist_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      language TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'simulated',
      provider TEXT NOT NULL DEFAULT 'MockSmsProvider',
      provider_message_id TEXT,
      error_code TEXT,
      error_message TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sos_requests (
      id TEXT PRIMARY KEY,
      tourist_name TEXT,
      phone TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      language TEXT NOT NULL,
      people_count INTEGER NOT NULL DEFAULT 1,
      triage TEXT NOT NULL,
      note TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'received',
      timestamp INTEGER NOT NULL,
      hop_count INTEGER DEFAULT 0,
      mesh_path_json TEXT,
      assigned_rescue_center TEXT,
      eta_minutes INTEGER
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      tourist_id TEXT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'safe',
      timestamp INTEGER NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS rumor_notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sms_log (
      id TEXT PRIMARY KEY,
      to_phone TEXT NOT NULL,
      body TEXT NOT NULL,
      language TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      alert_id TEXT,
      tourist_name TEXT,
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'simulated',
      provider_message_id TEXT,
      error_code TEXT,
      error_message TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      zone_id TEXT,
      title TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      area_name TEXT NOT NULL,
      message TEXT NOT NULL,
      instructions TEXT NOT NULL,
      shelter_id TEXT,
      shelter_name TEXT,
      shelter_address TEXT,
      shelter_phone TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);

  // Run migrations for existing DB
  safeAddColumn('tourists', 'notification_consent INTEGER NOT NULL DEFAULT 1');
  safeAddColumn('tourists', 'last_location_time INTEGER');
  safeAddColumn('alert_deliveries', 'provider TEXT NOT NULL DEFAULT "MockSmsProvider"');
  safeAddColumn('alert_deliveries', 'provider_message_id TEXT');
  safeAddColumn('alert_deliveries', 'error_code TEXT');
  safeAddColumn('alert_deliveries', 'error_message TEXT');
  safeAddColumn('alert_deliveries', 'retry_count INTEGER NOT NULL DEFAULT 0');
  safeAddColumn('alert_deliveries', 'last_attempt_at INTEGER');
  safeAddColumn('alerts', 'incident_id TEXT');
  safeAddColumn('sms_log', 'status TEXT NOT NULL DEFAULT "simulated"');
  safeAddColumn('sms_log', 'provider_message_id TEXT');
  safeAddColumn('sms_log', 'error_code TEXT');
  safeAddColumn('sms_log', 'error_message TEXT');
  safeAddColumn('sms_log', 'retry_count INTEGER NOT NULL DEFAULT 0');

  // Create indexes for high performance
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tourists_phone ON tourists(phone);
      CREATE INDEX IF NOT EXISTS idx_alert_deliveries_alert ON alert_deliveries(alert_id);
      CREATE INDEX IF NOT EXISTS idx_sms_log_alert ON sms_log(alert_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_zone ON incidents(zone_id);
    `);
  } catch {
    // ignore
  }
}

initSchema();
