// The bundle only needs the settings store to construct, so the native MMKV
// store becomes an in-memory map.
const memory = new Map<string, string>();

export function createMMKV(_options?: { id?: string }) {
  return {
    set: (key: string, value: string) => { memory.set(key, String(value)); },
    getString: (key: string) => memory.get(key),
    getNumber: (key: string) => Number(memory.get(key) ?? 0),
    getBoolean: (key: string) => memory.get(key) === 'true',
    remove: (key: string) => { memory.delete(key); },
    clearAll: () => { memory.clear(); },
    getAllKeys: () => [...memory.keys()],
    contains: (key: string) => memory.has(key),
  };
}

export const MMKV = createMMKV;
export default { createMMKV };
