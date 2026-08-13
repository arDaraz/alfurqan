jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View: (props: any) => <View {...props} />,
  };
  const passthrough = { duration: () => passthrough };
  return {
    __esModule: true,
    default: Animated,
    SlideInDown: passthrough,
    SlideOutDown: passthrough,
    FadeIn: passthrough,
    FadeOut: passthrough,
  };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookmarkCategorySheet } from '../BookmarkCategorySheet';
import type { BookmarkCategory } from '../../../data/types';

function renderSheet(props?: Partial<React.ComponentProps<typeof BookmarkCategorySheet>>) {
  const onCommit = jest.fn();
  const onDismiss = jest.fn();
  const utils = render(
    <BookmarkCategorySheet
      surahName="البقرة"
      ayahNumber={255}
      initialCategories={['reading']}
      onCommit={onCommit}
      onDismiss={onDismiss}
      {...props}
    />
  );
  return { onCommit, onDismiss, ...utils };
}

describe('BookmarkCategorySheet', () => {
  it('renders the reading chip pre-checked when initialCategories includes reading', () => {
    const { getByTestId } = renderSheet({ initialCategories: ['reading'] });
    const reading = getByTestId('chip-reading');
    const recitation = getByTestId('chip-recitation');
    expect(reading.props.accessibilityState).toMatchObject({ checked: true });
    expect(recitation.props.accessibilityState).toMatchObject({ checked: false });
  });

  it('commits added=[recitation] immediately when the recitation chip is tapped', () => {
    const { onCommit, getByTestId } = renderSheet({ initialCategories: ['reading'] });
    fireEvent.press(getByTestId('chip-recitation'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: ['reading'],
      next: ['reading', 'recitation'],
      added: ['recitation'],
      removed: [],
    });
  });

  it('commits removed=[reading] when an already-checked chip is tapped (toggle off)', () => {
    const { onCommit, getByTestId } = renderSheet({ initialCategories: ['reading'] });
    fireEvent.press(getByTestId('chip-reading'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: ['reading'],
      next: [],
      added: [],
      removed: ['reading'],
    });
  });

  it('commits added=[reading] when chip tapped on a never-bookmarked ayah', () => {
    const { onCommit, getByTestId } = renderSheet({ initialCategories: [] });
    fireEvent.press(getByTestId('chip-reading'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: [],
      next: ['reading'],
      added: ['reading'],
      removed: [],
    });
  });

  it('commits an empty next when user taps remove-all', () => {
    const { onCommit, getByText } = renderSheet({ initialCategories: ['reading', 'recitation'] });
    fireEvent.press(getByText('حذف الكل'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: ['reading', 'recitation'],
      next: [],
      added: [],
      removed: ['reading', 'recitation'],
    });
  });

  it('does not show remove-all when initialCategories is empty', () => {
    const { queryByText } = renderSheet({ initialCategories: [] });
    expect(queryByText('حذف الكل')).toBeNull();
  });

  it('dismiss without save is a no-op (no onCommit)', () => {
    const { onCommit, onDismiss, getByTestId } = renderSheet({ initialCategories: [] });
    fireEvent.press(getByTestId('sheet-backdrop', { includeHiddenElements: true }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
