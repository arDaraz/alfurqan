import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { NightReadingMode } from '../constants/nightReading';
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

export const DEFAULT_THEME_MODE: ThemeMode = 'light';
const SETTINGS_STORE_VERSION = 1;

interface SettingsState {
  language: AppLanguage;
  themeMode: ThemeMode;
  hasChosenThemeMode: boolean;
  /** 0–1 slider, 0.58 ≈ 24px Quran. */
  quranFontScale: number;
  showTashkeel: boolean;
  dailyReminder: boolean;
  qariId: string;
  correctionSensitivity: CorrectionSensitivity;
  mushafFont: MushafFont;
  nightReadingMode: NightReadingMode;

  setLanguage: (lang: AppLanguage) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setQuranFontScale: (scale: number) => void;
  setShowTashkeel: (v: boolean) => void;
  setDailyReminder: (v: boolean) => void;
  setQariId: (id: string) => void;
  setCorrectionSensitivity: (s: CorrectionSensitivity) => void;
  setMushafFont: (f: MushafFont) => void;
  setNightReadingMode: (mode: NightReadingMode) => void;
}

export function migrateSettingsState(
  persistedState: unknown,
  version: number
): Partial<SettingsState> {
  if (!persistedState || typeof persistedState !== 'object') {
    return {};
  }

  const state = persistedState as Partial<SettingsState>;
  const hasChosenThemeMode = state.hasChosenThemeMode ?? false;

  if (
    version < SETTINGS_STORE_VERSION &&
    !hasChosenThemeMode &&
    state.themeMode === 'system'
  ) {
    return {
      ...state,
      themeMode: DEFAULT_THEME_MODE,
      hasChosenThemeMode: false,
    };
  }

  return {
    ...state,
    hasChosenThemeMode,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      themeMode: DEFAULT_THEME_MODE,
      hasChosenThemeMode: false,
      quranFontScale: 0.58,
      showTashkeel: true,
      dailyReminder: true,
      qariId: 'mishary',
      correctionSensitivity: 'strict',
      mushafFont: 'uthmanic',
      nightReadingMode: 'off',

      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode, hasChosenThemeMode: true }),
      setQuranFontScale: (quranFontScale) => set({ quranFontScale }),
      setShowTashkeel: (showTashkeel) => set({ showTashkeel }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setQariId: (qariId) => set({ qariId }),
      setCorrectionSensitivity: (correctionSensitivity) =>
        set({ correctionSensitivity }),
      setMushafFont: (mushafFont) => set({ mushafFont }),
      setNightReadingMode: (nightReadingMode) => set({ nightReadingMode }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
      version: SETTINGS_STORE_VERSION,
      migrate: migrateSettingsState,
    }
  )
);
