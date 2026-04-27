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

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MushafBottomToolbar } from '../MushafBottomToolbar';
import { useRecitationStore } from '../../../stores/recitationStore';

describe('MushafBottomToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
  });

  it('routes the playback slot to onPlayPress while keeping the mic separate', () => {
    const onPlayPress = jest.fn();
    const { getByLabelText } = render(<MushafBottomToolbar onPlayPress={onPlayPress} />);

    fireEvent.press(getByLabelText('تشغيل'));
    expect(onPlayPress).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText('ابدأ التسميع'));
    expect(onPlayPress).toHaveBeenCalledTimes(1);
  });

  it('does not start another toolbar session while playback is active', () => {
    useRecitationStore.getState()._setState('playing');
    const onPlayPress = jest.fn();
    const { getByLabelText } = render(<MushafBottomToolbar onPlayPress={onPlayPress} />);

    fireEvent.press(getByLabelText('تشغيل'));

    expect(onPlayPress).not.toHaveBeenCalled();
  });
});
