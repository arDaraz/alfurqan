import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('quran.db', {
      assetSource: { assetId: require('../../assets/db/quran.db') },
    });
  }
  return db;
}
