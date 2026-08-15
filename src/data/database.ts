import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';

const DB_NAME = 'quran.db';
const DB_ASSET = require('../../assets/db/quran.db');
const REQUIRED_CONTENT_SCHEMA_VERSION = 3;
const REQUIRED_LAYOUT_ID = 'indopak-15-line-hafs';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // The SQLite file contains immutable bundled content only; user state lives
    // in MMKV. Reimporting is therefore the safest migration for a stale or
    // partially installed content pack.
    const [schemaVersion, tableCheck, layoutCheck] = await Promise.all([
      db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
      db.getFirstAsync<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='mushaf_layout_manifests'"
      ),
      db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM sqlite_master
         WHERE type='table' AND name='mushaf_layout_words'`
      ),
    ]);
    const hasLayoutManifest = tableCheck?.cnt === 1 && layoutCheck?.cnt === 1
      ? await db.getFirstAsync<{ cnt: number }>(
          'SELECT COUNT(*) as cnt FROM mushaf_layout_manifests WHERE layout_id = ?',
          [REQUIRED_LAYOUT_ID]
        )
      : null;
    if (
      !schemaVersion ||
      schemaVersion.user_version < REQUIRED_CONTENT_SCHEMA_VERSION ||
      !hasLayoutManifest ||
      hasLayoutManifest.cnt !== 1
    ) {
      await db.closeAsync();
      db = null;
      await SQLite.deleteDatabaseAsync(DB_NAME);
      await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
      db = await SQLite.openDatabaseAsync(DB_NAME);
    }
  }
  return db;
}
