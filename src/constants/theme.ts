/**
 * Mushaf Al Furqan — Design System v2 ("Mushaf" palette)
 *
 * Three-note: paper · ink · teal, plus gold ornament + sage success / rose correction.
 * Every value has a ramp — components reference *semantic* tokens (`primary`,
 * `bg`, `border`, `accent`) so a single token swap re-skins the entire app.
 *
 * Values ported from `colors_and_type.css` in the Tasmi'/Alfurqan design bundle.
 */

const palette = {
  paper: {
    50: '#FBF6EA',
    100: '#F5EEDB',
    200: '#EBE2C9',
    300: '#D8CBA6',
  },
  ink: {
    300: '#8A9F9B',
    500: '#4A635F',
    700: '#1F3D3A',
    900: '#0E2724',
  },
  teal: {
    50: '#E9F1EE',
    100: '#C8DDD5',
    300: '#6FA396',
    500: '#0B5D53',
    600: '#094A42',
    700: '#063831',
    900: '#02201C',
  },
  gold: {
    300: '#E2C480',
    500: '#B8923F',
    700: '#8A6A26',
  },
  rose: {
    100: '#F3DFD9',
    500: '#A14444',
  },
  sage: {
    100: '#DCE7D9',
    500: '#5F8567',
  },
} as const;

const lightSemantic = {
  bg: palette.paper[100],
  bgRaised: palette.paper[50],
  bgSunken: palette.paper[200],
  bgInverse: palette.ink[900],

  fg: palette.ink[900],
  fgMuted: palette.ink[500],
  fgSubtle: palette.ink[300],
  fgOnPrimary: palette.paper[50],
  fgOnGold: palette.ink[900],

  primary: palette.teal[500],
  primaryPressed: palette.teal[600],
  primaryFocus: palette.teal[700],
  primaryTint: '#0B5D531A',
  primaryFocusRing: '#0B5D5333',

  accent: palette.gold[500],
  accentSoft: palette.gold[300],

  success: palette.sage[500],
  successSoft: palette.sage[100],
  danger: palette.rose[500],
  dangerSoft: palette.rose[100],

  border: '#0E27241A',
  borderStrong: '#0E27243D',
  borderGold: palette.gold[500],

  selectedRange: '#0B5D5324',
} as const;

const darkSemantic = {
  bg: '#0A1C1A',
  bgRaised: '#0F2420',
  bgSunken: '#061412',
  bgInverse: palette.paper[100],

  fg: '#EFE5CE',
  fgMuted: '#B3A884',
  fgSubtle: '#7A7258',
  fgOnPrimary: '#061412',
  fgOnGold: '#061412',

  primary: '#5FA895',
  primaryPressed: '#4E8E7D',
  primaryFocus: '#7EC4B2',
  primaryTint: '#5FA8952E',
  primaryFocusRing: '#5FA8954D',

  accent: '#D4AB5E',
  accentSoft: '#E8C987',

  success: palette.sage[500],
  successSoft: '#243A28',
  danger: '#D27575',
  dangerSoft: '#3A1F1F',

  border: 'rgba(239, 229, 206, 0.12)',
  borderStrong: 'rgba(239, 229, 206, 0.22)',
  borderGold: '#D4AB5E',

  selectedRange: '#5FA89538',
} as const;

const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

const gutter = {
  screen: 24,
  row: 16,
  ayah: 28,
} as const;

const radii = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  pill: 9999,
} as const;

const motion = {
  duration: {
    fast: 140,
    base: 220,
    slow: 360,
    ambient: 1200,
  },
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    entrance: [0.2, 0.9, 0.3, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
} as const;

const fontFamilies = {
  latin: 'Manrope',
  latinDisplay: 'Fraunces',
  arabicUI: 'ReemKufi',
  arabicSerif: 'Amiri',
  quran: 'KFGQPC-Uthmani',
  quranSerif: 'AmiriQuran',
} as const;

const typeScale = {
  caption: { size: 12, lineHeight: 1.4, tracking: 0.24 },
  label: { size: 14, lineHeight: 1.45, tracking: 0.14 },
  body: { size: 17, lineHeight: 1.55, tracking: 0 },
  title: { size: 22, lineHeight: 1.3, tracking: -0.11 },
  heading: { size: 28, lineHeight: 1.25, tracking: -0.28 },
  display: { size: 40, lineHeight: 1.1, tracking: -0.8 },
  hero: { size: 56, lineHeight: 1.02, tracking: -1.68 },
  quran: { size: 30, lineHeight: 2.35 },
  quranSm: { size: 24, lineHeight: 2.15 },
  arabicDisplay: { size: 44, lineHeight: 1.5 },
} as const;

const elevation = {
  shadow1: {
    shadowColor: '#0E2724',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  shadow2: {
    shadowColor: '#0E2724',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  shadow3: {
    shadowColor: '#0E2724',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  shadowFloat: {
    shadowColor: '#0E2724',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;

/**
 * Build the theme object. Keeps the legacy v1 keys (`colors.primary`,
 * `colors.background`, `colors.text`, etc.) so existing components keep
 * rendering with shifted-but-correct v2 values; new code should use the
 * `semantic`, `palette`, and `radii`/`motion`/`elevation` namespaces.
 */
function buildTheme(mode: 'light' | 'dark') {
  const semantic = mode === 'light' ? lightSemantic : darkSemantic;

  return {
    mode,
    palette,
    semantic,
    spacing,
    gutter,
    radii,
    elevation,
    motion,
    typeScale,

    /** Legacy v1 surface — preserved for back-compat. */
    colors: {
      primary: semantic.primary,
      primaryDark: semantic.primaryPressed,
      accent: semantic.accent,
      background: semantic.bg,
      surface: semantic.bgRaised,
      text: semantic.fg,
      textSecondary: semantic.fgMuted,
      textDisabled: semantic.fgSubtle,
      destructive: semantic.danger,
      selectedRange: semantic.selectedRange,
      divider: semantic.border,
    },

    /** Legacy v1 typography (4 steps). */
    typography: {
      label: { size: 14, weight: '400' as const, latinLineHeight: 1.45, arabicLineHeight: 1.6 },
      body: { size: 17, weight: '400' as const, latinLineHeight: 1.55, arabicLineHeight: 1.8 },
      heading: { size: 22, weight: '600' as const, latinLineHeight: 1.3, arabicLineHeight: 1.6 },
      display: { size: 28, weight: '700' as const, latinLineHeight: 1.25, arabicLineHeight: 2.2 },
    },

    fonts: {
      arabic: fontFamilies.arabicUI,
      arabicMedium: 'ReemKufi-Medium',
      arabicSemiBold: 'ReemKufi-SemiBold',
      arabicBold: 'ReemKufi-Bold',
      arabicSerif: fontFamilies.arabicSerif,
      quran: fontFamilies.quran,
      quranSerif: fontFamilies.quranSerif,
      latin: fontFamilies.latin,
      latinDisplay: fontFamilies.latinDisplay,
    },
  } as const;
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

/**
 * Default static export — light theme. Imported directly by legacy code.
 * For runtime theme switching, use `useTheme()` from `src/hooks/useTheme.ts`.
 */
export const theme = lightTheme;

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark';
