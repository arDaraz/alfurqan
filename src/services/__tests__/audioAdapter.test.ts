import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { audioAdapter } from '../audioAdapter';

const mockedCreateAudioPlayer = createAudioPlayer as jest.Mock;
const mockedSetAudioModeAsync = setAudioModeAsync as jest.Mock;
const mockedSetIsAudioActiveAsync = setIsAudioActiveAsync as jest.Mock;

describe('audioAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not initialize ExpoAudio when only subscribing to status updates', () => {
    const unsubscribe = audioAdapter.subscribeStatus?.(jest.fn());

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();
    expect(mockedSetAudioModeAsync).not.toHaveBeenCalled();
    expect(mockedSetIsAudioActiveAsync).not.toHaveBeenCalled();

    unsubscribe?.();
  });

  it('reactivates and unmutes the native audio session before playback', async () => {
    await audioAdapter.load({
      uri: 'file:///documents/recitation/Husary_128kbps/001/001.mp3',
      title: 'السورة 1 · الآية 1',
      artist: 'محمود خليل الحصري',
    });
    await audioAdapter.play();

    const player = mockedCreateAudioPlayer.mock.results[0].value;

    expect(mockedSetAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      })
    );
    expect(mockedSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
    expect(player.muted).toBe(false);
    expect(player.volume).toBe(1);
    expect(player.play).toHaveBeenCalled();
  });
});
