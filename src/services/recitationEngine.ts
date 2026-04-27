import type { RefObject } from 'react';
import { getReciterById } from '../data/reciters';
import { useReciterStore } from '../stores/reciterStore';
import { useRecitationStore, type PlaybackRange, type PlaybackMode, type PlaybackSpeed } from '../stores/recitationStore';
import { ayahAudioCache, CacheError } from './ayahAudioCache';
import { audioAdapter, type AudioAdapter } from './audioAdapter';

type WebViewLike = {
  injectJavaScript: (script: string) => void;
};

type AudioCacheLike = {
  getLocalPath: (
    reciterId: string,
    surah: number,
    ayah: number,
    signal?: AbortSignal
  ) => Promise<string>;
};

type RecitationEngineDeps = {
  adapter: AudioAdapter;
  cache: AudioCacheLike;
};

type LoadIntent = 'play' | 'pause';

function mapError(error: unknown): { category: 'network' | 'audio-unavailable' | 'storage'; message: string } {
  if (error instanceof CacheError) {
    if (error.code === 'network') {
      return { category: 'network', message: 'لا يوجد اتصال بالإنترنت — جرّب لاحقًا أو نزّل السورة' };
    }
    if (error.code === 'disk') {
      return { category: 'storage', message: 'لا توجد مساحة كافية' };
    }
  }
  return { category: 'audio-unavailable', message: 'لا تتوفر هذه التلاوة لهذا القارئ' };
}

export class RecitationEngine {
  private adapter: AudioAdapter;
  private cache: AudioCacheLike;
  private reciterId = useReciterStore.getState().selectedReciterId;
  private loadToken = 0;
  private abortController: AbortController | null = null;
  private pendingSeek: number | null = null;
  private pendingPause = false;
  private activePageWebViewRef: RefObject<WebViewLike | null> | null = null;

  constructor(deps: RecitationEngineDeps) {
    this.adapter = deps.adapter;
    this.cache = deps.cache;
    useRecitationStore.getState()._reset();
  }

  getSnapshot() {
    return useRecitationStore.getState();
  }

  async start(range: PlaybackRange): Promise<void> {
    this.pendingSeek = null;
    this.pendingPause = false;
    useRecitationStore.getState()._setSession(range, range.startAyah);
    await this.loadAyah(range.startAyah, 'play');
  }

  async pause(): Promise<void> {
    const snapshot = this.getSnapshot();
    if (snapshot.state === 'loading') {
      this.pendingPause = true;
      return;
    }
    if (snapshot.state !== 'playing') return;
    await this.adapter.pause();
    useRecitationStore.getState()._setState('paused');
  }

  async resume(): Promise<void> {
    const snapshot = this.getSnapshot();
    if (snapshot.state === 'loading') {
      this.pendingPause = false;
      return;
    }
    if (snapshot.state !== 'paused') return;
    await this.adapter.play();
    useRecitationStore.getState()._setState('playing');
  }

  async stop(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    this.loadToken += 1;
    this.pendingSeek = null;
    this.pendingPause = false;
    await this.adapter.stop();
    useRecitationStore.getState()._reset();
    this.highlightInWebView(null, null);
  }

  async retry(): Promise<void> {
    const snapshot = this.getSnapshot();
    if (!snapshot.range || !snapshot.currentAyah) return;
    await this.loadAyah(snapshot.currentAyah, 'play');
  }

  async seek(seconds: number): Promise<void> {
    const snapshot = this.getSnapshot();
    if (snapshot.state === 'loading') {
      this.pendingSeek = seconds;
      return;
    }
    await this.adapter.seek(seconds);
    useRecitationStore.getState()._setProgress(seconds, snapshot.durationSeconds);
  }

  async next(): Promise<void> {
    const snapshot = this.getSnapshot();
    if (!snapshot.range || !snapshot.currentAyah) return;
    if (snapshot.currentAyah >= snapshot.range.stopAyah) {
      if (snapshot.mode === 'loop-surah') {
        await this.loadAyah(1, snapshot.state === 'paused' ? 'pause' : 'play');
      } else {
        await this.stop();
      }
      return;
    }
    await this.loadAyah(snapshot.currentAyah + 1, snapshot.state === 'paused' ? 'pause' : 'play');
  }

  async prev(): Promise<void> {
    const snapshot = this.getSnapshot();
    if (!snapshot.range || !snapshot.currentAyah || snapshot.currentAyah <= 1) return;
    await this.loadAyah(snapshot.currentAyah - 1, snapshot.state === 'paused' ? 'pause' : 'play');
  }

  setMode(mode: PlaybackMode): void {
    useRecitationStore.getState().setMode(mode);
  }

  async setSpeed(speed: PlaybackSpeed): Promise<void> {
    useRecitationStore.getState().setSpeed(speed);
    await this.adapter.setSpeed(speed);
  }

  async setReciter(reciterId: string): Promise<void> {
    getReciterById(reciterId);
    useReciterStore.getState().selectReciter(reciterId);
    this.reciterId = reciterId;
    const snapshot = this.getSnapshot();
    if (!snapshot.range || !snapshot.currentAyah || snapshot.state === 'idle') return;
    await this.loadAyah(snapshot.currentAyah, snapshot.state === 'paused' ? 'pause' : 'play');
  }

  registerActivePageWebView(ref: RefObject<WebViewLike | null> | null): void {
    this.activePageWebViewRef = ref;
    const snapshot = this.getSnapshot();
    if (snapshot.currentAyah && snapshot.range && snapshot.state !== 'idle') {
      this.highlightInWebView(snapshot.range.surah, snapshot.currentAyah);
    }
  }

  private async loadAyah(ayah: number, intent: LoadIntent): Promise<void> {
    const snapshot = this.getSnapshot();
    if (!snapshot.range) return;

    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const token = ++this.loadToken;
    useRecitationStore.getState()._setCurrentAyah(ayah);
    useRecitationStore.getState()._setState('loading');

    try {
      const localPath = await this.cache.getLocalPath(this.reciterId, snapshot.range.surah, ayah, signal);
      if (token !== this.loadToken) return;

      const reciter = getReciterById(this.reciterId);
      const result = await this.adapter.load({
        uri: localPath,
        title: `سورة ${snapshot.range.surah} - الآية ${ayah}`,
        artist: reciter.nameAr,
      });
      if (token !== this.loadToken) return;

      const durationSeconds = result.durationSeconds ?? 0;
      useRecitationStore.getState()._setProgress(0, durationSeconds);

      if (this.pendingSeek !== null) {
        await this.adapter.seek(this.pendingSeek);
        useRecitationStore.getState()._setProgress(this.pendingSeek, durationSeconds);
      }

      const shouldPause = this.pendingPause || intent === 'pause';
      this.pendingSeek = null;
      this.pendingPause = false;

      this.highlightInWebView(snapshot.range.surah, ayah);
      if (shouldPause) {
        useRecitationStore.getState()._setState('paused');
      } else {
        await this.adapter.play();
        useRecitationStore.getState()._setState('playing');
      }
    } catch (error) {
      if (token !== this.loadToken) return;
      const mapped = mapError(error);
      useRecitationStore.getState()._setError(mapped.category, mapped.message);
    }
  }

  private highlightInWebView(surah: number | null, ayah: number | null): void {
    this.activePageWebViewRef?.current?.injectJavaScript(
      `window.setPlayingAyah(${surah ?? 'null'}, ${ayah ?? 'null'}); true;`
    );
  }
}

export const recitationEngine = new RecitationEngine({
  adapter: audioAdapter,
  cache: ayahAudioCache,
});

export function createRecitationEngineForTest(deps: RecitationEngineDeps): RecitationEngine {
  return new RecitationEngine(deps);
}
