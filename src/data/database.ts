import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    // Import bundled asset DB into SQLite directory (no-op if already present)
    await importDatabaseFromAssetAsync('quran.db', {
      assetId: require('../../assets/db/quran.db'),
    });
    db = await SQLite.openDatabaseAsync('quran.db');
  }
  return db;
}
