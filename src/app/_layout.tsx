import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import '../../global.css';
import { useReadingStore } from '../stores/readingStore';

SplashScreen.preventAutoHideAsync();

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
            contentStyle: { backgroundColor: '#FAF8F2' },
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
          <Stack.Screen
            name="surah/[id]"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#1A1A2E',
            }}
          />
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
          contentStyle: { backgroundColor: '#FAF8F2' },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="surah/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#1A1A2E',
          }}
        />
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
