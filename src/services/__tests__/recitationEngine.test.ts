import { CacheError } from '../ayahAudioCache';
import { createRecitationEngineForTest } from '../recitationEngine';

describe('recitationEngine popup start', () => {
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
});
