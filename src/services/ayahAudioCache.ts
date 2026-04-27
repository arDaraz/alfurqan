import * as FileSystem from 'expo-file-system/legacy';
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

    await this.download(reciterId, surah, ayah, target, signal);
    return target;
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
}

export const ayahAudioCache = new AyahAudioCache();

export function createAyahAudioCacheForTest(options: AyahAudioCacheOptions = {}): AyahAudioCache {
  return new AyahAudioCache(options);
}
