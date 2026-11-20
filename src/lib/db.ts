// Offline database (expo-sqlite). Keeps location points and actions that
// could not reach the server (no internet), and replays them when back online.
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

function getDb() {
  if (db) return db;
  db = SQLite.openDatabaseSync('aolo.db');
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      body TEXT,
      created_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS location_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      heading REAL,
      speed REAL,
      recorded_at INTEGER NOT NULL
    );
  `);
  return db;
}

export interface OutboxRow {
  id: number;
  method: 'POST' | 'PUT' | 'PATCH';
  url: string;
  body: string | null;
  attempts: number;
}
export interface LocationRow {
  id: number;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  recorded_at: number;
}

export const outbox = {
  add(method: OutboxRow['method'], url: string, body?: object) {
    getDb().runSync('INSERT INTO outbox (method, url, body, created_at) VALUES (?, ?, ?, ?)', [
      method,
      url,
      body ? JSON.stringify(body) : null,
      Date.now(),
    ]);
  },
  all(): OutboxRow[] {
    return getDb().getAllSync<OutboxRow>('SELECT * FROM outbox ORDER BY id LIMIT 50');
  },
  remove(id: number) {
    getDb().runSync('DELETE FROM outbox WHERE id = ?', [id]);
  },
  bump(id: number) {
    getDb().runSync('UPDATE outbox SET attempts = attempts + 1 WHERE id = ?', [id]);
  },
  count(): number {
    return getDb().getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM outbox')?.n ?? 0;
  },
};

export const locationQueue = {
  add(p: Omit<LocationRow, 'id'>) {
    getDb().runSync('INSERT INTO location_points (lat, lng, heading, speed, recorded_at) VALUES (?, ?, ?, ?, ?)', [
      p.lat,
      p.lng,
      p.heading,
      p.speed,
      p.recorded_at,
    ]);
  },
  take(limit = 200): LocationRow[] {
    return getDb().getAllSync<LocationRow>('SELECT * FROM location_points ORDER BY id LIMIT ?', [limit]);
  },
  removeUpTo(id: number) {
    getDb().runSync('DELETE FROM location_points WHERE id <= ?', [id]);
  },
};
