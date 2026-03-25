import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useMushafPage } from '../../hooks/useMushafPage';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';

interface MushafPageProps {
  pageNumber: number;
  onSelectionEvent?: (data: unknown) => void;
  clearSelectionRef?: React.MutableRefObject<(() => void) | null>;
}

export function MushafPage({ pageNumber, onSelectionEvent, clearSelectionRef }: MushafPageProps) {
  const { html, loading, error, retry } = useMushafPage(pageNumber);
  const strings = useStrings();
  const webViewRef = useRef<WebView>(null);

  // Attach clearSelection to the ref so parent can call it
  const clearSelection = useCallback(() => {
    webViewRef.current?.injectJavaScript('clearSelection();true;');
  }, []);

  React.useEffect(() => {
    if (clearSelectionRef) clearSelectionRef.current = clearSelection;
  }, [clearSelectionRef, clearSelection]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      onSelectionEvent?.(data);
    } catch {}
  }, [onSelectionEvent]);

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
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={handleMessage}
        accessibilityLabel={`Mushaf page ${pageNumber}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
