jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

import { useReadingStore } from '../readingStore';
import type { Bookmark, BookmarkCategory } from '../../data/types';

const SURAH = 2;
const AYAH = 255;

function categoriesFor(surah: number, ayah: number): BookmarkCategory[] {
  return useReadingStore.getState().getBookmarkCategories(surah, ayah);
}

function seed(bookmarks: Bookmark[]): void {
  useReadingStore.setState({ bookmarks });
}

describe('commitBookmarks and undoBookmarks', () => {
  beforeEach(() => {
    useReadingStore.setState({ bookmarks: [] });
  });

  it('leaves the ayah with no bookmark at all when it had none before', () => {
    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, ['reading']);
    expect(categoriesFor(SURAH, AYAH)).toEqual(['reading']);

    useReadingStore.getState().undoBookmarks(undo);

    expect(categoriesFor(SURAH, AYAH)).toEqual([]);
  });

  it('restores the original creation time so the list keeps its order', () => {
    const original = 1_000;
    seed([{ surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: original }]);

    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, []);
    expect(categoriesFor(SURAH, AYAH)).toEqual([]);

    useReadingStore.getState().undoBookmarks(undo);

    const restored = useReadingStore
      .getState()
      .bookmarks.find((b) => b.surahNumber === SURAH && b.ayahNumber === AYAH);
    expect(restored?.createdAt).toBe(original);
  });

  it('restores only reading when reading was replaced by recitation', () => {
    seed([{ surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 }]);

    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, ['recitation']);
    expect(categoriesFor(SURAH, AYAH)).toEqual(['recitation']);

    useReadingStore.getState().undoBookmarks(undo);

    expect(categoriesFor(SURAH, AYAH)).toEqual(['reading']);
  });

  it('restores both categories when both were reduced to one', () => {
    seed([
      { surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 },
      { surahNumber: SURAH, ayahNumber: AYAH, category: 'recitation', createdAt: 2_000 },
    ]);

    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, ['reading']);
    expect(categoriesFor(SURAH, AYAH)).toEqual(['reading']);

    useReadingStore.getState().undoBookmarks(undo);

    expect(categoriesFor(SURAH, AYAH).sort()).toEqual(['reading', 'recitation']);
  });

  it('restores both categories when both were removed', () => {
    seed([
      { surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 },
      { surahNumber: SURAH, ayahNumber: AYAH, category: 'recitation', createdAt: 2_000 },
    ]);

    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, []);
    expect(categoriesFor(SURAH, AYAH)).toEqual([]);

    useReadingStore.getState().undoBookmarks(undo);

    expect(categoriesFor(SURAH, AYAH).sort()).toEqual(['reading', 'recitation']);
  });

  it('keeps the creation time of a category that survives the commit', () => {
    seed([{ surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 }]);

    useReadingStore.getState().commitBookmarks(SURAH, AYAH, ['reading', 'recitation']);

    const reading = useReadingStore
      .getState()
      .bookmarks.find((b) => b.ayahNumber === AYAH && b.category === 'reading');
    expect(reading?.createdAt).toBe(1_000);
  });

  it('leaves other ayahs untouched', () => {
    seed([
      { surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 },
      { surahNumber: 1, ayahNumber: 1, category: 'recitation', createdAt: 500 },
    ]);

    const undo = useReadingStore.getState().commitBookmarks(SURAH, AYAH, []);
    expect(categoriesFor(1, 1)).toEqual(['recitation']);

    useReadingStore.getState().undoBookmarks(undo);

    expect(categoriesFor(1, 1)).toEqual(['recitation']);
    expect(useReadingStore.getState().bookmarks).toHaveLength(2);
  });
});
