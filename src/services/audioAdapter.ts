import TrackPlayer, { Capability } from 'react-native-track-player';

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
