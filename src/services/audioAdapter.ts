import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

export type AudioLoadOptions = {
  uri: string;
  title: string;
  artist: string;
  artwork?: string;
};

export type AudioLoadResult = {
  durationSeconds?: number;
};

export type AudioAdapter = {
  load(options: AudioLoadOptions): Promise<AudioLoadResult>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setSpeed(speed: number): Promise<void>;
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

export function registerAudioRemoteHandlers(_handlers: AudioRemoteHandlers): void {
  // expo-audio handles lock-screen play/pause/seek on the active player. This
  // hook preserves the engine contract for platforms/adapters with custom events.
}

async function setup(): Promise<AudioPlayer> {
  if (!setupPromise) {
    setupPromise = setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error) => {
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
};
