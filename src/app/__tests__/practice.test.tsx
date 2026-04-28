jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: {
      inOut: jest.fn((easing) => easing),
      sin: jest.fn(),
    },
    useAnimatedStyle: jest.fn((factory) => factory()),
    useSharedValue: jest.fn((value) => ({ value })),
    withRepeat: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
  };
});

jest.mock('../../services/recitationEngine', () => ({
  recitationEngine: {
    start: jest.fn().mockResolvedValue(undefined),
  },
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PracticeScreen from '../practice';
import { recitationEngine } from '../../services/recitationEngine';

describe('PracticeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('plays the current practice ayah from the listen sample button', () => {
    const { getByLabelText } = render(<PracticeScreen />);

    fireEvent.press(getByLabelText('استمع'));

    expect(recitationEngine.start).toHaveBeenCalledWith({
      surah: 1,
      startAyah: 2,
      stopAyah: 2,
      trigger: 'practice',
    });
  });
});
