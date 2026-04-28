import type { RefObject } from 'react';
import { SURAH_METADATA, TOTAL_SURAHS } from '../constants/quran';
import { getReciterById } from '../data/reciters';
import { useReciterStore } from '../stores/reciterStore';
import { useRecitationStore, type PlaybackRange, type PlaybackMode, type PlaybackSpeed } from '../stores/recitationStore';
import { ayahAudioCache, CacheError } from './ayahAudioCache';
import { audioAdapter, registerAudioRemoteHandlers, type AudioAdapter, type AudioPlaybackStatus } from './audioAdapter';

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
  prefetch?: (reciterId: string, surah: number, ayah: number) => Promise<string>;
};

type RecitationEngineDeps = {
  adapter: AudioAdapter;
  cache: AudioCacheLike;
};

type LoadIntent = 'play' | 'pause';
const LOCK_SCREEN_ARTWORK: string | undefined = undefined;
const PREFETCH_AHEAD_AYAHS = 3;

function getSurahAyahCount(surah: number): number {
  const metadata = SURAH_METADATA[surah - 1];
  if (!metadata || metadata.number !== surah) {
    throw new Error(`Surah ${surah} not found`);
  }
  return metadata.ayahCount;
}

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
  private handlingFinish = false;
  private activePageWebViewRef: RefObject<WebViewLike | null> | null = null;

  constructor(deps: RecitationEngineDeps) {
    this.adapter = deps.adapter;
    this.cache = deps.cache;
    useRecitationStore.getState()._reset();
    this.adapter.subscribeStatus?.((status) => this.handlePlaybackStatus(status));
  }

  getSnapshot() {
    return useRecitationStore.getState();
  }

  async start(range: PlaybackRange): Promise<void> {
    this.pendingSeek = null;
    this.pendingPause = false;
    this.handlingFinish = false;
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
    this.handlingFinish = false;
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
    const intent = snapshot.state === 'paused' ? 'pause' : 'play';
    if (snapshot.currentAyah >= snapshot.range.stopAyah) {
      if (snapshot.mode === 'loop-surah') {
        await this.loadAyah(1, intent);
      } else {
        const nextRange = this.getNextSurahRange(snapshot.range);
        if (!nextRange) {
          await this.stop();
          return;
        }
        useRecitationStore.getState()._setSession(nextRange, nextRange.startAyah);
        await this.loadAyah(nextRange.startAyah, intent);
      }
      return;
    }
    await this.loadAyah(snapshot.currentAyah + 1, intent);
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
    this.handlingFinish = false;
    useRecitationStore.getState()._setCurrentAyah(ayah);
    useRecitationStore.getState()._setState('loading');

    try {
      const localPath = await this.cache.getLocalPath(this.reciterId, snapshot.range.surah, ayah, signal);
      if (token !== this.loadToken) return;
      this.prefetchUpcoming(snapshot.range, ayah);

      const reciter = getReciterById(this.reciterId);
      const result = await this.adapter.load({
        uri: localPath,
        title: `سورة ${snapshot.range.surah} - الآية ${ayah}`,
        artist: reciter.nameAr,
        artwork: LOCK_SCREEN_ARTWORK,
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

  private getNextSurahRange(range: PlaybackRange): PlaybackRange | null {
    if (range.surah >= TOTAL_SURAHS) return null;
    const nextSurah = range.surah + 1;
    return {
      surah: nextSurah,
      startAyah: 1,
      stopAyah: getSurahAyahCount(nextSurah),
      trigger: range.trigger,
    };
  }

  private prefetchUpcoming(range: PlaybackRange, ayah: number): void {
    if (!this.cache.prefetch) return;

    const stopAyah = Math.min(range.stopAyah, ayah + PREFETCH_AHEAD_AYAHS);
    for (let nextAyah = ayah + 1; nextAyah <= stopAyah; nextAyah += 1) {
      void this.cache.prefetch(this.reciterId, range.surah, nextAyah).catch(() => undefined);
    }
  }

  private handlePlaybackStatus(status: AudioPlaybackStatus): void {
    const snapshot = this.getSnapshot();
    if (!snapshot.range || snapshot.state === 'idle' || snapshot.state === 'error') return;

    const durationSeconds = status.duration || snapshot.durationSeconds;
    const currentTime = durationSeconds > 0
      ? Math.min(Math.max(0, status.currentTime), durationSeconds)
      : Math.max(0, status.currentTime);
    useRecitationStore.getState()._setProgress(currentTime, durationSeconds);

    if (!status.didJustFinish || snapshot.state !== 'playing' || this.handlingFinish) return;

    this.handlingFinish = true;
    void this.next().finally(() => {
      this.handlingFinish = false;
    });
  }
}

export const recitationEngine = new RecitationEngine({
  adapter: audioAdapter,
  cache: ayahAudioCache,
});

registerAudioRemoteHandlers({
  next: () => recitationEngine.next(),
  pause: () => recitationEngine.pause(),
  previous: () => recitationEngine.prev(),
  resume: () => recitationEngine.resume(),
  seek: (seconds) => recitationEngine.seek(seconds),
  stop: () => recitationEngine.stop(),
});

export function createRecitationEngineForTest(deps: RecitationEngineDeps): RecitationEngine {
  return new RecitationEngine(deps);
}
