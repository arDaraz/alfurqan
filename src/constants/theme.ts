export const theme = {
  colors: {
    primary: '#0D7377',       // Deep teal -- interactive elements
    primaryDark: '#0B6163',   // Darker teal for pressed states
    accent: '#C9A84C',        // Gold -- ornamental only
    background: '#FAF8F2',    // Warm cream -- screen backgrounds
    surface: '#FFFFFF',       // White -- cards, nav bars
    text: '#1A1A2E',          // Near black -- primary text
    textSecondary: '#6B7280', // Gray-500 -- metadata
    textDisabled: '#9CA3AF',  // Gray-400 -- disabled
    destructive: '#DC2626',   // Red-600 -- errors only
    selectedRange: '#0D737720', // Teal at 12% opacity
    divider: '#E5E2DA',       // Warm gray divider
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  typography: {
    label: { size: 14, weight: '400' as const, latinLineHeight: 1.4, arabicLineHeight: 1.0 },
    body: { size: 18, weight: '400' as const, latinLineHeight: 1.5, arabicLineHeight: 1.6 },
    heading: { size: 24, weight: '700' as const, latinLineHeight: 1.3, arabicLineHeight: 1.6 },
    display: { size: 28, weight: '700' as const, latinLineHeight: 1.2, arabicLineHeight: 2.2 },
  },
  fonts: {
    arabic: 'KFGQPC-Uthmani',
    quran: 'AmiriQuran',
  },
} as const;
