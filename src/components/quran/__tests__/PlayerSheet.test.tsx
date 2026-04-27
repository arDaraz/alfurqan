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

jest.mock('../../../data/quranRepository', () => ({
  getAyahTextRange: jest.fn().mockResolvedValue('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    next: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    prev: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    seek: jest.fn().mockResolvedValue(undefined),
    setMode: jest.fn(),
    setSpeed: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  },
}));

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PlayerSheet } from '../PlayerSheet';
import { recitationEngine } from '../../../services/recitationEngine';
import { useRecitationStore } from '../../../stores/recitationStore';

describe('PlayerSheet', () => {
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
    useRecitationStore.getState()._setProgress(2, 8);
  });

  it('wires seek and transport controls to the recitation engine', async () => {
    const onClose = jest.fn();
    const { getByLabelText, getByText } = render(<PlayerSheet visible onClose={onClose} />);

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());

    fireEvent.press(getByLabelText('منتصف المقطع'));
    expect(recitationEngine.seek).toHaveBeenCalledWith(4);

    fireEvent.press(getByLabelText('التالي'));
    fireEvent.press(getByLabelText('السابق'));
    fireEvent.press(getByLabelText('إيقاف'));

    expect(recitationEngine.next).toHaveBeenCalledTimes(1);
    expect(recitationEngine.prev).toHaveBeenCalledTimes(1);
    expect(recitationEngine.stop).toHaveBeenCalledTimes(1);
  });

  it('cycles speed and toggles repeat mode', async () => {
    useRecitationStore.getState().setSpeed(0.75);
    const { getByLabelText, getByText } = render(<PlayerSheet visible onClose={jest.fn()} />);

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());

    fireEvent.press(getByLabelText('السرعة'));
    fireEvent.press(getByLabelText('التكرار'));

    expect(recitationEngine.setSpeed).toHaveBeenCalledWith(1);
    expect(recitationEngine.setMode).toHaveBeenCalledWith('loop-surah');
  });
});
