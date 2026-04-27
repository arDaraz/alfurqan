import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import '../../global.css';
import { useTheme, useResolvedThemeMode } from '../hooks/useTheme';
import { useReadingStore } from '../stores/readingStore';
import { SplashView } from '../components/splash/SplashView';

// Arabic-first app: lock layout to RTL regardless of device locale.
// Plain `flex-direction: 'row'` mirrors visually; tab bar / streak opt out
// with `'row-reverse'` to preserve LTR ordering where the design requires it.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const resolvedMode = useResolvedThemeMode();

  const [fontsLoaded] = useFonts({
    // Quranic fonts (existing)
    'KFGQPC-Uthmani': require('../../assets/fonts/KFGQPCUthmanicScriptHAFS.ttf'),
    'AmiriQuran': require('../../assets/fonts/AmiriQuran.ttf'),

    // Latin UI — variable font (wght axis) ships as a single TTF; iOS picks
    // up the requested weight from `fontWeight` style automatically.
    'Manrope': require('../../assets/fonts/Manrope-Variable.ttf'),

    // Latin display (Hero only) — variable Fraunces (opsz, SOFT, wght, WONK)
    'Fraunces': require('../../assets/fonts/Fraunces-Variable.ttf'),
    'Fraunces-Italic': require('../../assets/fonts/Fraunces-VariableItalic.ttf'),

    // Arabic UI — Reem Kufi at 4 static weights. iOS doesn't reliably activate
    // variable wght axis from `fontWeight`; loading separate files lets components
    // pick `ReemKufi-Medium`/`-SemiBold`/`-Bold` directly.
    'ReemKufi': require('../../assets/fonts/ReemKufi-Regular.ttf'),
    'ReemKufi-Medium': require('../../assets/fonts/ReemKufi-Medium.ttf'),
    'ReemKufi-SemiBold': require('../../assets/fonts/ReemKufi-SemiBold.ttf'),
    'ReemKufi-Bold': require('../../assets/fonts/ReemKufi-Bold.ttf'),

    // Arabic body
    'Amiri': require('../../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Italic': require('../../assets/fonts/Amiri-Italic.ttf'),
    'Amiri-Bold': require('../../assets/fonts/Amiri-Bold.ttf'),
  });

  const hasCompletedOnboarding = useReadingStore((s) => s.hasCompletedOnboarding);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/');
    }
  }, [fontsLoaded, hasCompletedOnboarding, segments]);

  if (!fontsLoaded) {
    return <SplashView />;
  }

  const stackScreenOptions = {
    contentStyle: { backgroundColor: theme.semantic.bg, direction: 'rtl' },
    headerShown: false,
  } as const;

  // Redirect first-time users to onboarding
  if (!hasCompletedOnboarding) {
    return (
      <>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="surah/[id]" />
          <Stack.Screen name="juz/[id]" />
          <Stack.Screen name="practice" options={{ presentation: 'modal' }} />
        </Stack>
        <Redirect href="/onboarding" />
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[id]" />
        <Stack.Screen name="juz/[id]" />
        <Stack.Screen name="practice" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
