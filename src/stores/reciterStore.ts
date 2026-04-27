import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { DEFAULT_RECITER_ID, RECITERS, getReciterById, type Reciter } from '../data/reciters';
import { getSurahLastAyah } from '../data/quranRepository';
import { ayahAudioCache } from '../services/ayahAudioCache';

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
  cancelSurahDownload: (reciterId: string, surah: number) => void;
  deleteSurahDownload: (reciterId: string, surah: number) => Promise<void>;
  selectReciter: (reciterId: string) => void;
  setSurahDownload: (key: string, download: SurahDownload) => void;
  startSurahDownload: (reciterId: string, surah: number) => Promise<void>;
};

const STORAGE_KEY = 'reciter-store';
const mmkv = createMMKV({ id: STORAGE_KEY });
const downloadControllers = new Map<string, AbortController>();

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
  cancelSurahDownload: (reciterId, surah) => {
    const key = downloadKey(reciterId, surah);
    downloadControllers.get(key)?.abort();
    downloadControllers.delete(key);
    const existing = get().downloads[key];
    if (existing) {
      get().setSurahDownload(key, {
        ...existing,
        status: 'idle',
        errorMessage: undefined,
      });
    }
  },
  deleteSurahDownload: async (reciterId, surah) => {
    const key = downloadKey(reciterId, surah);
    get().cancelSurahDownload(reciterId, surah);
    await ayahAudioCache.deleteSurah(reciterId, surah);
    const { [key]: _removed, ...remaining } = get().downloads;
    set({ downloads: remaining });
    persistState(get());
  },
  selectReciter: (reciterId) => {
    getReciterById(reciterId);
    set({ selectedReciterId: reciterId });
    persistState(get());
  },
  setSurahDownload: (key, download) => {
    set({ downloads: { ...get().downloads, [key]: download } });
    persistState(get());
  },
  startSurahDownload: async (reciterId, surah) => {
    getReciterById(reciterId);
    const key = downloadKey(reciterId, surah);
    if (get().downloads[key]?.status === 'downloading') return;

    const ayahsTotal = await getSurahLastAyah(surah);
    const controller = new AbortController();
    downloadControllers.set(key, controller);
    get().setSurahDownload(key, {
      ayahsTotal,
      ayahsCached: 0,
      status: 'downloading',
    });

    try {
      await ayahAudioCache.downloadSurah(
        reciterId,
        surah,
        controller.signal,
        (ayahsCached, total) => {
          get().setSurahDownload(key, {
            ayahsTotal: total,
            ayahsCached,
            status: 'downloading',
          });
        }
      );

      if (controller.signal.aborted) {
        get().setSurahDownload(key, {
          ayahsTotal,
          ayahsCached: 0,
          status: 'idle',
        });
        return;
      }

      const bytes = await ayahAudioCache.bytesUsed(reciterId, surah);
      get().setSurahDownload(key, {
        ayahsTotal,
        ayahsCached: ayahsTotal,
        status: 'complete',
        bytes,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        get().setSurahDownload(key, {
          ayahsTotal,
          ayahsCached: 0,
          status: 'idle',
        });
      } else {
        get().setSurahDownload(key, {
          ayahsTotal,
          ayahsCached: get().downloads[key]?.ayahsCached ?? 0,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Download failed',
        });
      }
    } finally {
      if (downloadControllers.get(key) === controller) {
        downloadControllers.delete(key);
      }
    }
  },
}));

export function downloadKey(reciterId: string, surah: number): string {
  return `${reciterId}:${surah}`;
}
