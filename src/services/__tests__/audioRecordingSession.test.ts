import { setAudioModeAsync } from 'expo-audio';
import { endAudioRecordingSession, startAudioRecordingSession } from '../audioAdapter';

const mockedSetAudioModeAsync = setAudioModeAsync as jest.Mock;

describe('audio recording session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the session to the microphone while keeping the playback settings', async () => {
    await startAudioRecordingSession();

    expect(mockedSetAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  });

  it('closes the session to the microphone when listening ends', async () => {
    await endAudioRecordingSession();

    expect(mockedSetAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsRecording: false })
    );
  });
});
