import { useSettingsStore } from '../stores/settingsStore';
import type { AppLanguage } from '../utils/locale';

const ar = {
  // App
  appTitle: 'الفرقان',
  appTitleFull: 'مصحف الفرقان',
  appWordmarkRoman: 'ALFURQAN',
  appTagline: 'Recite. We Listen.',

  // Tabs (5-col bar — Home · Surahs · FAB · Review · Profile)
  tabHome: 'الرئيسية',
  tabSurahs: 'السور',
  tabSearch: 'بحث',
  searchAyahsPlaceholder: 'ابحث في القرآن...',
  searchHint: 'ابحث بكلمة أو عبارة من القرآن',
  searchNoResults: 'لا توجد نتائج',
  searchError: 'تعذّر البحث. حاول مرة أخرى.',
  searchGroupCount: (n: number) => `${n} آية`,
  searchAyahCrumb: (juz: number | string, page: number | string) => `جزء ${juz} · ص ${page}`,
  tabReview: 'مراجعة',
  tabProfile: 'الإعدادات',
  tabSettings: 'الإعدادات',

  // Home
  greetingContinueLabel: 'تابع',
  greetingResume: 'استأنف',
  greetingStart: 'ابدأ',
  greetingBeginPrompt: 'ابدأ بسورة الفاتحة',
  greetingResumeTitle: (surahName: string, ayah: number | string) => `سورة ${surahName} · الآية ${ayah}`,
  greetingJuzPage: (juz: string | number, page: string | number) => `الجزء ${juz} · صفحة ${page}`,
  greetingLastReadAgo: (rel: string) => `آخر قراءة ${rel}`,
  searchPlaceholder: 'ابحث عن سورة...',
  tabSurah: 'السور',
  tabJuz: 'الأجزاء',
  ayat: 'آية',
  makki: 'مكية',
  madani: 'مدنية',

  // Error & Empty
  errorDefault: 'تعذّر تحميل القرآن. يرجى إعادة تشغيل التطبيق.',
  tryAgain: 'إعادة المحاولة',
  noResults: 'لم يتم العثور على سور',
  noResultsHint: 'جرّب البحث باسم السورة أو رقمها.',

  // Selection bar
  ayahSelected: (n: number) => `الآية ${n} محددة — اضغط آية أخرى لتحديد النطاق`,
  ayahsSelected: (start: number, end: number) => `الآيات ${start}–${end} محددة`,
  clearSelection: 'مسح التحديد',
  startPractice: 'ابدأ التسميع',
  practiceComingSoon: 'قريبًا',
  practiceComingSoonMsg: 'ستتوفر هذه الميزة في تحديث قادم.',

  // Onboarding
  onboarding: [
    {
      heading: 'شريكك الرقمي في الحفظ',
      body: 'تدرّب على حفظ القرآن في أي وقت ومكان — تصحيح فوري كالمعلم الحقيقي',
    },
    {
      heading: 'اقرأ. نسمع. تصحيح فوري.',
      body: 'اختر أي سورة ومجموعة آيات. اقرأ من حفظك والتطبيق يتابعك كلمة بكلمة.',
    },
    {
      heading: 'ابدأ رحلتك',
      body: 'اختر سورة لتبدأ القراءة. يُحفظ تقدمك تلقائيًا.',
    },
  ],
  getStarted: 'ابدأ الآن',
  swipeToContinue: 'اسحب للمتابعة',

  // Reader
  continueReading: 'متابعة القراءة',
  back: 'رجوع',
  pageIndicator: (page: number, hizb: number) => `صفحة ${page} · حزب ${hizb}`,
  juzShortLabel: (n: number) => `جزء ${n}`,

  // Mushaf
  mushafPageIndicator: (n: number) => `صفحة ${n} من ٦٠٤`,
  mushafPageLoadError: 'تعذّر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.',
  mushafFontLoadError: 'تعذّر تحميل خط المصحف. يرجى إعادة تشغيل التطبيق.',
  recitation: {
    loading: 'جاري التحميل...',
    playing: 'قيد التشغيل',
    paused: 'متوقف مؤقتًا',
    error: 'تعذّر تشغيل التلاوة',
    stop: 'إيقاف',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    nowPlayingAyah: (surah: number, ayah: number) => `السورة ${surah} · الآية ${ayah}`,
    next: 'التالي',
    previous: 'السابق',
    repeat: 'التكرار',
    speed: 'السرعة',
    download: 'تحميل',
    reciter: 'القارئ',
    savedRecitations: 'التلاوات المحفوظة',
    noneSaved: 'لا توجد تلاوات محفوظة بعد',
    delete: 'حذف',
    info: 'معلومات',
    menu: 'القائمة',
    bookmark: 'علامة',
    errorNetwork: 'لا يوجد اتصال بالإنترنت — جرّب لاحقًا أو نزّل السورة',
    errorAudioUnavailable: 'لا تتوفر هذه التلاوة لهذا القارئ',
    errorStorage: 'لا توجد مساحة كافية',
  },

  // Reader toolbar
  toolBookmark: 'إشارة',
  toolListen: 'استماع',
  toolTasmi: 'تسميع',
  toolTranslation: 'ترجمة',
  toolInfo: 'معلومات',

  // Bookmark snackbar
  bookmark: {
    savedTitle: 'تم حفظ الصفحة',
    savedSubtitle: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · صفحة ${page} · جزء ${juz}`,
    undo: 'تراجع',
  },

  // Settings — sections
  settingsTitle: 'الإعدادات',
  settingsRomanLabel: 'SETTINGS',
  settingsSectionReading: 'القراءة',
  settingsSectionAudio: 'الصوت',
  settingsSectionApp: 'التطبيق',
  // Settings — rows
  settingsQuranSize: 'حجم النص القرآني',
  settingsMushafFont: 'خط المصحف',
  settingsMushafFontValue: 'KFGQPC Uthmani · Hafs',
  settingsNightReading: 'القراءة الليلية',
  settingsNightReadingValue: 'وضع المصحف الليلي',
  settingsNightClassical: 'المصحف الكلاسيكي',
  settingsNightClassicalValue: 'أخضر عميق · حبر دافئ',
  settingsNightSepia: 'مصباح سيبيا',
  settingsNightSepiaValue: 'فحمي دافئ · عنبر',
  settingsNightPureInk: 'حبر خالص',
  settingsNightPureInkValue: 'أسود حالك · زخرفة أقل',
  settingsNightIndigo: 'ليل نيلي',
  settingsNightIndigoValue: 'أزرق منتصف الليل · ضوء قمري',
  settingsShowTashkeel: 'عرض التشكيل',
  settingsShowTashkeelValue: 'إظهار الحركات والتنوين',
  settingsQari: 'القارئ',
  settingsQariValue: 'مشاري راشد العفاسي',
  settingsCorrection: 'حساسية التصحيح',
  settingsCorrectionGentle: 'مرنة',
  settingsCorrectionStandard: 'متوسطة',
  settingsCorrectionStrict: 'قوي',
  settingsLanguage: 'اللغة',
  settingsLanguageValue: 'العربية',
  settingsLanguageEnValue: 'English',
  settingsDailyReminder: 'تذكير يومي',
  settingsDailyReminderValue: 'بعد صلاة الفجر',
  settingsAbout: 'حول الفرقان',
  settingsChange: 'تغيير',
  settingsThemeMode: 'مظهر التطبيق',
  settingsThemeLight: 'فاتح',
  settingsThemeDark: 'داكن',
  settingsThemeSystem: 'النظام',

  // Practice mode
  practiceTitle: 'وضع التسميع',
  practiceSubtitle: 'استمع. سجّل. صحّح.',
  practiceListening: 'يستمع',
  practiceListenSample: 'استمع',
  practiceSkip: 'تخطَّ',
  practiceMistakeHint: 'انقر الكلمة الحمراء لسماع النطق الصحيح.',

  // Profile / streak
  streakDays: 'يوم',
  juzPosition: (juz: number, page: number) => `جزء ${juz} · صفحة ${page}`,
} as const;

const en = {
  appTitle: 'Al Furqan',
  appTitleFull: 'Mushaf Al Furqan',
  appWordmarkRoman: 'ALFURQAN',
  appTagline: 'Recite. We Listen.',

  tabHome: 'HOME',
  tabSurahs: 'SURAHS',
  tabSearch: 'SEARCH',
  searchAyahsPlaceholder: 'Search the Quran...',
  searchHint: 'Search by a word or phrase from the Quran',
  searchNoResults: 'No results',
  searchError: 'Unable to search. Try again.',
  searchGroupCount: (n: number) => `${n} verses`,
  searchAyahCrumb: (juz: number | string, page: number | string) => `Juz ${juz} · p. ${page}`,
  tabReview: 'REVIEW',
  tabProfile: 'PROFILE',
  tabSettings: 'Settings',

  greetingContinueLabel: 'Continue',
  greetingResume: 'Resume',
  greetingStart: 'Start',
  greetingBeginPrompt: 'Begin with Al-Fatihah',
  greetingResumeTitle: (surahName: string, ayah: number | string) => `Surah ${surahName} · Ayah ${ayah}`,
  greetingJuzPage: (juz: string | number, page: string | number) => `Juz ${juz} · Page ${page}`,
  greetingLastReadAgo: (rel: string) => `Last read ${rel}`,
  searchPlaceholder: 'Search surahs...',
  tabSurah: 'Surah',
  tabJuz: 'Juzʾ',
  ayat: 'AYAT',
  makki: 'Meccan',
  madani: 'Medinan',

  errorDefault: 'Unable to load Quran text. Please restart the app.',
  tryAgain: 'Try Again',
  noResults: 'No surahs found',
  noResultsHint: 'Try searching by surah name or number.',

  ayahSelected: (n: number) => `Ayah ${n} selected — tap another ayah to set range end`,
  ayahsSelected: (start: number, end: number) => `Ayahs ${start}–${end} selected`,
  clearSelection: 'Clear Selection',
  startPractice: 'Start Practice',
  practiceComingSoon: 'Coming Soon',
  practiceComingSoonMsg: 'This feature will be available in a future update.',

  onboarding: [
    {
      heading: 'Your Digital Memorization Partner',
      body: 'Practice your Quran memorization anytime, anywhere — receive instant correction like a real teacher.',
    },
    {
      heading: 'Recite. We Listen. Instant Feedback.',
      body: 'Select any surah and ayah range. Recite from memory while the app follows along word by word.',
    },
    {
      heading: 'Begin Your Journey',
      body: 'Choose a surah to start reading. Your progress is saved automatically.',
    },
  ],
  getStarted: 'Get Started',
  swipeToContinue: 'Swipe to continue',

  continueReading: 'Continue reading',
  back: 'Back',
  pageIndicator: (page: number, hizb: number) => `PAGE ${page} · ḤIZB ${hizb}`,
  juzShortLabel: (n: number) => `Juzʾ ${n}`,

  mushafPageIndicator: (n: number) => `Page ${n} of 604`,
  mushafPageLoadError: 'Unable to load this page. Please try again.',
  mushafFontLoadError: 'Unable to load Mushaf font. Please restart the app.',
  recitation: {
    loading: 'Loading...',
    playing: 'Playing',
    paused: 'Paused',
    error: 'Unable to play recitation',
    stop: 'Stop',
    play: 'Play',
    pause: 'Pause',
    nowPlayingAyah: (surah: number, ayah: number) => `Surah ${surah} · Ayah ${ayah}`,
    next: 'Next',
    previous: 'Previous',
    repeat: 'Repeat',
    speed: 'Speed',
    download: 'Download',
    reciter: 'Reciter',
    savedRecitations: 'Saved recitations',
    noneSaved: 'No saved recitations yet',
    delete: 'Delete',
    info: 'Info',
    menu: 'Menu',
    bookmark: 'Bookmark',
    errorNetwork: 'No internet connection — try later or download the surah',
    errorAudioUnavailable: 'This recitation is not available for this reciter',
    errorStorage: 'Not enough storage space',
  },

  toolBookmark: 'Bookmark',
  toolListen: 'Listen',
  toolTasmi: 'Tasmīʿ',
  toolTranslation: 'Translation',
  toolInfo: 'Info',

  bookmark: {
    savedTitle: 'Page saved',
    savedSubtitle: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · Page ${page} · Juz ${juz}`,
    undo: 'Undo',
  },

  settingsTitle: 'Settings',
  settingsRomanLabel: 'SETTINGS',
  settingsSectionReading: 'Reading',
  settingsSectionAudio: 'Audio',
  settingsSectionApp: 'App',
  settingsQuranSize: 'Quran text size',
  settingsMushafFont: 'Mushaf typeface',
  settingsMushafFontValue: 'KFGQPC Uthmani · Hafs',
  settingsNightReading: 'Night reading',
  settingsNightReadingValue: 'Choose reader palette',
  settingsNightClassical: 'Classical Mushaf',
  settingsNightClassicalValue: 'Deep teal-black · warm ink',
  settingsNightSepia: 'Sepia Lamp',
  settingsNightSepiaValue: 'Warm charcoal · amber ink',
  settingsNightPureInk: 'Pure Ink',
  settingsNightPureInkValue: 'OLED black · minimal chrome',
  settingsNightIndigo: 'Indigo Night',
  settingsNightIndigoValue: 'Midnight blue · moonlight',
  settingsShowTashkeel: 'Show tashkīl',
  settingsShowTashkeelValue: 'Display vowel diacritics',
  settingsQari: 'Reciter',
  settingsQariValue: 'Mishary Rashid Alafasy',
  settingsCorrection: 'Correction sensitivity',
  settingsCorrectionGentle: 'Gentle',
  settingsCorrectionStandard: 'Standard',
  settingsCorrectionStrict: 'Strict',
  settingsLanguage: 'Language',
  settingsLanguageValue: 'العربية',
  settingsLanguageEnValue: 'English',
  settingsDailyReminder: 'Daily reminder',
  settingsDailyReminderValue: 'After Fajr',
  settingsAbout: 'About Al Furqan',
  settingsChange: 'Change',
  settingsThemeMode: 'Appearance',
  settingsThemeLight: 'Light',
  settingsThemeDark: 'Dark',
  settingsThemeSystem: 'System',

  practiceTitle: 'Practice Mode',
  practiceSubtitle: 'Listen. Recite. Correct.',
  practiceListening: 'Listening',
  practiceListenSample: 'Listen',
  practiceSkip: 'Skip',
  practiceMistakeHint: 'Tap the red word to hear correct pronunciation.',

  streakDays: 'DAY',
  juzPosition: (juz: number, page: number) => `JUZ ${juz} · PAGE ${page}`,
} as const;

type StringsBase = typeof ar;
/** Loosen literal types so the en bundle is assignable. */
type LoosenStrings<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => infer R
      ? (...args: A) => R
      : T[K] extends readonly (infer Item)[]
        ? readonly LoosenStrings<Item>[]
        : T[K] extends object
          ? LoosenStrings<T[K]>
          : T[K];
};

export type Strings = LoosenStrings<StringsBase>;

const strings: Record<AppLanguage, Strings> = { ar, en } as unknown as Record<AppLanguage, Strings>;

export function getStrings(lang: AppLanguage): Strings {
  return strings[lang];
}

export function useStrings(): Strings {
  const language = useSettingsStore((s) => s.language);
  return strings[language];
}
