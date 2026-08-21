import { useCallback, useState } from 'react';
import { getMushafJuzAndPageForAyah, getSurahByNumber } from '../data/quranRepository';
import { useReadingStore, type BookmarkUndo } from '../stores/readingStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { AyahSelection, BookmarkCategory } from '../data/types';

interface SheetProps {
  surahName: string;
  ayahNumber: number;
  initialCategories: BookmarkCategory[];
  onCommit: (categories: BookmarkCategory[]) => void;
  onDismiss: () => void;
}

interface SnackbarProps {
  surahName: string;
  pageNumber: number;
  juzNumber: number;
  resultingCategories: BookmarkCategory[];
  undone: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export interface BookmarkFlow {
  /** Opens the category sheet for an ayah. Every bookmark entry point goes through this. */
  requestBookmark: (selection: AyahSelection) => void;
  /** Drops one category straight away, with the same confirmation and Undo. */
  removeCategory: (
    surahNumber: number,
    ayahNumber: number,
    category: BookmarkCategory
  ) => void;
  /** Render the category sheet when this is set. */
  sheet: SheetProps | null;
  /** Render the confirmation when this is set. */
  snackbar: SnackbarProps | null;
}

interface Target {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
}

interface Confirmation {
  target: Target;
  pageNumber: number;
  juzNumber: number;
  resultingCategories: BookmarkCategory[];
  undo: BookmarkUndo | null;
}

/**
 * Owns the whole bookmark interaction: which ayah is being edited, what the
 * confirmation says, and how Undo reverses it. Screens render what this returns
 * and choose where it appears, so a screen cannot supply half the behaviour.
 */
export function useBookmarkFlow(): BookmarkFlow {
  const layoutId = useSettingsStore((s) => s.mushafLayoutId);
  const language = useSettingsStore((s) => s.language);
  // Subscribing to the list, rather than to the getter, is what keeps the sheet
  // reactive when a bookmark changes elsewhere.
  const bookmarks = useReadingStore((s) => s.bookmarks);
  const commitBookmarks = useReadingStore((s) => s.commitBookmarks);
  const undoBookmarks = useReadingStore((s) => s.undoBookmarks);

  const [target, setTarget] = useState<Target | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const requestBookmark = useCallback(
    (selection: AyahSelection) => {
      const { startSurah, startAyah } = selection;
      // The sheet opens straight away and the name fills in when it arrives.
      setTarget({ surahNumber: startSurah, ayahNumber: startAyah, surahName: '' });
      void (async () => {
        try {
          const surah = await getSurahByNumber(startSurah);
          const surahName =
            (language === 'ar' ? surah?.nameArabic : surah?.nameEnglish) ?? '';
          setTarget((current) =>
            current?.surahNumber === startSurah && current.ayahNumber === startAyah
              ? { ...current, surahName }
              : current
          );
        } catch {
          // The sheet is still usable without the surah name.
        }
      })();
    },
    [language]
  );

  const commitAndConfirm = useCallback(
    (confirmTarget: Target, categories: BookmarkCategory[]) => {
      const { surahNumber, ayahNumber } = confirmTarget;
      const undo = commitBookmarks(surahNumber, ayahNumber, categories);
      void (async () => {
        try {
          const { juz, page } = await getMushafJuzAndPageForAyah(
            layoutId,
            surahNumber,
            ayahNumber
          );
          setConfirmation({
            target: confirmTarget,
            pageNumber: page,
            juzNumber: juz,
            resultingCategories: categories,
            undo,
          });
        } catch {
          // Without a page and juz there is nothing to confirm, but the commit stands.
        }
      })();
    },
    [commitBookmarks, layoutId]
  );

  const handleCommit = useCallback(
    (categories: BookmarkCategory[]) => {
      if (!target) return;
      commitAndConfirm(target, categories);
      setTarget(null);
    },
    [commitAndConfirm, target]
  );

  const removeCategory = useCallback(
    (surahNumber: number, ayahNumber: number, category: BookmarkCategory) => {
      const remaining = useReadingStore
        .getState()
        .getBookmarkCategories(surahNumber, ayahNumber)
        .filter((c) => c !== category);
      void (async () => {
        let surahName = '';
        try {
          const surah = await getSurahByNumber(surahNumber);
          surahName = (language === 'ar' ? surah?.nameArabic : surah?.nameEnglish) ?? '';
        } catch {
          // The confirmation still reads correctly without the surah name.
        }
        commitAndConfirm({ surahNumber, ayahNumber, surahName }, remaining);
      })();
    },
    [commitAndConfirm, language]
  );

  const handleUndo = useCallback(() => {
    const undo = confirmation?.undo;
    if (!undo) return;
    // The store write stays outside the updater. An updater may run during
    // render or more than once, which would drop or repeat the restore.
    undoBookmarks(undo);
    setConfirmation((current) =>
      current
        ? {
            ...current,
            resultingCategories: undo.previous.map((b) => b.category),
            undo: null,
          }
        : current
    );
  }, [confirmation, undoBookmarks]);

  const categoriesFor = (surahNumber: number, ayahNumber: number) =>
    bookmarks
      .filter((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
      .map((b) => b.category);

  return {
    requestBookmark,
    removeCategory,
    sheet: target && {
      surahName: target.surahName,
      ayahNumber: target.ayahNumber,
      initialCategories: categoriesFor(target.surahNumber, target.ayahNumber),
      onCommit: handleCommit,
      onDismiss: () => setTarget(null),
    },
    snackbar: confirmation && {
      surahName: confirmation.target.surahName,
      pageNumber: confirmation.pageNumber,
      juzNumber: confirmation.juzNumber,
      resultingCategories: confirmation.resultingCategories,
      undone: confirmation.undo === null,
      onUndo: handleUndo,
      onDismiss: () => setConfirmation(null),
    },
  };
}
