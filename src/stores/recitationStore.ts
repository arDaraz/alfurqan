import { create } from 'zustand';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type PlaybackMode = 'continuous' | 'loop-surah';
export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;
export type ErrorCategory = 'network' | 'audio-unavailable' | 'storage' | null;

export type PlaybackRange = {
  surah: number;
  startAyah: number;
  stopAyah: number;
  trigger: 'popup' | 'toolbar' | 'practice';
  selectedEndSurah?: number;
  selectedEndAyah?: number;
};

type RecitationState = {
  state: PlaybackState;
  range: PlaybackRange | null;
  currentAyah: number | null;
  mode: PlaybackMode;
  positionSeconds: number;
  durationSeconds: number;
  speed: PlaybackSpeed;
  errorCategory: ErrorCategory;
  errorMessage: string | null;

  setMode: (mode: PlaybackMode) => void;
  setSpeed: (speed: PlaybackSpeed) => void;

  _setSession: (range: PlaybackRange, currentAyah: number) => void;
  _setState: (state: PlaybackState) => void;
  _setCurrentAyah: (currentAyah: number | null) => void;
  _setProgress: (positionSeconds: number, durationSeconds: number) => void;
  _setError: (category: ErrorCategory, message: string | null) => void;
  _reset: () => void;
};

const initialState = {
  state: 'idle' as PlaybackState,
  range: null,
  currentAyah: null,
  mode: 'continuous' as PlaybackMode,
  positionSeconds: 0,
  durationSeconds: 0,
  speed: 1 as PlaybackSpeed,
  errorCategory: null,
  errorMessage: null,
};

export const useRecitationStore = create<RecitationState>()((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),

  _setSession: (range, currentAyah) =>
    set({
      range,
      currentAyah,
      positionSeconds: 0,
      durationSeconds: 0,
      errorCategory: null,
      errorMessage: null,
    }),
  _setState: (state) => set({ state }),
  _setCurrentAyah: (currentAyah) => set({ currentAyah, positionSeconds: 0 }),
  _setProgress: (positionSeconds, durationSeconds) =>
    set({ positionSeconds, durationSeconds }),
  _setError: (errorCategory, errorMessage) =>
    set({ state: 'error', errorCategory, errorMessage }),
  _reset: () => set({ ...initialState }),
}));
