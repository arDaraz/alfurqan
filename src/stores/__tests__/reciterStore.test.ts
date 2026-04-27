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

function loadStore() {
  jest.resetModules();
  return require('../reciterStore') as typeof import('../reciterStore');
}

describe('reciterStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.value = null;
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
});
