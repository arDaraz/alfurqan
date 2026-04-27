import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { DEFAULT_RECITER_ID, RECITERS, getReciterById, type Reciter } from '../data/reciters';

export type DownloadStatus = 'idle' | 'downloading' | 'complete' | 'error';

export type SurahDownload = {
  ayahsTotal: number;
  ayahsCached: number;
  status: DownloadStatus;
  errorMessage?: string;
  bytes?: number;
};

type PersistedReciterState = {
  selectedReciterId?: string;
  downloads?: Record<string, SurahDownload>;
};

type ReciterStoreState = {
  selectedReciterId: string;
  reciters: Reciter[];
  downloads: Record<string, SurahDownload>;
  selectReciter: (reciterId: string) => void;
  setSurahDownload: (key: string, download: SurahDownload) => void;
};

const STORAGE_KEY = 'reciter-store';
const mmkv = createMMKV({ id: STORAGE_KEY });

function sanitizeDownloads(
  downloads: Record<string, SurahDownload> = {}
): Record<string, SurahDownload> {
  return Object.fromEntries(
    Object.entries(downloads).map(([key, download]) => [
      key,
      {
        ...download,
        status: download.status === 'downloading' ? 'idle' : download.status,
      },
    ])
  );
}

function loadPersistedState(): Required<PersistedReciterState> {
  const fallback = {
    selectedReciterId: DEFAULT_RECITER_ID,
    downloads: {},
  };

  const stored = mmkv.getString(STORAGE_KEY);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored) as PersistedReciterState;
    const selectedReciterId = parsed.selectedReciterId
      ? getReciterById(parsed.selectedReciterId).id
      : DEFAULT_RECITER_ID;
    return {
      selectedReciterId,
      downloads: sanitizeDownloads(parsed.downloads),
    };
  } catch {
    return fallback;
  }
}

function persistState(state: Pick<ReciterStoreState, 'selectedReciterId' | 'downloads'>): void {
  mmkv.set(
    STORAGE_KEY,
    JSON.stringify({
      selectedReciterId: state.selectedReciterId,
      downloads: state.downloads,
    })
  );
}

const initialState = loadPersistedState();

export const useReciterStore = create<ReciterStoreState>()((set, get) => ({
  selectedReciterId: initialState.selectedReciterId,
  reciters: RECITERS,
  downloads: initialState.downloads,
  selectReciter: (reciterId) => {
    getReciterById(reciterId);
    set({ selectedReciterId: reciterId });
    persistState(get());
  },
  setSurahDownload: (key, download) => {
    set({ downloads: { ...get().downloads, [key]: download } });
    persistState(get());
  },
}));

export function downloadKey(reciterId: string, surah: number): string {
  return `${reciterId}:${surah}`;
}
