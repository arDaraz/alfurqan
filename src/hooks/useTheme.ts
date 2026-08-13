import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';

export function useTheme(): Theme {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  if (themeMode === 'light') return lightTheme;
  if (themeMode === 'dark') return darkTheme;
  return systemScheme === 'dark' ? darkTheme : lightTheme;
}

/** Returns just the resolved mode string (`'light'` or `'dark'`). */
export function useResolvedThemeMode(): 'light' | 'dark' {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  if (themeMode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return themeMode;
}
