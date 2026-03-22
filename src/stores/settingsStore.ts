import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from 'zustand-mmkv-storage';
import type { AppLanguage } from '../utils/locale';

const mmkvStorage = createMMKVStorage({ id: 'settings-store' });

interface SettingsState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'settings-store',
      storage: mmkvStorage,
    }
  )
);
