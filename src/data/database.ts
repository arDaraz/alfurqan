import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';

const DB_NAME = 'quran.db';
const DB_ASSET = require('../../assets/db/quran.db');

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Check if the DB is stale (missing mushaf tables from v2 schema)
    const tableCheck = await db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='mushaf_words'"
    );
    if (!tableCheck || tableCheck.cnt === 0) {
      await db.closeAsync();
      db = null;
      await SQLite.deleteDatabaseAsync(DB_NAME);
      await importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET });
      db = await SQLite.openDatabaseAsync(DB_NAME);
    }
  }
  return db;
}
