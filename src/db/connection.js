import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function getDb(customPath = null) {
  if (dbInstance) return dbInstance;

  const dbPath = customPath || process.env.DB_PATH || path.resolve(__dirname, '../../data/farming.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new DatabaseSync(dbPath);

  // Configure SQLite settings
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }

  // Safe incremental column migrations for existing databases before/after schema
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN user_id TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN email TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN is_service_active INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN user_id TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN is_trusted INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN is_service_active INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN service_status INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN requested_role TEXT DEFAULT NULL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN requested_at TEXT DEFAULT NULL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN served_by TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN cancelled_by TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN cancel_reason TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmer_store_items ADD COLUMN local_names TEXT DEFAULT "";'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmer_store_items ADD COLUMN soil_type TEXT DEFAULT "Loamy";'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN land_parcels TEXT DEFAULT "[]";'); } catch {}

  // Initialize schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  dbInstance.exec(schemaSql);

  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN user_id TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN email TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN is_service_active INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN user_id TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN is_trusted INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE processors ADD COLUMN is_service_active INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN service_status INTEGER DEFAULT 1;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN requested_role TEXT DEFAULT NULL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN requested_at TEXT DEFAULT NULL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN served_by TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN cancelled_by TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE contracts ADD COLUMN cancel_reason TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmer_store_items ADD COLUMN local_names TEXT DEFAULT "";'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmer_store_items ADD COLUMN soil_type TEXT DEFAULT "Loamy";'); } catch {}
  try { dbInstance.exec('ALTER TABLE farmers ADD COLUMN land_parcels TEXT DEFAULT "[]";'); } catch {}

  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
