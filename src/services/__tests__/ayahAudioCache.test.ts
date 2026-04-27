jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

import * as FileSystem from 'expo-file-system/legacy';
import { createAyahAudioCacheForTest } from '../ayahAudioCache';

const fs = FileSystem as jest.Mocked<typeof FileSystem>;

describe('ayahAudioCache.getLocalPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an existing non-empty local file without downloading', async () => {
    fs.getInfoAsync.mockResolvedValueOnce({
      exists: true,
      isDirectory: false,
      uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3',
      size: 42,
      modificationTime: 1,
      md5: 'hash',
    });
    const cache = createAyahAudioCacheForTest();

    const path = await cache.getLocalPath('Husary_128kbps', 1, 1, new AbortController().signal);

    expect(path).toBe('file:///documents/recitation/Husary_128kbps/001/001.mp3');
    expect(fs.downloadAsync).not.toHaveBeenCalled();
  });

  it('downloads a missing ayah into persistent document storage', async () => {
    fs.getInfoAsync
      .mockResolvedValueOnce({
        exists: false,
        isDirectory: false,
        uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3',
      })
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3.tmp',
        size: 42,
        modificationTime: 1,
        md5: 'hash',
      });
    fs.downloadAsync.mockResolvedValueOnce({
      uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3.tmp',
      status: 200,
      headers: {},
      md5: 'hash',
      mimeType: 'audio/mpeg',
    });
    const cache = createAyahAudioCacheForTest({ tokenFactory: () => 'token' });

    const path = await cache.getLocalPath('Husary_128kbps', 1, 1, new AbortController().signal);

    expect(fs.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///documents/recitation/Husary_128kbps/001/',
      { intermediates: true }
    );
    expect(fs.downloadAsync).toHaveBeenCalledWith(
      'https://everyayah.com/data/Husary_128kbps/001001.mp3',
      'file:///documents/recitation/Husary_128kbps/001/001.mp3.token.tmp'
    );
    expect(fs.moveAsync).toHaveBeenCalledWith({
      from: 'file:///documents/recitation/Husary_128kbps/001/001.mp3.token.tmp',
      to: 'file:///documents/recitation/Husary_128kbps/001/001.mp3',
    });
    expect(path).toBe('file:///documents/recitation/Husary_128kbps/001/001.mp3');
  });

  it('dedupes parallel requests for the same ayah', async () => {
    fs.getInfoAsync
      .mockResolvedValueOnce({
        exists: false,
        isDirectory: false,
        uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3',
      })
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3.tmp',
        size: 42,
        modificationTime: 1,
        md5: 'hash',
      });
    fs.downloadAsync.mockResolvedValueOnce({
      uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3.tmp',
      status: 200,
      headers: {},
      md5: 'hash',
      mimeType: 'audio/mpeg',
    });
    const cache = createAyahAudioCacheForTest({ tokenFactory: () => 'token' });
    const signal = new AbortController().signal;

    const [first, second] = await Promise.all([
      cache.getLocalPath('Husary_128kbps', 1, 1, signal),
      cache.getLocalPath('Husary_128kbps', 1, 1, signal),
    ]);

    expect(first).toBe(second);
    expect(fs.downloadAsync).toHaveBeenCalledTimes(1);
  });
});
