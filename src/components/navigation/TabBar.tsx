import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * 5-column tab bar with a central Tasmi' FAB. Layout from the v2 design:
 * `1fr · 1fr · 72px · 1fr · 1fr` — Home · Surahs · FAB · Review · Profile.
 *
 * The FAB occupies the middle slot and floats above the bar, navigating
 * to `/practice`. Tab order matches the design left-to-right; React
 * Navigation handles RTL flipping automatically.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const tabsByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));

  const renderTab = (
    name: string,
    label: string,
    Icon: React.ComponentType<{ color: string; size: number }>
  ) => {
    const route = tabsByName[name];
    if (!route) return <View style={styles.cell} />;
    const focused = state.routes[state.index].name === name;
    const color = focused ? theme.semantic.primary : theme.semantic.fgSubtle;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        style={styles.cell}
      >
        <Icon color={color} size={22} />
        <Text style={[styles.cellLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.barWrapper}>
      <View testID="bottom-tab-bar" style={styles.bar}>
        {renderTab('index', strings.tabHome, IconHome)}
        {renderTab('surahs', strings.tabSurahs, IconSurahs)}
        <View style={styles.fabSlot} />
        {renderTab('review', strings.tabReview, IconReview)}
        {renderTab('settings', strings.tabProfile, IconProfile)}
      </View>
      <View style={styles.fabFloat} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.toolTasmi}
          onPress={() => router.push('/practice' as never)}
        >
          {({ pressed }) => (
            <View style={[styles.fab, pressed && styles.fabPressed]}>
              <View style={styles.fabHaloRing} pointerEvents="none" />
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Rect x={9} y={3} width={6} height={12} rx={3} stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} />
                <Path d="M5 11a7 7 0 0 0 14 0" stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} strokeLinecap="round" />
                <Path d="M12 18v3" stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} strokeLinecap="round" />
              </Svg>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function IconHome({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconSurahs({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h12a4 4 0 0 1 4 4v12" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 4v16h12" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 9h8M8 13h6" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconReview({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 2" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.75} />
    </Svg>
  );
}

function IconProfile({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.75} />
    </Svg>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    barWrapper: {
      position: 'relative',
    },
    bar: {
      backgroundColor: theme.semantic.bgRaised,
      borderTopColor: theme.semantic.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 44,
    },
    cellLabel: {
      fontSize: 9,
      letterSpacing: 1.2,
      fontWeight: '700',
      fontFamily: theme.fonts.latin,
    },
    fabSlot: {
      width: 72,
    },
    // Floating layer that overlays the bar; pointerEvents="box-none" lets taps
    // pass through to the bar except where the FAB sits.
    fabFloat: {
      position: 'absolute',
      top: -22,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.semantic.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.semantic.bgRaised,
      ...theme.elevation.shadowFloat,
    },
    fabPressed: {
      backgroundColor: theme.semantic.primaryPressed,
    },
    fabHaloRing: {
      position: 'absolute',
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 1,
      borderColor: theme.semantic.accentSoft,
      opacity: 0.5,
    },
  });
}
