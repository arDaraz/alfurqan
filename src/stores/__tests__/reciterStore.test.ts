type MockStorage = {
  value: string | null;
  getString: jest.Mock<string | null, []>;
  set: jest.Mock<void, [string, string]>;
  remove: jest.Mock<void, []>;
  getAllKeys: jest.Mock<string[], []>;
};

const mockStorage: MockStorage = {
  value: null as string | null,
  getString: jest.fn<string | null, []>(() => mockStorage.value),
  set: jest.fn<void, [string, string]>((_: string, value: string) => {
    mockStorage.value = value;
  }),
  remove: jest.fn<void, []>(() => {
    mockStorage.value = null;
  }),
  getAllKeys: jest.fn<string[], []>().mockReturnValue([]),
};

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => mockStorage),
}));

const mockAyahAudioCache = {
  bytesUsed: jest.fn(),
  deleteSurah: jest.fn(),
  downloadSurah: jest.fn(),
};
const mockGetSurahLastAyah = jest.fn();

jest.mock('../../services/ayahAudioCache', () => ({
  ayahAudioCache: mockAyahAudioCache,
}));

jest.mock('../../data/quranRepository', () => ({
  getSurahLastAyah: mockGetSurahLastAyah,
}));

function loadStore() {
  jest.resetModules();
  return require('../reciterStore') as typeof import('../reciterStore');
}

describe('reciterStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.value = null;
    mockAyahAudioCache.bytesUsed.mockResolvedValue(0);
    mockAyahAudioCache.deleteSurah.mockResolvedValue(undefined);
    mockAyahAudioCache.downloadSurah.mockResolvedValue(undefined);
    mockGetSurahLastAyah.mockResolvedValue(7);
  });

  it('defaults to Husary', () => {
    const { useReciterStore } = loadStore();

    expect(useReciterStore.getState().selectedReciterId).toBe('Husary_128kbps');
  });

  it('persists selected reciter changes under reciter-store', () => {
    const { useReciterStore } = loadStore();

    useReciterStore.getState().selectReciter('Minshawy_Murattal_128kbps');

    expect(useReciterStore.getState().selectedReciterId).toBe('Minshawy_Murattal_128kbps');
    expect(mockStorage.set).toHaveBeenCalledWith(
      'reciter-store',
      expect.stringContaining('Minshawy_Murattal_128kbps')
    );
  });

  it('hydrates interrupted downloading states as idle', () => {
    mockStorage.value = JSON.stringify({
      selectedReciterId: 'Minshawy_Murattal_128kbps',
      downloads: {
        'Husary_128kbps:1': {
          ayahsTotal: 7,
          ayahsCached: 3,
          status: 'downloading',
        },
      },
    });

    const { useReciterStore } = loadStore();

    expect(useReciterStore.getState().selectedReciterId).toBe('Minshawy_Murattal_128kbps');
    expect(useReciterStore.getState().downloads['Husary_128kbps:1']).toMatchObject({
      ayahsTotal: 7,
      ayahsCached: 3,
      status: 'idle',
    });
  });

  it('tracks successful surah download progress and completion', async () => {
    mockAyahAudioCache.downloadSurah.mockImplementation(
      async (_reciterId, _surah, _signal, onProgress) => {
        onProgress(1, 7);
        onProgress(7, 7);
      }
    );
    mockAyahAudioCache.bytesUsed.mockResolvedValue(1234);
    const { useReciterStore, downloadKey } = loadStore();

    await useReciterStore.getState().startSurahDownload('Husary_128kbps', 1);

    expect(useReciterStore.getState().downloads[downloadKey('Husary_128kbps', 1)]).toMatchObject({
      ayahsTotal: 7,
      ayahsCached: 7,
      status: 'complete',
      bytes: 1234,
    });
  });

  it('cancel aborts an active download and returns it to idle', async () => {
    let signal!: AbortSignal;
    mockAyahAudioCache.downloadSurah.mockImplementation(
      (_reciterId, _surah, activeSignal) =>
        new Promise<void>((resolve) => {
          signal = activeSignal;
          activeSignal.addEventListener('abort', () => resolve());
        })
    );
    const { useReciterStore, downloadKey } = loadStore();

    const downloadPromise = useReciterStore.getState().startSurahDownload('Husary_128kbps', 1);
    await Promise.resolve();
    useReciterStore.getState().cancelSurahDownload('Husary_128kbps', 1);
    await downloadPromise;

    expect(signal.aborted).toBe(true);
    expect(useReciterStore.getState().downloads[downloadKey('Husary_128kbps', 1)]).toMatchObject({
      ayahsTotal: 7,
      ayahsCached: 0,
      status: 'idle',
    });
  });

  it('sets error status when a download fails', async () => {
    mockAyahAudioCache.downloadSurah.mockRejectedValue(new Error('disk full'));
    const { useReciterStore, downloadKey } = loadStore();

    await useReciterStore.getState().startSurahDownload('Husary_128kbps', 1);

    expect(useReciterStore.getState().downloads[downloadKey('Husary_128kbps', 1)]).toMatchObject({
      status: 'error',
      errorMessage: 'disk full',
    });
  });

  it('delete clears state and removes file data', async () => {
    const { useReciterStore, downloadKey } = loadStore();
    const key = downloadKey('Husary_128kbps', 1);
    useReciterStore.getState().setSurahDownload(key, {
      ayahsTotal: 7,
      ayahsCached: 7,
      status: 'complete',
      bytes: 1234,
    });

    await useReciterStore.getState().deleteSurahDownload('Husary_128kbps', 1);

    expect(mockAyahAudioCache.deleteSurah).toHaveBeenCalledWith('Husary_128kbps', 1);
    expect(useReciterStore.getState().downloads[key]).toBeUndefined();
  });
});
