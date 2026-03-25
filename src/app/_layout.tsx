import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import '../../global.css';
import { theme } from '../constants/theme';
import { useReadingStore } from '../stores/readingStore';

SplashScreen.preventAutoHideAsync();

const readerScreenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
} as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'KFGQPC-Uthmani': require('../../assets/fonts/KFGQPCUthmanicScriptHAFS.ttf'),
    'AmiriQuran': require('../../assets/fonts/AmiriQuran.ttf'),
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
    return null;
  }

  // Redirect first-time users to onboarding
  if (!hasCompletedOnboarding) {
    return (
      <>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="surah/[id]" options={readerScreenOptions} />
          <Stack.Screen name="juz/[id]" options={readerScreenOptions} />
        </Stack>
        <Redirect href="/onboarding" />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[id]" options={{ ...readerScreenOptions, headerBackVisible: false }} />
        <Stack.Screen name="juz/[id]" options={{ ...readerScreenOptions, headerBackVisible: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
