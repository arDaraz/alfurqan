import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useMushafPage } from '../../hooks/useMushafPage';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useStrings } from '../../constants/strings';

interface MushafPageProps {
  pageNumber: number;
}

export function MushafPage({ pageNumber }: MushafPageProps) {
  const { html, loading, error, retry } = useMushafPage(pageNumber);
  const strings = useStrings();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !html) {
    const errorMessage = error === 'font_load_error'
      ? strings.mushafFontLoadError
      : strings.mushafPageLoadError;
    return <ErrorState message={errorMessage} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={false}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={`Mushaf page ${pageNumber}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
