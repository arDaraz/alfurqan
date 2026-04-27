jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import { CacheError } from '../ayahAudioCache';
import { createRecitationEngineForTest } from '../recitationEngine';
import { useReciterStore } from '../../stores/reciterStore';

describe('recitationEngine popup start', () => {
  beforeEach(() => {
    useReciterStore.setState({
      selectedReciterId: 'Husary_128kbps',
      downloads: {},
    });
  });

  function createAdapter(events: string[] = []) {
    return {
      load: jest.fn(async () => {
        events.push('load');
        return { durationSeconds: 7 };
      }),
      play: jest.fn(async () => {
        events.push('play');
      }),
      pause: jest.fn(async () => {
        events.push('pause');
      }),
      stop: jest.fn(async () => {
        events.push('stop');
      }),
      seek: jest.fn(),
      setSpeed: jest.fn(),
    };
  }

  function createStatusAdapter(events: string[] = []) {
    let listener: ((status: {
      currentTime: number;
      duration: number;
      didJustFinish: boolean;
      isLoaded: boolean;
      playing: boolean;
    }) => void) | null = null;
    const adapter = {
      ...createAdapter(events),
      subscribeStatus: jest.fn((nextListener) => {
        listener = nextListener;
        return () => {
          listener = null;
        };
      }),
      emitStatus(status: {
        currentTime?: number;
        duration?: number;
        didJustFinish?: boolean;
        isLoaded?: boolean;
        playing?: boolean;
      }) {
        listener?.({
          currentTime: status.currentTime ?? 0,
          duration: status.duration ?? 0,
          didJustFinish: status.didJustFinish ?? false,
          isLoaded: status.isLoaded ?? true,
          playing: status.playing ?? true,
        });
      },
    };
    return adapter;
  }

  function createCache(localPath = 'file:///recitation/Husary_128kbps/001/001.mp3') {
    return {
      getLocalPath: jest.fn(async () => localPath),
    };
  }

  it('loads the selected ayah and enters playing state', async () => {
    const events: string[] = [];
    const adapter = createAdapter(events);
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });

    expect(cache.getLocalPath).toHaveBeenCalledWith(
      'Husary_128kbps',
      1,
      1,
      expect.any(AbortSignal)
    );
    expect(adapter.load).toHaveBeenCalled();
    expect(adapter.play).toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      currentAyah: 1,
      durationSeconds: 7,
    });
    expect(events).toEqual(['load', 'play']);
  });

  it('exposes loading while the selected ayah is being resolved', async () => {
    let resolvePath!: (path: string) => void;
    const adapter = createAdapter();
    const cache = {
      getLocalPath: jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolvePath = resolve;
          })
      ),
    };
    const engine = createRecitationEngineForTest({ adapter, cache });

    const startPromise = engine.start({ surah: 1, startAyah: 2, stopAyah: 7, trigger: 'popup' });

    expect(engine.getSnapshot()).toMatchObject({
      state: 'loading',
      currentAyah: 2,
    });

    resolvePath('file:///recitation/Husary_128kbps/001/002.mp3');
    await startPromise;
    expect(engine.getSnapshot().state).toBe('playing');
  });

  it('can pause, resume, and stop back to idle', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    await engine.pause();
    expect(engine.getSnapshot().state).toBe('paused');

    await engine.resume();
    expect(engine.getSnapshot().state).toBe('playing');

    await engine.stop();
    expect(engine.getSnapshot()).toMatchObject({
      state: 'idle',
      range: null,
      currentAyah: null,
    });
  });

  it('enters an error state when audio cannot be loaded', async () => {
    const adapter = createAdapter();
    const cache = {
      getLocalPath: jest.fn(async () => {
        throw new CacheError('network', 'network connection failed');
      }),
    };
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });

    expect(engine.getSnapshot()).toMatchObject({
      state: 'error',
      errorCategory: 'network',
    });
    expect(adapter.load).not.toHaveBeenCalled();
    expect(adapter.play).not.toHaveBeenCalled();
  });

  it('injects playing ayah highlights when playback starts, advances, and stops', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });
    const webView = { injectJavaScript: jest.fn() };

    engine.registerActivePageWebView({ current: webView });
    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    await engine.next();
    await engine.stop();

    expect(webView.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.setPlayingAyah(1, 1)')
    );
    expect(webView.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.setPlayingAyah(1, 2)')
    );
    expect(webView.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.setPlayingAyah(null, null)')
    );
  });

  it('reinjects the current ayah when a new active page registers', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });
    const firstWebView = { injectJavaScript: jest.fn() };
    const secondWebView = { injectJavaScript: jest.fn() };

    engine.registerActivePageWebView({ current: firstWebView });
    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    engine.registerActivePageWebView({ current: secondWebView });

    expect(secondWebView.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.setPlayingAyah(1, 1)')
    );
  });

  it('next advances while below the stop ayah', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 3, trigger: 'popup' });
    await engine.next();

    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      currentAyah: 2,
    });
    expect(cache.getLocalPath).toHaveBeenLastCalledWith(
      'Husary_128kbps',
      1,
      2,
      expect.any(AbortSignal)
    );
  });

  it('updates progress from native playback status', async () => {
    const adapter = createStatusAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    adapter.emitStatus({ currentTime: 3, duration: 9.25 });

    expect(engine.getSnapshot()).toMatchObject({
      positionSeconds: 3,
      durationSeconds: 9.25,
    });
  });

  it('advances to the next ayah when native playback finishes', async () => {
    const adapter = createStatusAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 3, trigger: 'popup' });
    adapter.emitStatus({ currentTime: 7, duration: 7, didJustFinish: true, playing: false });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      currentAyah: 2,
    });
    expect(cache.getLocalPath).toHaveBeenLastCalledWith(
      'Husary_128kbps',
      1,
      2,
      expect.any(AbortSignal)
    );
  });

  it('next stops in continuous mode at the stop ayah', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 3, stopAyah: 3, trigger: 'popup' });
    await engine.next();

    expect(adapter.stop).toHaveBeenCalled();
    expect(engine.getSnapshot().state).toBe('idle');
  });

  it('next loops to ayah one at the stop ayah in loop-surah mode', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    engine.setMode('loop-surah');
    await engine.start({ surah: 1, startAyah: 3, stopAyah: 3, trigger: 'popup' });
    await engine.next();

    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      currentAyah: 1,
      mode: 'loop-surah',
    });
  });

  it('prev is a no-op at ayah one', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    await engine.prev();

    expect(engine.getSnapshot().currentAyah).toBe(1);
    expect(cache.getLocalPath).toHaveBeenCalledTimes(1);
  });

  it('applies a pending seek after loading completes', async () => {
    let resolvePath!: (path: string) => void;
    const adapter = createAdapter();
    const cache = {
      getLocalPath: jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolvePath = resolve;
          })
      ),
    };
    const engine = createRecitationEngineForTest({ adapter, cache });

    const startPromise = engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    await engine.seek(3);
    resolvePath('file:///recitation/Husary_128kbps/001/001.mp3');
    await startPromise;

    expect(adapter.seek).toHaveBeenCalledWith(3);
    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      positionSeconds: 3,
    });
  });

  it('pauses a loading ayah without autoplaying when the load completes', async () => {
    let resolvePath!: (path: string) => void;
    const adapter = createAdapter();
    const cache = {
      getLocalPath: jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolvePath = resolve;
          })
      ),
    };
    const engine = createRecitationEngineForTest({ adapter, cache });

    const startPromise = engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });
    await engine.pause();
    resolvePath('file:///recitation/Husary_128kbps/001/001.mp3');
    await startPromise;

    expect(adapter.play).not.toHaveBeenCalled();
    expect(engine.getSnapshot().state).toBe('paused');
  });

  it('setReciter while idle persists without loading audio', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.setReciter('Minshawy_Murattal_128kbps');

    expect(useReciterStore.getState().selectedReciterId).toBe('Minshawy_Murattal_128kbps');
    expect(cache.getLocalPath).not.toHaveBeenCalled();
    expect(adapter.load).not.toHaveBeenCalled();
  });

  it('setReciter while playing reloads the same ayah from the new reciter', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 2, stopAyah: 7, trigger: 'popup' });
    await engine.setReciter('Minshawy_Murattal_128kbps');

    expect(useReciterStore.getState().selectedReciterId).toBe('Minshawy_Murattal_128kbps');
    expect(cache.getLocalPath).toHaveBeenLastCalledWith(
      'Minshawy_Murattal_128kbps',
      1,
      2,
      expect.any(AbortSignal)
    );
    expect(engine.getSnapshot()).toMatchObject({
      state: 'playing',
      currentAyah: 2,
    });
  });

  it('setReciter while paused reloads and remains paused', async () => {
    const adapter = createAdapter();
    const cache = createCache();
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 2, stopAyah: 7, trigger: 'popup' });
    await engine.pause();
    adapter.play.mockClear();

    await engine.setReciter('Minshawy_Murattal_128kbps');

    expect(cache.getLocalPath).toHaveBeenLastCalledWith(
      'Minshawy_Murattal_128kbps',
      1,
      2,
      expect.any(AbortSignal)
    );
    expect(adapter.play).not.toHaveBeenCalled();
    expect(engine.getSnapshot().state).toBe('paused');
  });
});
