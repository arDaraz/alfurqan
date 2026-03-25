import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { getAyahTextRange } from '../data/quranRepository';
import { useReadingStore } from '../stores/readingStore';
import type { AyahActionType, AyahSelection } from '../data/types';

export async function handleAyahAction(
  action: AyahActionType,
  selection: AyahSelection
): Promise<void> {
  const { startSurah, startAyah, endAyah } = selection;

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
      useReadingStore.getState().toggleBookmark(startSurah, startAyah);
      break;
    }
    case 'play': {
      console.log(`[AyahAction] play: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
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
