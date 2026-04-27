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

jest.mock('../../../src/components/ui/LoadingSkeleton', () => ({
  LoadingSkeleton: () => null,
}));

jest.mock('../../../src/components/ui/ErrorState', () => ({
  ErrorState: () => null,
}));

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MushafPage } from '../../../src/components/quran/MushafPage';

describe('MushafPage', () => {
  it('keeps WebView scrolling enabled so larger Quran text remains readable', () => {
    render(<MushafPage pageNumber={77} />);

    expect(screen.getByTestId('mushaf-webview')).toHaveProp('scrollEnabled', true);
  });

  it('locks WebView scrolling to the vertical axis', () => {
    render(<MushafPage pageNumber={77} />);

    expect(screen.getByTestId('mushaf-webview')).toHaveProp('directionalLockEnabled', true);
    expect(screen.getByTestId('mushaf-webview')).toHaveProp('bounces', false);
    expect(screen.getByTestId('mushaf-webview')).toHaveProp('overScrollMode', 'never');
  });
});
