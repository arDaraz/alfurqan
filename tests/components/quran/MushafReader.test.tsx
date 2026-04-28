const mockMushafPageProps: Record<string, any>[] = [];
const mockSetLastReadPage = jest.fn();

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

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');

  return React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => (
    <View ref={ref} testID="pager-view" {...props} />
  ));
});

jest.mock('../../../src/components/quran/MushafPage', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    MushafPage: (props: Record<string, any>) => {
      mockMushafPageProps.push(props);
      return <View testID={`mushaf-page-${props.pageNumber}`} />;
    },
  };
});

jest.mock('../../../src/components/quran/AyahPopup', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    AyahPopup: () => <View testID="ayah-popup" />,
  };
});

jest.mock('../../../src/components/quran/PageIndicator', () => ({
  PageIndicator: () => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID="page-indicator" />;
  },
}));

jest.mock('../../../src/hooks/useReaderColors', () => ({
  useReaderColors: () => ({
    colors: {
      accent: '#B8923F',
      bg: '#F5EEDB',
    },
  }),
}));

jest.mock('../../../src/stores/readingStore', () => ({
  useReadingStore: (selector: (state: { setLastReadPage: jest.Mock }) => unknown) =>
    selector({ setLastReadPage: mockSetLastReadPage }),
}));

import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { MushafReader } from '../../../src/components/quran/MushafReader';

const selectEvent = (openMenu: boolean) => ({
  type: 'select',
  startSurah: 2,
  startAyah: 1,
  endSurah: 2,
  endAyah: 1,
  x: 100,
  y: 200,
  openMenu,
});

describe('MushafReader', () => {
  beforeEach(() => {
    mockMushafPageProps.length = 0;
    mockSetLastReadPage.mockClear();
  });

  it('keeps a tapped ayah selected without opening the action popup', () => {
    render(<MushafReader initialPage={1} />);

    const currentPage = mockMushafPageProps.find((props) => props.pageNumber === 1);
    act(() => currentPage?.onSelectionEvent(selectEvent(false)));

    expect(screen.queryByTestId('ayah-popup')).toBeNull();
  });

  it('opens the action popup for a long-pressed ayah selection', () => {
    render(<MushafReader initialPage={1} />);

    const currentPage = mockMushafPageProps.find((props) => props.pageNumber === 1);
    act(() => currentPage?.onSelectionEvent(selectEvent(true)));

    expect(screen.getByTestId('ayah-popup')).toBeTruthy();
  });

  it('does not render the duplicate bottom page indicator', () => {
    render(<MushafReader initialPage={1} />);

    expect(screen.queryByTestId('page-indicator')).toBeNull();
  });
});
