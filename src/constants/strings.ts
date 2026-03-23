import { useSettingsStore } from '../stores/settingsStore';
import type { AppLanguage } from '../utils/locale';

const ar = {
  // App
  appTitle: 'تسميع',

  // Tabs
  tabHome: 'الرئيسية',
  tabSettings: 'الإعدادات',

  // Home
  searchPlaceholder: 'ابحث عن سورة...',
  tabSurah: 'سورة',
  tabJuz: 'جزء',
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
} as const;

const en = {
  appTitle: "Tasmi'",

  tabHome: 'Home',
  tabSettings: 'Settings',

  searchPlaceholder: 'Search surahs...',
  tabSurah: 'Surah',
  tabJuz: 'Juz',
  ayat: 'ayat',
  makki: 'Makki',
  madani: 'Madani',

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
} as const;

export type Strings = {
  appTitle: string;
  tabHome: string;
  tabSettings: string;
  searchPlaceholder: string;
  tabSurah: string;
  tabJuz: string;
  ayat: string;
  makki: string;
  madani: string;
  errorDefault: string;
  tryAgain: string;
  noResults: string;
  noResultsHint: string;
  ayahSelected: (n: number) => string;
  ayahsSelected: (start: number, end: number) => string;
  clearSelection: string;
  startPractice: string;
  practiceComingSoon: string;
  practiceComingSoonMsg: string;
  onboarding: readonly { readonly heading: string; readonly body: string }[];
  getStarted: string;
  swipeToContinue: string;
  continueReading: string;
  back: string;
};

const strings: Record<AppLanguage, Strings> = { ar, en };

export function getStrings(lang: AppLanguage): Strings {
  return strings[lang];
}

export function useStrings(): Strings {
  const language = useSettingsStore((s) => s.language);
  return strings[language];
}
