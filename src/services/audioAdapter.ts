import type { AudioPlayer, AudioStatus } from 'expo-audio';

export type AudioLoadOptions = {
  uri: string;
  title: string;
  artist: string;
  artwork?: string;
};

export type AudioLoadResult = {
  durationSeconds?: number;
};

export type AudioPlaybackStatus = {
  currentTime: number;
  duration: number;
  didJustFinish: boolean;
  isLoaded: boolean;
  playing: boolean;
};

export type AudioAdapter = {
  load(options: AudioLoadOptions): Promise<AudioLoadResult>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setSpeed(speed: number): Promise<void>;
  subscribeStatus?: (listener: (status: AudioPlaybackStatus) => void) => () => void;
};

type AudioRemoteHandlers = {
  next?: () => Promise<void> | void;
  pause?: () => Promise<void> | void;
  previous?: () => Promise<void> | void;
  resume?: () => Promise<void> | void;
  seek?: (seconds: number) => Promise<void> | void;
  stop?: () => Promise<void> | void;
};

let player: AudioPlayer | null = null;
let setupPromise: Promise<void> | null = null;
let statusListener: ((status: AudioPlaybackStatus) => void) | null = null;
let statusSubscription: { remove: () => void } | null = null;
let audioModule: typeof import('expo-audio') | null = null;

async function getAudioModule(): Promise<typeof import('expo-audio')> {
  if (!audioModule) {
    try {
      // Keep this guarded so older physical dev-client binaries can still boot
      // screens that import recitation services before the app is reinstalled.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      audioModule = require('expo-audio') as typeof import('expo-audio');
    } catch (error) {
      const wrapped = new Error(
        'ExpoAudio native module is unavailable. Rebuild and reinstall the development client on this device.'
      );
      (wrapped as Error & { cause?: unknown }).cause = error;
      throw wrapped;
    }
  }
  return audioModule;
}

async function activateAudioSession(activePlayer?: AudioPlayer): Promise<void> {
  const { setIsAudioActiveAsync } = await getAudioModule();
  await setIsAudioActiveAsync(true);
  if (activePlayer) {
    activePlayer.muted = false;
    activePlayer.volume = 1;
  }
}

export function registerAudioRemoteHandlers(_handlers: AudioRemoteHandlers): void {
  // expo-audio handles lock-screen play/pause/seek on the active player. This
  // hook preserves the engine contract for platforms/adapters with custom events.
}

async function setup(): Promise<AudioPlayer> {
  const { createAudioPlayer, setAudioModeAsync } = await getAudioModule();

  if (!setupPromise) {
    setupPromise = setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => activateAudioSession())
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }

  await setupPromise;

  if (!player) {
    player = createAudioPlayer(null, {
      updateInterval: 1000,
      keepAudioSessionActive: true,
    });
    player.muted = false;
    player.volume = 1;
    statusSubscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      statusListener?.({
        currentTime: status.currentTime,
        duration: status.duration,
        didJustFinish: status.didJustFinish,
        isLoaded: status.isLoaded,
        playing: status.playing,
      });
    });
  }

  return player;
}

async function waitForLoad(activePlayer: AudioPlayer): Promise<AudioLoadResult> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (activePlayer.isLoaded || activePlayer.duration > 0) {
      return { durationSeconds: activePlayer.duration || undefined };
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return { durationSeconds: activePlayer.duration || undefined };
}

export const audioAdapter: AudioAdapter = {
  async load(options) {
    const activePlayer = await setup();
    await activateAudioSession(activePlayer);
    activePlayer.pause();
    activePlayer.replace({ uri: options.uri, name: options.title });
    activePlayer.setActiveForLockScreen(
      true,
      {
        title: options.title,
        artist: options.artist,
        artworkUrl: options.artwork,
      },
      {
        showSeekBackward: false,
        showSeekForward: false,
      }
    );

    return waitForLoad(activePlayer);
  },

  async play() {
    const activePlayer = await setup();
    await activateAudioSession(activePlayer);
    activePlayer.play();
  },

  async pause() {
    player?.pause();
  },

  async stop() {
    player?.pause();
    await player?.seekTo(0);
    player?.clearLockScreenControls();
  },

  async seek(seconds) {
    await player?.seekTo(seconds);
  },

  async setSpeed(speed) {
    player?.setPlaybackRate(speed, 'medium');
  },

  subscribeStatus(listener) {
    statusListener = listener;
    return () => {
      if (statusListener === listener) {
        statusListener = null;
      }
    };
  },
};
