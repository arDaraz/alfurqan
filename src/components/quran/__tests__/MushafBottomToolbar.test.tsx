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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
    expect(mockPush).toHaveBeenCalledWith('/practice');
  });

  it('opens the surah index and the page info from their own slots', () => {
    const onInfoPress = jest.fn();
    const { getByLabelText } = render(
      <MushafBottomToolbar onPlayPress={jest.fn()} onInfoPress={onInfoPress} />
    );

    fireEvent.press(getByLabelText('فهرس السور'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/search');

    fireEvent.press(getByLabelText('معلومات الصفحة'));
    expect(onInfoPress).toHaveBeenCalledTimes(1);
  });

  it('does not start another toolbar session while playback is active', () => {
    useRecitationStore.getState()._setState('playing');
    const onPlayPress = jest.fn();
    const { getByLabelText } = render(<MushafBottomToolbar onPlayPress={onPlayPress} />);

    fireEvent.press(getByLabelText('تشغيل'));

    expect(onPlayPress).not.toHaveBeenCalled();
  });

  it('renders the bookmark slot as outline by default and routes presses', () => {
    const onBookmarkPress = jest.fn();
    const { getByLabelText, queryByText } = render(
      <MushafBottomToolbar onPlayPress={jest.fn()} onBookmarkPress={onBookmarkPress} />
    );

    expect(queryByText('bookmark-outline')).toBeTruthy();
    expect(queryByText('bookmark')).toBeNull();

    fireEvent.press(getByLabelText('علامة'));
    expect(onBookmarkPress).toHaveBeenCalledTimes(1);
  });

  it('flips to the filled bookmark icon when the page is bookmarked', () => {
    const { queryByText, getByLabelText } = render(
      <MushafBottomToolbar onPlayPress={jest.fn()} bookmarkActive />
    );

    expect(queryByText('bookmark')).toBeTruthy();
    expect(queryByText('bookmark-outline')).toBeNull();
    expect(getByLabelText('علامة').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });
});
