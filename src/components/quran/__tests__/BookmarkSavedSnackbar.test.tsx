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
import { render, fireEvent } from '@testing-library/react-native';
import { BookmarkSavedSnackbar } from '../BookmarkSavedSnackbar';

describe('BookmarkSavedSnackbar', () => {
  let baseProps: {
    surahName: string;
    pageNumber: number;
    juzNumber: number;
    onUndo: jest.Mock;
    onDismiss: jest.Mock;
  };

  beforeEach(() => {
    baseProps = {
      surahName: 'البقرة',
      pageNumber: 42,
      juzNumber: 3,
      onUndo: jest.fn(),
      onDismiss: jest.fn(),
    };
  });

  it('renders the reading-only subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['reading']} />
    );
    expect(getByText(/للقراءة$/)).toBeTruthy();
  });

  it('renders the recitation-only subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['recitation']} />
    );
    expect(getByText(/للتلاوة$/)).toBeTruthy();
  });

  it('renders the both-categories subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['reading', 'recitation']} />
    );
    expect(getByText(/للقراءة والتلاوة$/)).toBeTruthy();
  });

  it('renders the removed subtitle when categories is empty', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={[]} />
    );
    expect(getByText(/تم الحذف$/)).toBeTruthy();
  });

  it('renders the saved title and the undo button', () => {
    const { getByText, getByLabelText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['reading']} />
    );
    expect(getByText('تم حفظ الصفحة')).toBeTruthy();
    expect(getByLabelText('تراجع')).toBeTruthy();
  });

  it('invokes onUndo when the undo button is pressed', () => {
    const onUndo = jest.fn();
    const { getByLabelText } = render(
      <BookmarkSavedSnackbar
        {...baseProps}
        onUndo={onUndo}
        resultingCategories={['reading']}
      />
    );
    fireEvent.press(getByLabelText('تراجع'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the visible window elapses', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <BookmarkSavedSnackbar
        {...baseProps}
        onDismiss={onDismiss}
        resultingCategories={['reading']}
      />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3500);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
