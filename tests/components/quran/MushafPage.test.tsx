jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WebView: React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => (
      <View ref={ref} testID="mushaf-webview" {...props} />
    )),
  };
});

jest.mock('../../../src/hooks/useMushafPage', () => ({
  useMushafPage: () => ({
    html: '<html><body>page</body></html>',
    loading: false,
    error: null,
    retry: jest.fn(),
  }),
}));

jest.mock('../../../src/hooks/useReaderColors', () => ({
  useReaderColors: () => ({
    colors: { bg: '#F5EEDB' },
  }),
}));

jest.mock('../../../src/constants/strings', () => ({
  useStrings: () => ({
    mushafFontLoadError: 'Font failed',
    mushafPageLoadError: 'Page failed',
  }),
}));

jest.mock('../../../src/services/recitationEngine', () => ({
  recitationEngine: {
    registerActivePageWebView: jest.fn(),
  },
}));

jest.mock('../../../src/components/ui/LoadingSkeleton', () => ({
  LoadingSkeleton: () => null,
}));

jest.mock('../../../src/components/ui/ErrorState', () => ({
  ErrorState: () => null,
}));

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MushafPage } from '../../../src/components/quran/MushafPage';
import { DEFAULT_MUSHAF_LAYOUT_ID } from '../../../src/data/mushafLayouts';

describe('MushafPage', () => {
  it('keeps the canonical whole-page canvas fixed inside the native pager', () => {
    render(<MushafPage pageNumber={77} layoutId={DEFAULT_MUSHAF_LAYOUT_ID} />);

    expect(screen.getByTestId('mushaf-webview')).toHaveProp('scrollEnabled', false);
  });

  it('does not allow WebView bounce or overscroll to distort the page canvas', () => {
    render(<MushafPage pageNumber={77} layoutId={DEFAULT_MUSHAF_LAYOUT_ID} />);

    expect(screen.getByTestId('mushaf-webview')).toHaveProp('directionalLockEnabled', true);
    expect(screen.getByTestId('mushaf-webview')).toHaveProp('bounces', false);
    expect(screen.getByTestId('mushaf-webview')).toHaveProp('overScrollMode', 'never');
  });
});
