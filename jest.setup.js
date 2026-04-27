// Polyfill for expo's import.meta registry used in SDK 55
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {
    register: () => {},
    get: () => ({}),
  };
}

const mockAudioPlayer = {
  isLoaded: true,
  duration: 0,
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setActiveForLockScreen: jest.fn(),
  clearLockScreenControls: jest.fn(),
  setPlaybackRate: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockAudioPlayer),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));
