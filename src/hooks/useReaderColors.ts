import { useTheme } from './useTheme';
import type { Theme } from '../constants/theme';
import {
  getNightReadingPalette,
  isNightReadingEnabled,
} from '../constants/nightReading';
import { useSettingsStore } from '../stores/settingsStore';

export interface ReaderColors {
  bg: string;
  bgRaised: string;
  bgSunken: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  fgOnPrimary: string;
  primary: string;
  primaryPressed: string;
  primaryTint: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderGold: string;
  danger: string;
}

export function useReaderColors(): {
  theme: Theme;
  colors: ReaderColors;
  nightReadingEnabled: boolean;
} {
  const theme = useTheme();
  const nightReadingMode = useSettingsStore((s) => s.nightReadingMode);
  const nightReadingEnabled = isNightReadingEnabled(nightReadingMode);

  if (!nightReadingEnabled) {
    return {
      theme,
      nightReadingEnabled,
      colors: {
        bg: theme.semantic.bg,
        bgRaised: theme.semantic.bgRaised,
        bgSunken: theme.semantic.bgSunken,
        fg: theme.semantic.fg,
        fgMuted: theme.semantic.fgMuted,
        fgSubtle: theme.semantic.fgSubtle,
        fgOnPrimary: theme.semantic.fgOnPrimary,
        primary: theme.semantic.primary,
        primaryPressed: theme.semantic.primaryPressed,
        primaryTint: theme.semantic.primaryTint,
        accent: theme.semantic.accent,
        accentSoft: theme.semantic.accentSoft,
        border: theme.semantic.border,
        borderGold: theme.semantic.borderGold,
        danger: theme.semantic.danger,
      },
    };
  }

  const palette = getNightReadingPalette(nightReadingMode);
  return {
    theme,
    nightReadingEnabled,
    colors: {
      bg: palette.background,
      bgRaised: palette.surface,
      bgSunken: palette.bgSunken,
      fg: palette.foreground,
      fgMuted: palette.muted,
      fgSubtle: palette.subtle,
      fgOnPrimary: palette.primaryForeground,
      primary: palette.primary,
      primaryPressed: palette.primaryPressed,
      primaryTint: palette.selectedBackground,
      accent: palette.accent,
      accentSoft: palette.accentSoft,
      border: palette.border,
      borderGold: palette.accent,
      danger: theme.semantic.danger,
    },
  };
}
