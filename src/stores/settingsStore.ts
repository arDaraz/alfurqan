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

export type ThemeMode = 'light' | 'dark' | 'system';
export type CorrectionSensitivity = 'gentle' | 'standard' | 'strict';
export type MushafFont = 'uthmanic' | 'qcf-v1' | 'qcf-v4' | 'indopak-nastaleeq' | 'digital-khatt-indopak';

interface SettingsState {
  language: AppLanguage;
  themeMode: ThemeMode;
  /** 0–1 slider, 0.58 ≈ 24px Quran. */
  quranFontScale: number;
  showTashkeel: boolean;
  dailyReminder: boolean;
  qariId: string;
  correctionSensitivity: CorrectionSensitivity;
  mushafFont: MushafFont;

  setLanguage: (lang: AppLanguage) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setQuranFontScale: (scale: number) => void;
  setShowTashkeel: (v: boolean) => void;
  setDailyReminder: (v: boolean) => void;
  setQariId: (id: string) => void;
  setCorrectionSensitivity: (s: CorrectionSensitivity) => void;
  setMushafFont: (f: MushafFont) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      themeMode: 'system',
      quranFontScale: 0.58,
      showTashkeel: true,
      dailyReminder: true,
      qariId: 'mishary',
      correctionSensitivity: 'strict',
      mushafFont: 'uthmanic',

      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setQuranFontScale: (quranFontScale) => set({ quranFontScale }),
      setShowTashkeel: (showTashkeel) => set({ showTashkeel }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setQariId: (qariId) => set({ qariId }),
      setCorrectionSensitivity: (correctionSensitivity) =>
        set({ correctionSensitivity }),
      setMushafFont: (mushafFont) => set({ mushafFont }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
