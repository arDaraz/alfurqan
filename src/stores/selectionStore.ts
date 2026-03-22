import { create } from 'zustand';
import type { AyahRange } from '../data/types';

interface SelectionState {
  startSurah: number | null;
  startAyah: number | null;
  endSurah: number | null;
  endAyah: number | null;
  isRangeComplete: boolean;
  setStart: (surah: number, ayah: number) => void;
  setEnd: (surah: number, ayah: number) => void;
  clearSelection: () => void;
  getRange: () => AyahRange | null;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  startSurah: null,
  startAyah: null,
  endSurah: null,
  endAyah: null,
  isRangeComplete: false,
  setStart: (surah, ayah) =>
    set({
      startSurah: surah,
      startAyah: ayah,
      endSurah: null,
      endAyah: null,
      isRangeComplete: false,
    }),
  setEnd: (surah, ayah) =>
    set({
      endSurah: surah,
      endAyah: ayah,
      isRangeComplete: true,
    }),
  clearSelection: () =>
    set({
      startSurah: null,
      startAyah: null,
      endSurah: null,
      endAyah: null,
      isRangeComplete: false,
    }),
  getRange: () => {
    const state = get();
    if (
      state.startSurah !== null &&
      state.startAyah !== null &&
      state.endSurah !== null &&
      state.endAyah !== null
    ) {
      return {
        surahNumber: state.startSurah,
        startAyah: state.startAyah,
        endAyah: state.endAyah,
      };
    }
    return null;
  },
}));
