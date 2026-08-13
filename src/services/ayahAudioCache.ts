import * as FileSystem from 'expo-file-system/legacy';
import { getSurahLastAyah } from '../data/quranRepository';
import { urlForAyah } from './everyAyahProvider';

type TokenFactory = () => string;

type AyahAudioCacheOptions = {
  tokenFactory?: TokenFactory;
};

type CacheErrorCode = 'network' | 'http' | 'disk' | 'aborted';

export class CacheError extends Error {
  code: CacheErrorCode;

  constructor(code: CacheErrorCode, message: string) {
    super(message);
    this.name = 'CacheError';
    this.code = code;
  }
}

function createToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ensureDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new CacheError('disk', 'Document directory is unavailable');
  }
  return FileSystem.documentDirectory;
}

function isNonEmptyFile(info: FileSystem.FileInfo): boolean {
  return info.exists && !info.isDirectory && typeof info.size === 'number' && info.size > 0;
}

function classifyError(error: unknown): CacheError {
  if (error instanceof CacheError) return error;
  if (error instanceof Error && /network|fetch|connection|internet/i.test(error.message)) {
    return new CacheError('network', error.message);
  }
  return new CacheError('disk', error instanceof Error ? error.message : 'Audio cache failed');
}

export class AyahAudioCache {
  private inFlight = new Map<string, Promise<string>>();
  private tokenFactory: TokenFactory;

  constructor(options: AyahAudioCacheOptions = {}) {
    this.tokenFactory = options.tokenFactory ?? createToken;
  }

  async getLocalPath(
    reciterId: string,
    surah: number,
    ayah: number,
    signal?: AbortSignal
  ): Promise<string> {
    const key = `${reciterId}:${surah}:${ayah}`;
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = this.resolveLocalPath(reciterId, surah, ayah, signal).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  async prefetch(reciterId: string, surah: number, ayah: number): Promise<string> {
    return this.getLocalPath(reciterId, surah, ayah);
  }

  private async resolveLocalPath(
    reciterId: string,
    surah: number,
    ayah: number,
    signal?: AbortSignal
  ): Promise<string> {
    if (signal?.aborted) throw new CacheError('aborted', 'Audio download was cancelled');

    const target = this.pathFor(reciterId, surah, ayah);
    const existing = await FileSystem.getInfoAsync(target);
    if (isNonEmptyFile(existing)) return target;
    if (existing.exists && !existing.isDirectory) {
      await FileSystem.deleteAsync(target, { idempotent: true });
    }

    await this.download(reciterId, surah, ayah, target, signal);
    return target;
  }

  async downloadSurah(
    reciterId: string,
    surah: number,
    signal?: AbortSignal,
    onProgress?: (ayahsCached: number, ayahsTotal: number) => void
  ): Promise<void> {
    const ayahsTotal = await getSurahLastAyah(surah);
    for (let ayah = 1; ayah <= ayahsTotal; ayah += 1) {
      if (signal?.aborted) throw new CacheError('aborted', 'Audio download was cancelled');
      await this.getLocalPath(reciterId, surah, ayah, signal);
      onProgress?.(ayah, ayahsTotal);
    }
  }

  async bytesUsed(reciterId?: string, surah?: number): Promise<number> {
    let root = `${ensureDocumentDirectory()}recitation/`;
    if (reciterId) root += `${reciterId}/`;
    if (reciterId && surah) root += `${String(surah).padStart(3, '0')}/`;
    return this.sumBytes(root);
  }

  async deleteSurah(reciterId: string, surah: number): Promise<void> {
    await FileSystem.deleteAsync(this.dirFor(reciterId, surah), { idempotent: true });
  }

  private async download(
    reciterId: string,
    surah: number,
    ayah: number,
    target: string,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      if (signal?.aborted) throw new CacheError('aborted', 'Audio download was cancelled');

      const dir = this.dirFor(reciterId, surah);
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const temp = `${target}.${this.tokenFactory()}.tmp`;
      const response = await FileSystem.downloadAsync(urlForAyah(reciterId, surah, ayah), temp);
      if (response.status >= 400) {
        throw new CacheError('http', `Audio file unavailable (${response.status})`);
      }

      const tempInfo = await FileSystem.getInfoAsync(temp);
      if (!isNonEmptyFile(tempInfo)) {
        await FileSystem.deleteAsync(temp, { idempotent: true });
        throw new CacheError('http', 'Downloaded audio file was empty');
      }

      if (signal?.aborted) {
        await FileSystem.deleteAsync(temp, { idempotent: true });
        throw new CacheError('aborted', 'Audio download was cancelled');
      }

      await FileSystem.moveAsync({ from: temp, to: target });
    } catch (error) {
      throw classifyError(error);
    }
  }

  private dirFor(reciterId: string, surah: number): string {
    return `${ensureDocumentDirectory()}recitation/${reciterId}/${String(surah).padStart(3, '0')}/`;
  }

  private pathFor(reciterId: string, surah: number, ayah: number): string {
    return `${this.dirFor(reciterId, surah)}${String(ayah).padStart(3, '0')}.mp3`;
  }

  private async sumBytes(uri: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return 0;
    if (!info.isDirectory) return typeof info.size === 'number' ? info.size : 0;

    const entries = await FileSystem.readDirectoryAsync(uri);
    const childSizes = await Promise.all(
      entries.map((entry) => this.sumBytes(`${uri}${entry}${entry.includes('.') ? '' : '/'}`))
    );
    return childSizes.reduce((total, size) => total + size, 0);
  }
}

export const ayahAudioCache = new AyahAudioCache();

export function createAyahAudioCacheForTest(options: AyahAudioCacheOptions = {}): AyahAudioCache {
  return new AyahAudioCache(options);
}
