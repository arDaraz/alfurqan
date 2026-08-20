import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { NightReadingMode } from '../constants/nightReading';
import type { AppLanguage } from '../utils/locale';
import {
  DEFAULT_PRAYER_METHOD,
  type MadhabId,
  type PrayerMethodId,
} from '../services/prayerTimes';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  isMushafLayoutId,
  type MushafLayoutId,
} from '../data/mushafLayouts';

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
type LegacyMushafFont = 'uthmanic' | 'qcf-v1' | 'qcf-v4' | 'indopak-nastaleeq' | 'digital-khatt-indopak';

export type HomeWidgetId =
  | 'prayerTimes'
  | 'qiblah'
  | 'continueReading'
  | 'streak'
  | 'khatam'
  | 'tasmee';

/** Tasmīʿ stays off until the reader turns it on; the other five ship enabled. */
export const DEFAULT_HOME_WIDGETS: Record<HomeWidgetId, boolean> = {
  prayerTimes: true,
  qiblah: true,
  continueReading: true,
  streak: true,
  khatam: true,
  tasmee: false,
};

export interface PrayerLocation {
  latitude: number;
  longitude: number;
  /** Reverse-geocoded city, shown on the prayer band. Null when lookup failed. */
  city: string | null;
}

export const DEFAULT_THEME_MODE: ThemeMode = 'light';
const SETTINGS_STORE_VERSION = 4;

interface SettingsState {
  language: AppLanguage;
  themeMode: ThemeMode;
  hasChosenThemeMode: boolean;
  /** 0–1 slider, 0.58 ≈ 24px Quran. */
  quranFontScale: number;
  dailyReminder: boolean;
  correctionSensitivity: CorrectionSensitivity;
  mushafLayoutId: MushafLayoutId;
  nightReadingMode: NightReadingMode;
  homeWidgets: Record<HomeWidgetId, boolean>;
  prayerMethod: PrayerMethodId;
  prayerMadhab: MadhabId;
  /** Last resolved coordinates, kept so the prayer band renders offline. */
  prayerLocation: PrayerLocation | null;

  setHomeWidget: (id: HomeWidgetId, enabled: boolean) => void;
  setPrayerMethod: (method: PrayerMethodId) => void;
  setPrayerMadhab: (madhab: MadhabId) => void;
  setPrayerLocation: (location: PrayerLocation | null) => void;
  setLanguage: (lang: AppLanguage) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setQuranFontScale: (scale: number) => void;
  setDailyReminder: (v: boolean) => void;
  setCorrectionSensitivity: (s: CorrectionSensitivity) => void;
  setMushafLayoutId: (id: MushafLayoutId) => void;
  setNightReadingMode: (mode: NightReadingMode) => void;
}

export function migrateSettingsState(
  persistedState: unknown,
  version: number
): Partial<SettingsState> {
  if (!persistedState || typeof persistedState !== 'object') {
    return {};
  }

  const state = persistedState as Partial<SettingsState> & { mushafFont?: LegacyMushafFont };
  const hasChosenThemeMode = state.hasChosenThemeMode ?? false;
  const legacyRequestedIndopak =
    state.mushafFont === 'indopak-nastaleeq' || state.mushafFont === 'digital-khatt-indopak';
  const mushafLayoutId = isMushafLayoutId(state.mushafLayoutId)
    ? state.mushafLayoutId
    : legacyRequestedIndopak
      ? 'indopak-15-line-hafs'
      : DEFAULT_MUSHAF_LAYOUT_ID;
  const {
    mushafFont: _legacyMushafFont,
    showTashkeel: _legacyShowTashkeel,
    qariId: _legacyQariId,
    ...currentState
  } = state as typeof state & { showTashkeel?: boolean; qariId?: string };
  // A widget added after this state was written must land on its default, not undefined.
  currentState.homeWidgets = { ...DEFAULT_HOME_WIDGETS, ...currentState.homeWidgets };

  if (
    version < SETTINGS_STORE_VERSION &&
    !hasChosenThemeMode &&
    state.themeMode === 'system'
  ) {
    return {
      ...currentState,
      themeMode: DEFAULT_THEME_MODE,
      hasChosenThemeMode: false,
      mushafLayoutId,
    };
  }

  return {
    ...currentState,
    hasChosenThemeMode,
    mushafLayoutId,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      themeMode: DEFAULT_THEME_MODE,
      hasChosenThemeMode: false,
      quranFontScale: 0.58,
      dailyReminder: true,
      correctionSensitivity: 'strict',
      mushafLayoutId: DEFAULT_MUSHAF_LAYOUT_ID,
      nightReadingMode: 'off',
      homeWidgets: DEFAULT_HOME_WIDGETS,
      prayerMethod: DEFAULT_PRAYER_METHOD,
      prayerMadhab: 'shafi',
      prayerLocation: null,

      setHomeWidget: (id, enabled) =>
        set((state) => ({ homeWidgets: { ...state.homeWidgets, [id]: enabled } })),
      setPrayerMethod: (prayerMethod) => set({ prayerMethod }),
      setPrayerMadhab: (prayerMadhab) => set({ prayerMadhab }),
      setPrayerLocation: (prayerLocation) => set({ prayerLocation }),
      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode, hasChosenThemeMode: true }),
      setQuranFontScale: (quranFontScale) => set({ quranFontScale }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setCorrectionSensitivity: (correctionSensitivity) =>
        set({ correctionSensitivity }),
      setMushafLayoutId: (mushafLayoutId) => set({ mushafLayoutId }),
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
