jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View: (props: any) => <View {...props} />,
  };
  const passthrough = { duration: () => passthrough };
  return {
    __esModule: true,
    default: Animated,
    SlideInDown: passthrough,
    SlideOutDown: passthrough,
    FadeIn: passthrough,
    FadeOut: passthrough,
  };
});

const mockHandleAyahAction = jest.fn<
  Promise<void>,
  [string, unknown, { onRequestBookmark?: (sel: unknown) => void } | undefined]
>((action, selection, callbacks) => {
  if (action === 'bookmark' && callbacks?.onRequestBookmark) {
    callbacks.onRequestBookmark(selection);
  }
  return Promise.resolve();
});
const mockRouterPush = jest.fn<void, unknown[]>();
const mockEngineStart = jest.fn<Promise<void>, unknown[]>(() => Promise.resolve());
const mockEngineStop = jest.fn<Promise<void>, []>(() => Promise.resolve());
const mockEnginePause = jest.fn<Promise<void>, []>(() => Promise.resolve());
const mockEngineResume = jest.fn<Promise<void>, []>(() => Promise.resolve());
let mockEngineState: { state: string; range: { surah: number; startAyah: number } | null } = {
  state: 'idle',
  range: null,
};

jest.mock('../../../actions/ayahActions', () => ({
  handleAyahAction: (action: string, selection: unknown, callbacks: unknown) =>
    mockHandleAyahAction(action, selection, callbacks as any),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    start: (...args: unknown[]) => mockEngineStart(...args),
    stop: () => mockEngineStop(),
    pause: () => mockEnginePause(),
    resume: () => mockEngineResume(),
  },
}));

jest.mock('../../../stores/recitationStore', () => ({
  useRecitationStore: Object.assign(
    (selector: (s: typeof mockEngineState) => unknown) => selector(mockEngineState),
    {
      getState: () => mockEngineState,
    },
  ),
}));

const mockAddBookmark = jest.fn();
const mockRemoveBookmark = jest.fn();
const mockGetBookmarkCategories = jest.fn<unknown[], [number, number]>(() => []);

jest.mock('../../../stores/readingStore', () => ({
  useReadingStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({
        bookmarks: [],
        addBookmark: mockAddBookmark,
        removeBookmark: mockRemoveBookmark,
        getBookmarkCategories: mockGetBookmarkCategories,
      }),
    {
      getState: () => ({
        bookmarks: [],
        addBookmark: mockAddBookmark,
        removeBookmark: mockRemoveBookmark,
        getBookmarkCategories: mockGetBookmarkCategories,
      }),
    },
  ),
}));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: ({ data = [], renderItem }: { data?: unknown[]; renderItem: (info: { item: unknown; index: number }) => React.ReactNode }) => (
      <View>
        {data.map((item, index) => (
          <React.Fragment key={index}>{renderItem({ item, index })}</React.Fragment>
        ))}
      </View>
    ),
  };
});

jest.mock('../../../hooks/useSurahList', () => ({
  useSurahList: () => ({
    surahs: [
      {
        number: 2,
        nameArabic: 'البقرة',
        nameEnglish: 'Al-Baqarah',
        ayahCount: 286,
        revelationType: 'Madani',
        revelationOrder: 87,
        juzStart: 1,
      },
    ],
  }),
}));

jest.mock('../../../data/quranRepository', () => ({
  searchAyahs: jest.fn(() =>
    Promise.resolve([
      {
        surahNumber: 2,
        ayahNumber: 53,
        textUthmani: 'وَإِذْ ءَاتَيْنَا مُوسَى ٱلْكِتَٰبَ وَٱلْفُرْقَانَ',
        juzNumber: 1,
        pageNumber: 8,
      },
    ]),
  ),
  getSurahByNumber: jest.fn(async (n: number) => ({
    number: n,
    nameArabic: 'البقرة',
    nameEnglish: 'Al-Baqarah',
    ayahCount: 286,
    revelationType: 'Madani',
    revelationOrder: 87,
    juzStart: 1,
  })),
  getAyahPreview: jest.fn(async () => 'preview'),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../SearchScreen';

describe('SearchScreen action wiring', () => {
  beforeEach(() => {
    mockHandleAyahAction.mockClear();
    mockRouterPush.mockClear();
    mockEngineStart.mockClear();
    mockEngineStop.mockClear();
    mockEnginePause.mockClear();
    mockEngineResume.mockClear();
    mockEngineState = { state: 'idle', range: null };
    mockAddBookmark.mockReset();
    mockRemoveBookmark.mockReset();
    mockGetBookmarkCategories.mockReset();
    mockGetBookmarkCategories.mockReturnValue([]);
  });

  it('plays only the single ayah of the search result via recitationEngine.start', async () => {
    const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);
    const playButton = await findByLabelText(/تشغيل الآية|Play verse/i);

    fireEvent.press(playButton);

    await waitFor(() => {
      expect(mockEngineStart).toHaveBeenCalledWith(
        expect.objectContaining({
          surah: 2,
          startAyah: 53,
          stopAyah: 53,
        }),
      );
    });
  });

  it('stops existing playback before starting a new ayah', async () => {
    mockEngineState = {
      state: 'playing',
      range: { surah: 2, startAyah: 100 },
    };
    const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);
    const playButton = await findByLabelText(/تشغيل الآية|Play verse/i);

    fireEvent.press(playButton);

    await waitFor(() => {
      expect(mockEngineStop).toHaveBeenCalled();
      expect(mockEngineStart).toHaveBeenCalled();
    });
  });

  it('pauses when the currently-playing ayah is tapped again', async () => {
    mockEngineState = {
      state: 'playing',
      range: { surah: 2, startAyah: 53 },
    };
    const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);
    const playButton = await findByLabelText(/إيقاف الآية مؤقتًا|Pause verse/i);

    fireEvent.press(playButton);

    await waitFor(() => {
      expect(mockEnginePause).toHaveBeenCalled();
      expect(mockEngineStart).not.toHaveBeenCalled();
    });
  });

  it('routes copy to handleAyahAction with the result selection', async () => {
    const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);
    const copyButton = await findByLabelText(/نسخ الآية|Copy verse/i);
    fireEvent.press(copyButton);

    const expectedSelection = {
      startSurah: 2,
      startAyah: 53,
      endSurah: 2,
      endAyah: 53,
    };
    await waitFor(() => {
      expect(mockHandleAyahAction).toHaveBeenCalledWith('copy', expectedSelection, undefined);
    });
  });

  it('opens the category sheet when the bookmark action is pressed', async () => {
    const { findByLabelText, findByText } = render(<SearchScreen initialQuery="الفرقان" />);
    const bookmarkButton = await findByLabelText(/حفظ الآية|Bookmark verse/i);
    fireEvent.press(bookmarkButton);

    expect(await findByText('حفظ الإشارة المرجعية')).toBeTruthy();
  });

  it('commits the chosen category to the store when save is pressed', async () => {
    const { findByLabelText, findByText, findByTestId } = render(
      <SearchScreen initialQuery="الفرقان" />,
    );
    fireEvent.press(await findByLabelText(/حفظ الآية|Bookmark verse/i));
    fireEvent.press(await findByTestId('chip-reading'));
    fireEvent.press(await findByText('حفظ'));

    await waitFor(() => {
      expect(mockAddBookmark).toHaveBeenCalledWith(2, 53, 'reading');
    });
  });

  it('routes to the surah page when the card body is pressed', async () => {
    const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);

    const card = await findByLabelText(/سورة البقرة|Surah Al-Baqarah/i);
    fireEvent.press(card);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/surah/2?page=8');
    });
  });
});
