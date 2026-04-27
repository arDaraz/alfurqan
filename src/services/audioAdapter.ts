import TrackPlayer, { Capability, Event } from 'react-native-track-player';

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

let setupPromise: Promise<void> | null = null;
let remoteListenersRegistered = false;

type AudioRemoteHandlers = {
  next?: () => Promise<void> | void;
  pause?: () => Promise<void> | void;
  previous?: () => Promise<void> | void;
  resume?: () => Promise<void> | void;
  seek?: (seconds: number) => Promise<void> | void;
  stop?: () => Promise<void> | void;
};

let remoteHandlers: AudioRemoteHandlers = {};

export function registerAudioRemoteHandlers(handlers: AudioRemoteHandlers): void {
  remoteHandlers = handlers;
}

function registerRemoteListeners(): void {
  if (remoteListenersRegistered) return;
  remoteListenersRegistered = true;
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void remoteHandlers.resume?.();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void remoteHandlers.pause?.();
  });
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void remoteHandlers.stop?.();
  });
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void remoteHandlers.next?.();
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void remoteHandlers.previous?.();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    void remoteHandlers.seek?.(event.position);
  });
}

async function setup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = TrackPlayer.setupPlayer()
      .then(() =>
        TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SeekTo,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
          progressUpdateEventInterval: 1,
        })
      )
      .then(registerRemoteListeners)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

export const audioAdapter: AudioAdapter = {
  async load(options) {
    await setup();
    await TrackPlayer.reset();
    await TrackPlayer.load({
      url: options.uri,
      title: options.title,
      artist: options.artist,
      artwork: options.artwork,
    });
    const progress = await TrackPlayer.getProgress();
    return { durationSeconds: progress.duration || undefined };
  },

  async play() {
    await setup();
    await TrackPlayer.play();
  },

  async pause() {
    await TrackPlayer.pause();
  },

  async stop() {
    await TrackPlayer.stop();
  },

  async seek(seconds) {
    await TrackPlayer.seekTo(seconds);
  },

  async setSpeed(speed) {
    await TrackPlayer.setRate(speed);
  },
};
