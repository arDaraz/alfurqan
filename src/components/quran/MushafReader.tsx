import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { PageIndicator } from './PageIndicator';
import { useReadingStore } from '../../stores/readingStore';

const TOTAL_PAGES = 604;

interface MushafReaderProps {
  initialPage: number; // Mushaf page 1-604
}

export function MushafReader({ initialPage }: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      // PagerView uses 0-based index, Mushaf pages are 1-based
      const pageNumber = event.nativeEvent.position + 1;
      setCurrentPage(pageNumber);
      setLastReadPage(pageNumber);
    },
    [setLastReadPage]
  );

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage - 1}
        offscreenPageLimit={1}
        layoutDirection="rtl"
        onPageSelected={handlePageSelected}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, index) => (
          <View key={`page-${index + 1}`} style={styles.pageContainer}>
            <MushafPage pageNumber={index + 1} />
          </View>
        ))}
      </PagerView>
      <PageIndicator currentPage={currentPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});
