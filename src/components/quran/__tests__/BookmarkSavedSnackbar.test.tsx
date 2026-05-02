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

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View: React.forwardRef((props: any, ref: any) => <View ref={ref} {...props} />),
  };
  const passthrough = () => ({ duration: () => ({}) });
  return {
    __esModule: true,
    default: Animated,
    SlideInDown: passthrough(),
    SlideOutDown: passthrough(),
  };
});

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BookmarkSavedSnackbar } from '../BookmarkSavedSnackbar';

describe('BookmarkSavedSnackbar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the saved title, surah/page/juz subtitle, and undo button', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar
        surahName="الفاتحة"
        pageNumber={1}
        juzNumber={1}
        onUndo={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(getByText('تم حفظ الصفحة')).toBeTruthy();
    expect(getByText('الفاتحة · صفحة ١ · جزء ١')).toBeTruthy();
    expect(getByText('تراجع')).toBeTruthy();
  });

  it('invokes onUndo when "تراجع" is pressed', () => {
    const onUndo = jest.fn();
    const { getByLabelText } = render(
      <BookmarkSavedSnackbar
        surahName="الفاتحة"
        pageNumber={1}
        juzNumber={1}
        onUndo={onUndo}
        onDismiss={jest.fn()}
      />
    );

    fireEvent.press(getByLabelText('تراجع'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the visible window elapses', () => {
    const onDismiss = jest.fn();
    render(
      <BookmarkSavedSnackbar
        surahName="الفاتحة"
        pageNumber={1}
        juzNumber={1}
        onUndo={jest.fn()}
        onDismiss={onDismiss}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
