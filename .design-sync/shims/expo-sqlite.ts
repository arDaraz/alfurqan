// The Quran database is native, so every query answers empty and a component
// draws its own empty state. Real content comes in as props.
const database = {
  getAllAsync: async () => [],
  getFirstAsync: async () => null,
  runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
  execAsync: async () => undefined,
  closeAsync: async () => undefined,
};

export const openDatabaseAsync = async () => database;
export const openDatabaseSync = () => database;
export const deleteDatabaseAsync = async () => undefined;
export const importDatabaseFromAssetAsync = async () => undefined;
export type SQLiteDatabase = typeof database;
