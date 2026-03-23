import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { AppLanguage } from '../utils/locale';

const mmkv = createMMKV({ id: 'settings-store' });

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  getItem: (name) => {
    return mmkv.getString(name) ?? null;
  },
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

interface SettingsState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
