import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { getAyahTextRange, getSurahLastAyah } from '../data/quranRepository';
import { useReadingStore } from '../stores/readingStore';
import { recitationEngine } from '../services/recitationEngine';
import type { AyahActionType, AyahSelection } from '../data/types';

export async function handleAyahAction(
  action: AyahActionType,
  selection: AyahSelection
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
      useReadingStore.getState().toggleBookmark(startSurah, startAyah);
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
