import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import {
  getAyahTextRange,
  getMushafJuzAndPageForAyah,
  getSurahLastAyah,
} from '../data/quranRepository';
import { useReadingStore } from '../stores/readingStore';
import { useSettingsStore } from '../stores/settingsStore';
import { recitationEngine } from '../services/recitationEngine';
import type { AyahActionType, AyahSelection } from '../data/types';

export interface AyahActionCallbacks {
  /**
   * Invoked when the user requests a bookmark. The host should open the
   * category-picker sheet. If absent, the bookmark request is a no-op (a
   * warning is logged).
   */
  onRequestBookmark?: (selection: AyahSelection) => void;
}

export async function handleAyahAction(
  action: AyahActionType,
  selection: AyahSelection,
  callbacks?: AyahActionCallbacks
): Promise<void> {
  const { startSurah, startAyah, endSurah, endAyah } = selection;

  switch (action) {
    case 'copy': {
      const text = await getAyahTextRange(startSurah, startAyah, endAyah);
      await Clipboard.setStringAsync(text);
      break;
    }
    case 'share': {
      const text = await getAyahTextRange(startSurah, startAyah, endAyah);
      await Share.share({ message: text });
      break;
    }
    case 'bookmark': {
      const layoutId = useSettingsStore.getState().mushafLayoutId;
      const { juz, page } = await getMushafJuzAndPageForAyah(layoutId, startSurah, startAyah);
      useReadingStore.getState().setLastRead(startSurah, startAyah, juz, page, new Date(), layoutId);
      if (callbacks?.onRequestBookmark) {
        callbacks.onRequestBookmark(selection);
      } else {
        console.warn('handleAyahAction: bookmark request without onRequestBookmark callback');
      }
      break;
    }
    case 'play': {
      const stopAyah = await getSurahLastAyah(startSurah);
      await recitationEngine.start({
        surah: startSurah,
        startAyah,
        stopAyah,
        trigger: 'popup',
        selectedEndSurah: endSurah,
        selectedEndAyah: endAyah,
      });
      break;
    }
    case 'tafsir': {
      console.log(`[AyahAction] tafsir: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
      break;
    }
    case 'wordByWord': {
      console.log(`[AyahAction] wordByWord: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
      break;
    }
  }
}
