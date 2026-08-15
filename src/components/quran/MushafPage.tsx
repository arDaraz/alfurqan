import React, { useRef, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useMushafPage } from '../../hooks/useMushafPage';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useStrings } from '../../constants/strings';
import { recitationEngine } from '../../services/recitationEngine';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import type { MushafLayoutId } from '../../data/mushafLayouts';

interface MushafPageProps {
  pageNumber: number;
  layoutId: MushafLayoutId;
  isActive?: boolean;
  onSelectionEvent?: (data: unknown) => void;
  clearSelectionRef?: React.MutableRefObject<(() => void) | null>;
}

export function MushafPage({
  pageNumber,
  layoutId,
  isActive = false,
  onSelectionEvent,
  clearSelectionRef,
}: MushafPageProps) {
  const { html, accessibilityLabel, loading, error, retry } = useMushafPage(pageNumber, layoutId);
  const strings = useStrings();
  const { colors } = useReaderColors();
  const styles = createStyles(colors);
  const webViewRef = useRef<WebView>(null);
  // The WebView paints an empty page while it decodes the Qur'an font, so the
  // skeleton stays until the page reports that its text is laid out.
  const [painted, setPainted] = useState(false);

  React.useEffect(() => {
    setPainted(false);
  }, [html]);

  // Attach clearSelection to the ref so parent can call it
  const clearSelection = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.clearSelection&&window.clearSelection();true;');
  }, []);

  React.useEffect(() => {
    if (clearSelectionRef) clearSelectionRef.current = clearSelection;
  }, [clearSelectionRef, clearSelection]);

  React.useEffect(() => {
    if (!isActive || !html) return;
    recitationEngine.registerActivePageWebView(webViewRef);
    return () => {
      recitationEngine.registerActivePageWebView(null);
    };
  }, [html, isActive]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'ready') {
        setPainted(true);
        return;
      }
      onSelectionEvent?.(data);
    } catch {}
  }, [onSelectionEvent]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !html) {
    const errorMessage = error === 'font_load_error'
      ? strings.mushafFontLoadError
      : error === 'content_pack_error'
        ? strings.mushafContentPackError
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
        directionalLockEnabled={true}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled={true}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={handleMessage}
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel || `Mushaf page ${pageNumber}`}
      />
      {!painted && (
        <View style={styles.paintOverlay} pointerEvents="none">
          <LoadingSkeleton />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    webview: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    paintOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.bg,
    },
  });
}
