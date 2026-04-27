jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock('../PlayerSheet', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    PlayerSheet: ({ visible }: { visible: boolean }) =>
      visible ? <Text>expanded-player</Text> : null,
  };
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MiniPlayerBar } from '../MiniPlayerBar';
import { useRecitationStore } from '../../../stores/recitationStore';

describe('MiniPlayerBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
    useRecitationStore.getState()._setSession({
      surah: 1,
      startAyah: 1,
      stopAyah: 7,
      trigger: 'popup',
    }, 1);
    useRecitationStore.getState()._setState('playing');
  });

  it('opens the expanded player from the ayah label', () => {
    const { getByText, queryByText } = render(<MiniPlayerBar />);

    expect(queryByText('expanded-player')).toBeNull();

    fireEvent.press(getByText('السورة 1 · الآية 1'));

    expect(getByText('expanded-player')).toBeTruthy();
  });
});
