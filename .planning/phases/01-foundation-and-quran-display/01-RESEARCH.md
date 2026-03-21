# Phase 1: Foundation and Quran Display - Research

**Researched:** 2026-03-21
**Domain:** Expo SDK 55 project scaffold, Quran data layer (SQLite), Uthmani Arabic text rendering, navigation, ayah selection, bookmarking, onboarding
**Confidence:** HIGH

## Summary

Phase 1 is the greenfield foundation of the Tasmi' app. It establishes the Expo SDK 55 project skeleton, the Quran text data layer (bundled SQLite database with word-level Uthmani text), Arabic text rendering with the KFGQPC Uthmani Hafs font, surah/juz navigation, ayah range selection for recitation practice, auto-bookmark of last-read position, and a 3-screen bilingual onboarding flow. There is no existing code -- this phase creates every pattern that subsequent phases will follow.

The technologies are well-established and well-documented. Expo SDK 55 (React Native 0.83.2) with New Architecture is the current stable production stack. expo-sqlite provides bundled pre-populated database support. NativeWind 4.x brings Tailwind styling to React Native. FlashList v2 handles performant list rendering. Zustand + MMKV handle persistent state. The Quran Foundation API v4 provides word-level Uthmani text data that can be pre-fetched at build time and bundled as a SQLite database.

The single highest-risk item in this phase is Arabic text rendering with full Uthmani diacritics (tashkeel) on real devices. React Native has known issues with RTL Arabic text clipping (issue #55220, Jan 2026) and diacritic collision. The KFGQPC Uthmani Hafs font must be tested on physical iOS and Android devices early. Everything else in this phase follows standard, well-documented patterns.

**Primary recommendation:** Use expo-sqlite (not WatermelonDB) for the Quran text database -- it is simpler, first-party, supports bundled assets natively, and the Quran corpus is read-only static data that does not need WatermelonDB's reactive/sync features. Reserve WatermelonDB for progress data in later phases if needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Continuous vertical scroll layout -- ayahs flow top-to-bottom in a scrollable view
- Arabic text only -- no translations or transliterations
- Ornamental end-of-ayah markers with Arabic-Indic numerals inside traditional symbol
- Ornamental surah header banners -- decorative frame showing surah name in Arabic, ayah count, and revelation type (Makki/Madani)
- Large, readable Arabic text (~24-28pt) -- prioritize readability over density, ~3-4 ayahs visible at once
- Home screen is a surah list -- tap surah to open reader, search bar at top to filter by name/number
- Surah + Juz tabs -- tabbed navigation to browse by surah list (114 surahs) or juz list (30 juz)
- Ayah range selection via tap-on-text -- user taps first ayah (start), then taps last ayah (end), selected range highlights with visible "Start Practice" button
- Single auto-saved last-read position -- app remembers where user was reading, resumes automatically on reopen. No manual bookmark management.
- Deep teal and gold color palette -- primary #0D7377 (teal), accent #C9A84C (gold), background #FAF8F2 (warm cream), text #1A1A2E (near black), surface #FFFFFF
- Gold for ornamental elements, teal for interactive elements
- Subtle Islamic geometric/ornamental accents -- used in surah header frames, screen borders, ayah markers, onboarding illustrations. NOT on buttons, nav elements, or cards
- Large readable Arabic font using KFGQPC Uthmani Hafs
- 3-screen swipeable onboarding walkthrough with specific content defined in UI-SPEC
- Bilingual text (Arabic + English) -- default language based on user locale
- Microphone permission deferred -- NOT asked during onboarding

### Claude's Discretion
- Text alignment (centered vs right-aligned vs justified)
- Exact spacing between ayahs and around surah headers
- Loading skeleton design
- Surah list card design details
- Error state handling
- Exact onboarding illustration style
- Bottom tab bar vs no tab bar (navigation structure)
- Search UX details (debounce, result highlighting)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QTEXT-01 | User can view the full Quran in Uthmani script with proper Arabic diacritics rendering | KFGQPC Uthmani Hafs font via expo-font, RTL text rendering with `writingDirection: 'rtl'`, expo-sqlite bundled database with word-level Uthmani text from Quran Foundation API, FlashList for virtualized ayah rendering |
| QTEXT-02 | User can navigate by surah, ayah, and juz | Expo Router v7 file-based routing with tabs layout, FlashList for surah/juz lists, search filtering with debounce, juz boundary metadata in SQLite database |
| QTEXT-03 | User can select a specific ayah range within a surah for recitation practice | Tap-to-select interaction on AyahText components, Zustand store for selection state, RangeSelectionBar component with "Start Practice" stub |
| QTEXT-04 | User can bookmark their position and resume from where they left off | MMKV persistent storage for last-read position (surah + ayah + scroll offset), auto-save on scroll, auto-restore on app reopen |
| UI-01 | App has a polished, reverent design appropriate for Quranic context | NativeWind 4.x with custom color palette (teal/gold/cream), KFGQPC font for Arabic, ornamental surah headers and ayah markers, UI-SPEC design contract defines all visual details |
| UI-04 | App provides clear onboarding for first-time users | 3-screen swipeable onboarding with Reanimated spring animations, bilingual content (Arabic + English), MMKV flag to track onboarding completion, locale-aware language default |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | 55.0.8 | Managed Expo SDK | Current stable. React Native 0.83.2, React 19.2. New Architecture mandatory. |
| expo-router | 55.0.7 | File-based navigation | Ships with SDK 55. Tabs, stacks, typed routes, deep linking built in. |
| nativewind | 4.2.3 | Tailwind CSS for React Native | Stable release. Use with Tailwind CSS 3.x (NOT Tailwind 4.x). |
| tailwindcss | 3.4.19 | CSS utility framework | Latest 3.x release. Required by NativeWind 4.x. Do NOT use 4.x. |
| @shopify/flash-list | 2.3.0 | Performant virtualized lists | FlashList v2, ground-up rewrite for New Architecture. 5x faster than FlatList. |
| expo-sqlite | 55.0.11 | Local SQLite database | First-party Expo module. Supports bundled pre-populated databases via `assetSource`. |
| expo-font | 55.0.4 | Custom font loading | Load KFGQPC Uthmani Hafs TTF. Ships with SDK 55. |
| zustand | 5.0.12 | Client state management | Standard React Native state library. Hook-based, minimal boilerplate. |
| react-native-mmkv | 4.3.0 | Fast persistent key-value storage | 30x faster than AsyncStorage. Synchronous reads. Zustand persist adapter. |
| react-native-reanimated | 4.2.3 | Animations | Word highlighting, onboarding swipe, shimmer. Ships with SDK 55. |
| @expo/vector-icons | 15.1.1 | Icon library | Ships with Expo. MaterialCommunityIcons and Ionicons sets for tab bar and UI. |
| typescript | 5.x | Type safety | Non-negotiable for complex project. Expo Router provides typed routes. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand-mmkv-storage | 1.0.0 | MMKV adapter for Zustand persist middleware | Connect Zustand persist to MMKV storage backend |
| expo-haptics | 55.0.9 | Haptic feedback | Phase 1: not used yet. Install now for future phases. |
| expo-dev-client | SDK 55 | Development client (not Expo Go) | Required from day one -- MMKV and expo-sqlite need native modules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-sqlite | WatermelonDB | WatermelonDB adds reactive queries and sync, but adds complexity, requires Expo config plugin (@morrowdigital/watermelondb-expo-plugin), and is overkill for read-only Quran text. Use WatermelonDB only if progress data needs reactive queries in later phases. |
| expo-sqlite (raw SQL) | expo-sqlite + Drizzle ORM | Drizzle adds type-safe queries and migrations. However, the Quran database is read-only and pre-populated -- raw SQL is simpler and sufficient. Drizzle is worth considering for progress data in later phases. |
| FlashList | FlatList | FlatList is built-in but 5x slower for large lists. FlashList v2 is rewritten for New Architecture. Use FlashList. |
| NativeWind | StyleSheet.create | Raw styles work but lack the utility-class developer experience. NativeWind with Tailwind 3.x is the standard approach for Expo apps. |

**Installation:**
```bash
# Create Expo SDK 55 project
npx create-expo-app@latest tasmi --template default@sdk-55

# Core dependencies (use npx expo install for SDK-matched versions)
npx expo install expo-router expo-font expo-haptics expo-sqlite react-native-reanimated @shopify/flash-list

# Styling
npx expo install nativewind
npm install -D tailwindcss@3.4.19

# State and storage (native modules -- requires dev client)
npm install zustand react-native-mmkv zustand-mmkv-storage

# Dev dependencies
npx expo install expo-dev-client
npm install -D typescript @types/react
```

**Version verification:** All versions above verified against npm registry on 2026-03-21. `npx expo install` will resolve SDK 55-compatible versions automatically for Expo packages.

**Critical:** Use `expo-dev-client` from day one. react-native-mmkv requires native modules that Expo Go cannot run.

## Architecture Patterns

### Recommended Project Structure
```
app/                           # Expo Router screens (file-based routing)
  _layout.tsx                  # Root layout (navigation container)
  (tabs)/                      # Tab navigation group
    _layout.tsx                # Tab bar configuration
    index.tsx                  # Home: surah list
    settings.tsx               # Settings screen (placeholder)
  surah/
    [id].tsx                   # Quran reader for specific surah
  onboarding.tsx               # Onboarding flow (3-screen swipeable)
assets/
  fonts/
    KFGQPCUthmanicScriptHAFS.ttf  # Bundled Arabic font
  db/
    quran.db                   # Pre-populated SQLite database
  images/                      # Onboarding illustrations, ornamental assets
src/
  components/
    quran/
      AyahText.tsx             # Single ayah renderer with tap selection
      AyahEndMarker.tsx        # Ornamental end-of-ayah marker
      SurahHeaderBanner.tsx    # Ornamental surah header
      Bismillah.tsx            # Decorative Bismillah display
      QuranReader.tsx          # Full-screen scrollable Quran text view
      RangeSelectionBar.tsx    # Bottom bar for ayah range selection
    home/
      SurahListItem.tsx        # Surah card in home list
      JuzListItem.tsx          # Juz card in home list
      SearchBar.tsx            # Search/filter input
      TabBar.tsx               # Surah/Juz segmented control
      ResumeReadingFAB.tsx     # Floating action button for last-read
    onboarding/
      OnboardingScreen.tsx     # Single onboarding slide
      OnboardingDots.tsx       # Page indicator dots
    ui/
      LoadingSkeleton.tsx      # Shimmer loading placeholder
      ErrorState.tsx           # Full-screen error with retry
  data/
    database.ts                # SQLite database initialization and connection
    quranRepository.ts         # Data access: surahs, ayahs, words, juz
    types.ts                   # TypeScript types for Quran data models
    seed/
      buildQuranDb.ts          # Build-time script to generate quran.db from API
  stores/
    settingsStore.ts           # User preferences (persisted via MMKV)
    readingStore.ts            # Last-read position, onboarding status (MMKV)
    selectionStore.ts          # Ayah range selection state (ephemeral)
  hooks/
    useQuranText.ts            # Hook: fetch ayahs for a surah from SQLite
    useSurahList.ts            # Hook: fetch surah metadata list
    useJuzList.ts              # Hook: fetch juz metadata list
    useSearch.ts               # Hook: debounced surah search/filter
    useLastRead.ts             # Hook: read/write last-read position
  constants/
    theme.ts                   # Color palette, spacing tokens from UI-SPEC
    quran.ts                   # Surah names, juz boundaries, static metadata
  utils/
    arabic.ts                  # Arabic text utilities (normalization, locale)
    locale.ts                  # Language detection and bilingual support
```

### Pattern 1: Bundled SQLite Database with expo-sqlite
**What:** Pre-populate a SQLite database at build time using Quran Foundation API data, bundle it as an app asset, and open it at runtime using `openDatabaseAsync` with `assetSource`.
**When to use:** For the Quran text corpus -- static, read-only data that never changes after bundling.
**Example:**
```typescript
// src/data/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('quran.db', {
      assetSource: { assetId: require('../../assets/db/quran.db') },
    });
  }
  return db;
}
```
Source: [expo-sqlite docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)

### Pattern 2: Zustand + MMKV Persistent State
**What:** Use Zustand stores with `persist` middleware backed by react-native-mmkv for fast, synchronous, persistent state that survives app restarts.
**When to use:** For user preferences, last-read position, onboarding completion flag.
**Example:**
```typescript
// src/stores/readingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from 'zustand-mmkv-storage';

const mmkvStorage = createMMKVStorage({ id: 'reading-store' });

interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadScrollOffset: number;
  hasCompletedOnboarding: boolean;
  setLastRead: (surah: number, ayah: number, offset: number) => void;
  completeOnboarding: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadScrollOffset: 0,
      hasCompletedOnboarding: false,
      setLastRead: (surah, ayah, offset) =>
        set({ lastReadSurah: surah, lastReadAyah: ayah, lastReadScrollOffset: offset }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'reading-store',
      storage: mmkvStorage,
    }
  )
);
```
Source: [zustand-mmkv-storage docs](https://github.com/1mehdifaraji/zustand-mmkv-storage), [react-native-mmkv Zustand wrapper docs](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md)

### Pattern 3: Expo Router Tab Layout with Groups
**What:** File-based routing using Expo Router v7 with a `(tabs)` group for the bottom tab navigator.
**When to use:** For the main app navigation structure (Home + Settings tabs).
**Example:**
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D7377',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E2DA',
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```
Source: [Expo Router tabs docs](https://docs.expo.dev/router/advanced/tabs/)

### Pattern 4: FlashList for Surah/Ayah Lists
**What:** Use FlashList v2 for rendering the 114-surah list and long ayah lists with virtualization.
**When to use:** All scrollable lists -- surah list, juz list, ayah rendering in QuranReader.
**Note on RTL:** FlashList has a known RTL issue on Android (issue #544). Test Arabic list rendering on Android early. If issues arise, set `inverted={false}` explicitly and use `writingDirection: 'rtl'` on text components only (not the list container).

### Pattern 5: Custom Font Loading for Arabic
**What:** Bundle KFGQPC Uthmani Hafs TTF and load via expo-font config plugin or `useFonts` hook.
**When to use:** All Quran text rendering.
**Example:**
```typescript
// In app/_layout.tsx
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'KFGQPC-Uthmani': require('../assets/fonts/KFGQPCUthmanicScriptHAFS.ttf'),
  });

  if (!fontsLoaded) return null; // Or splash screen

  return <Stack />;
}
```
Source: [expo-font docs](https://docs.expo.dev/develop/user-interface/fonts/)

### Anti-Patterns to Avoid
- **Using Expo Go for development:** MMKV and expo-sqlite require native modules. Use expo-dev-client from day one.
- **Using I18nManager.forceRTL(true) globally:** This flips the entire app layout to RTL. The app should remain LTR for English UI chrome. Only set `writingDirection: 'rtl'` on Arabic text containers.
- **Using `textAlign: 'justify'` for Arabic text:** React Native has known issues with justified Arabic text (issue #32146 -- text overflow with special characters). Use `textAlign: 'right'` as specified in the UI-SPEC.
- **Loading all Quran text into memory at once:** Use FlashList virtualization. Only render visible ayahs plus a small buffer. Query SQLite per-surah, not for the entire Quran.
- **Using FlatList instead of FlashList:** FlatList is significantly slower for the 114-surah list and long surah ayah lists.
- **Using Tailwind CSS 4.x with NativeWind:** NativeWind 4.x requires Tailwind CSS 3.x. Tailwind 4.x is incompatible.
- **Using NativeWind v5:** Still in preview. Use v4.2.3 (stable).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQLite database access | Custom file system DB management | expo-sqlite with `assetSource` | Handles bundled asset loading, database copying, versioning. Cross-platform. |
| Persistent state | Custom AsyncStorage wrapper | Zustand + react-native-mmkv + zustand-mmkv-storage | 30x faster than AsyncStorage, synchronous, encryption support, persist middleware integration |
| Virtualized list rendering | Custom scroll view with manual recycling | @shopify/flash-list | Cell recycling, memory management, New Architecture optimized |
| Custom font loading | Manual native font linking | expo-font config plugin or useFonts hook | Handles TTF/OTF loading, platform differences, splash screen timing |
| File-based routing | Manual React Navigation configuration | expo-router v7 | File system = routes. Typed routes, deep linking, layouts built in |
| Tab navigation | Custom bottom bar component | Expo Router Tabs component | Native bottom tabs on iOS/Android, handles safe area, integrates with routing |
| Shimmer/skeleton loading | Custom animated gradient | react-native-reanimated with linear interpolation | 60fps hardware-accelerated, respects reduced motion preference |

**Key insight:** Phase 1 is a greenfield project using entirely standard Expo SDK 55 patterns. Every piece of functionality has a well-documented, first-party or ecosystem-standard solution. The risk is not in choosing technology -- it is in Arabic text rendering on real devices.

## Common Pitfalls

### Pitfall 1: Arabic Text with Full Diacritics Renders Incorrectly on Real Devices
**What goes wrong:** Quranic Uthmani text with full tashkeel (harakat) displays incorrectly -- diacritics misalign, characters overlap, text clips, or ligatures break. React Native issue #55220 (Jan 2026) reports RTL Arabic text clipping for specific phrases.
**Why it happens:** Arabic text shaping is complex (RTL, contextual letter forms, stacking diacritics). Cross-platform renderers have inconsistent support. The KFGQPC font may render differently across device OEMs. Quranic text is the most demanding Arabic rendering scenario because nearly every letter has a tashkeel mark.
**How to avoid:**
1. Test on real physical devices from the FIRST task that renders Arabic text. Do not rely solely on simulators.
2. Set `writingDirection: 'rtl'` explicitly on all Arabic text containers. Do not rely on auto-detection.
3. Use `textAlign: 'right'` -- never `'justify'` for Arabic text.
4. Use the Display size (28px) with 2.2 line height as specified in UI-SPEC to prevent diacritic collision between lines.
5. Test on at minimum: 1 iOS device, 1 Samsung Android, 1 Pixel/stock Android.
6. If rendering fails on a device class, pre-rendered page images are the emergency fallback.
**Warning signs:** Diacritics shifted from base letters, long ayahs overflowing containers, text clipped at line edges.

### Pitfall 2: Expo Go Cannot Run Native Modules
**What goes wrong:** Developer tries to use Expo Go and hits immediate errors from react-native-mmkv or expo-sqlite asset loading.
**Why it happens:** MMKV uses JSI/native modules. expo-sqlite's `assetSource` bundled database feature requires a custom dev client.
**How to avoid:** Set up `expo-dev-client` in the very first task. Never attempt to use Expo Go for this project.
**Warning signs:** "Native module not found" errors, app crashing on launch in Expo Go.

### Pitfall 3: FlashList RTL Rendering Issues on Android
**What goes wrong:** FlashList renders list items abnormally when app layout is RTL, or when list items contain RTL text.
**Why it happens:** FlashList v1 had a known RTL bug (#544). FlashList v2 rewrites the internals but RTL behavior should still be verified.
**How to avoid:** Keep the app layout direction LTR (English chrome). Only apply RTL to text components within list items. Test surah list and ayah list rendering on Android early.
**Warning signs:** List items appearing in wrong order, items jumping on scroll, layout measuring issues.

### Pitfall 4: NativeWind + Tailwind Version Mismatch
**What goes wrong:** Installing Tailwind CSS 4.x (the latest major version) causes NativeWind to fail silently or produce no styles.
**Why it happens:** NativeWind 4.x is built for Tailwind CSS 3.x. Tailwind 4.x uses a completely different architecture (CSS-first instead of JS config).
**How to avoid:** Pin `tailwindcss@3.4.19` explicitly. Verify with `npx tailwindcss --help` that it shows v3.x.
**Warning signs:** NativeWind classes producing no visual effect, missing styles, build warnings about config format.

### Pitfall 5: Quran Data Integrity
**What goes wrong:** Bundled Quran text has encoding errors, missing diacritics, wrong ayah numbers, or text that does not match an authoritative Mushaf.
**Why it happens:** Data sourcing from APIs can introduce encoding issues. UTF-8 normalization (NFC vs NFD) affects Arabic text comparison. Copy-paste or export pipelines may strip diacritics.
**How to avoid:** Source text from Quran Foundation API v4 (`text_uthmani` word field). Verify against a known reference (e.g., Tanzil.net Uthmani text). Run automated checks: 6,236 total ayahs, correct ayah counts per surah, no empty text fields, all diacritics present. Any error in Quran text is unacceptable -- this must be verified before shipping.
**Warning signs:** Missing Bismillah, wrong ayah numbering, text looking "plain" (missing harakat).

### Pitfall 6: SQLite Bundled Database Not Loading on Android
**What goes wrong:** The pre-populated quran.db loads fine on iOS but fails silently or throws errors on Android in production builds.
**Why it happens:** expo-sqlite's `assetSource` copies the database from assets on first launch. Android asset handling differs from iOS. EAS Build may not include the asset correctly.
**How to avoid:** Test with EAS Build (not just dev client) on both platforms. Verify the database exists after first launch. Add error handling around database initialization with a clear error state UI.
**Warning signs:** Empty surah list on Android production build, "database not found" errors, app crashing on first launch.

## Code Examples

Verified patterns from official sources:

### Opening a Bundled SQLite Database
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sqlite/
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('quran.db', {
  assetSource: {
    assetId: require('../../assets/db/quran.db'),
    forceOverwrite: false, // Only copy on first install
  },
});

// Query example: get all ayahs for a surah
const ayahs = await db.getAllAsync<{
  ayah_number: number;
  text_uthmani: string;
  juz_number: number;
}>(
  'SELECT ayah_number, text_uthmani, juz_number FROM ayahs WHERE surah_number = ? ORDER BY ayah_number',
  [surahNumber]
);
```

### RTL Arabic Text Component with NativeWind
```typescript
// Source: UI-SPEC design contract + React Native RTL docs
import { Text, View } from 'react-native';

interface AyahTextProps {
  text: string;
  ayahNumber: number;
  isSelected: boolean;
}

export function AyahText({ text, ayahNumber, isSelected }: AyahTextProps) {
  return (
    <View
      className={`px-8 py-1.5 ${isSelected ? 'bg-teal-500/12 border-l-2 border-teal-600' : ''}`}
      style={{ writingDirection: 'rtl' }}
    >
      <Text
        className="text-[28px] font-bold leading-[61.6px] text-right"
        style={{
          fontFamily: 'KFGQPC-Uthmani',
          writingDirection: 'rtl',
          lineHeight: 61.6, // 28px * 2.2 line height from UI-SPEC
        }}
      >
        {text} {'\u06DD'}{toArabicIndic(ayahNumber)}
      </Text>
    </View>
  );
}

function toArabicIndic(num: number): string {
  return num.toString().replace(/\d/g, (d) => String.fromCharCode(0x0660 + parseInt(d)));
}
```

### MMKV Last-Read Position Auto-Save
```typescript
// Source: react-native-mmkv docs + zustand persist pattern
// Called on scroll events in QuranReader (debounced)
import { useReadingStore } from '../stores/readingStore';

function handleScroll(surahNumber: number, visibleAyah: number, scrollOffset: number) {
  // Debounce this call to avoid excessive writes
  useReadingStore.getState().setLastRead(surahNumber, visibleAyah, scrollOffset);
}
```

### Surah Search with Debounce
```typescript
// src/hooks/useSearch.ts
import { useState, useMemo } from 'react';

interface Surah {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  ayahCount: number;
  revelationType: 'Makki' | 'Madani';
}

export function useSearch(surahs: Surah[], debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce effect (use setTimeout pattern or useDeferredValue)
  // Filter locally -- no network request needed
  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return surahs;
    const q = debouncedQuery.toLowerCase();
    return surahs.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameArabic.includes(q) ||
        s.number.toString() === q
    );
  }, [surahs, debouncedQuery]);

  return { query, setQuery, filtered };
}
```

## Quran Database Schema

The bundled SQLite database should have the following schema to support all Phase 1 requirements:

```sql
-- Surah metadata
CREATE TABLE surahs (
  number INTEGER PRIMARY KEY,
  name_arabic TEXT NOT NULL,      -- e.g., 'الفاتحة'
  name_english TEXT NOT NULL,     -- e.g., 'Al-Fatiha'
  ayah_count INTEGER NOT NULL,
  revelation_type TEXT NOT NULL,  -- 'Makki' or 'Madani'
  revelation_order INTEGER NOT NULL,
  juz_start INTEGER NOT NULL      -- Starting juz number
);

-- Ayah text (word-level not needed for display; ayah-level is sufficient)
CREATE TABLE ayahs (
  id INTEGER PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  text_uthmani TEXT NOT NULL,     -- Full Uthmani text with diacritics
  juz_number INTEGER NOT NULL,
  hizb_number INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  FOREIGN KEY (surah_number) REFERENCES surahs(number)
);

-- Juz metadata
CREATE TABLE juz (
  number INTEGER PRIMARY KEY,
  start_surah INTEGER NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_surah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL,
  FOREIGN KEY (start_surah) REFERENCES surahs(number),
  FOREIGN KEY (end_surah) REFERENCES surahs(number)
);

-- Indexes for fast queries
CREATE INDEX idx_ayahs_surah ON ayahs(surah_number);
CREATE INDEX idx_ayahs_juz ON ayahs(juz_number);
CREATE INDEX idx_ayahs_surah_ayah ON ayahs(surah_number, ayah_number);
```

**Word-level data:** The schema above stores ayah-level text for Phase 1 display. Word-level data (individual words with position indices) will be needed in Phase 3 for word-by-word highlighting during recitation. The database can be extended with a `words` table later, or word-level data can be derived by splitting ayah text on whitespace.

**Data source:** Quran Foundation API v4 (`/verses/by_chapter/{chapter_number}?words=true&word_fields=text_uthmani`) provides the authoritative Uthmani text. A build-time script should fetch all 114 surahs and populate the SQLite database.

**Database size estimate:** The full Quran text with metadata is approximately 5-8 MB as a SQLite file. This is small enough to bundle directly in the app binary.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expo Go for all development | expo-dev-client required | SDK 55 (Feb 2026) | Native modules (MMKV, SQLite assets) need dev client from day one |
| Old Architecture optional | New Architecture mandatory | SDK 55 (Feb 2026) | All libraries must support New Architecture. FlashList v2, MMKV v4, Reanimated v4 all updated. |
| NativeWind v2 with StyleSheet | NativeWind v4.x with Tailwind 3.x | Late 2024 | True CSS-like styling with CSS variables, dark mode, container queries |
| AsyncStorage for persistence | react-native-mmkv | 2023+ | 30x performance improvement, synchronous reads, encryption |
| FlatList for lists | FlashList v2 | 2025 | Ground-up rewrite for New Architecture, no `estimatedItemSize` required |
| expo-sqlite legacy API | expo-sqlite modern async API with assetSource | SDK 52+ | Bundled database support, async/await API, SQLiteProvider component |

**Deprecated/outdated:**
- **AsyncStorage:** Use MMKV instead. AsyncStorage is async-only, 30x slower, no encryption.
- **Expo Go:** Cannot run this project. Use expo-dev-client.
- **NativeWind v2/v3:** Use v4.2.3. Earlier versions lack CSS variables and have different API.
- **FlatList for large lists:** Use FlashList v2. FlatList causes jank with 100+ items.
- **React Navigation manual setup:** Use Expo Router v7. File-based routing is the standard.

## Open Questions

1. **KFGQPC Font Weight Behavior**
   - What we know: The UI-SPEC specifies weight 700 (bold) for Quran body text. The KFGQPC font may only include a single weight face.
   - What's unclear: Whether React Native will render the font correctly when declaring `fontWeight: 'bold'` on a single-weight font, or if it will attempt system bold synthesis (which looks wrong for Arabic).
   - Recommendation: Test the font at weight 400 and 700 early. If the font file only has one weight, use that weight and do not declare bold. Adjust UI-SPEC accordingly.

2. **FlashList v2 RTL Stability**
   - What we know: FlashList v1 had documented RTL bugs. V2 is a complete rewrite.
   - What's unclear: Whether FlashList v2 has fully resolved RTL layout issues on Android.
   - Recommendation: Test FlashList with Arabic text content on Android in the first task that renders lists. Have FlatList as fallback if critical issues are found.

3. **Build-Time Database Generation Script**
   - What we know: Quran Foundation API v4 has the data. A Node.js script can fetch and build the SQLite file.
   - What's unclear: API rate limits, whether all word_fields are available for all surahs, exact response format for edge cases.
   - Recommendation: Write the build script as an early task. Test it end-to-end before relying on the bundled database.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ships with Expo SDK 55 via jest-expo) |
| Config file | none -- Wave 0 |
| Quick run command | `npx jest --passWithNoTests` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QTEXT-01 | Quran text loads from SQLite and renders with correct ayah count | integration | `npx jest tests/data/quranRepository.test.ts -x` | Wave 0 |
| QTEXT-01 | Arabic font loads successfully | smoke | Manual: verify font renders on device | Manual-only (font rendering requires device) |
| QTEXT-02 | Surah list shows all 114 surahs | unit | `npx jest tests/hooks/useSurahList.test.ts -x` | Wave 0 |
| QTEXT-02 | Juz list shows all 30 juz | unit | `npx jest tests/hooks/useJuzList.test.ts -x` | Wave 0 |
| QTEXT-02 | Search filters surahs by name and number | unit | `npx jest tests/hooks/useSearch.test.ts -x` | Wave 0 |
| QTEXT-03 | Tap-to-select sets start and end ayah in selection store | unit | `npx jest tests/stores/selectionStore.test.ts -x` | Wave 0 |
| QTEXT-04 | Last-read position persists and restores | unit | `npx jest tests/stores/readingStore.test.ts -x` | Wave 0 |
| UI-01 | Color palette tokens match UI-SPEC values | unit | `npx jest tests/constants/theme.test.ts -x` | Wave 0 |
| UI-04 | Onboarding completion flag persists | unit | `npx jest tests/stores/readingStore.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.js` -- Jest configuration with jest-expo preset, TypeScript transform
- [ ] `tests/data/quranRepository.test.ts` -- Tests for SQLite data access (surah count, ayah count, data integrity)
- [ ] `tests/hooks/useSurahList.test.ts` -- Tests for surah list hook
- [ ] `tests/hooks/useJuzList.test.ts` -- Tests for juz list hook
- [ ] `tests/hooks/useSearch.test.ts` -- Tests for search filtering logic
- [ ] `tests/stores/selectionStore.test.ts` -- Tests for ayah range selection state
- [ ] `tests/stores/readingStore.test.ts` -- Tests for last-read position and onboarding flag persistence
- [ ] `tests/constants/theme.test.ts` -- Tests that theme tokens match UI-SPEC values
- [ ] `tests/utils/arabic.test.ts` -- Tests for Arabic-Indic numeral conversion, text utilities
- [ ] Framework install: `npm install -D jest jest-expo @types/jest ts-jest` -- if not included by create-expo-app

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK version, React Native 0.83, New Architecture mandatory
- [expo-sqlite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- Bundled database via assetSource, async API
- [Expo Router Tabs Documentation](https://docs.expo.dev/router/advanced/tabs/) -- Tab layout, file-based routing
- [expo-font Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- Custom font loading with useFonts
- [Quran Foundation API v4 Documentation](https://api-docs.quran.foundation/) -- Word-level Uthmani text, verse endpoints
- [NativeWind v4 Documentation](https://www.nativewind.dev/) -- Tailwind CSS for React Native
- [FlashList v2 Engineering Blog](https://shopify.engineering/flashlist-v2) -- Ground-up rewrite for New Architecture
- [react-native-mmkv GitHub](https://github.com/mrousavy/react-native-mmkv) -- Zustand persist wrapper documentation
- [zustand-mmkv-storage GitHub](https://github.com/1mehdifaraji/zustand-mmkv-storage) -- MMKV adapter for Zustand
- [React Native I18nManager Docs](https://reactnative.dev/docs/i18nmanager) -- RTL layout management
- npm registry version checks (2026-03-21) -- All package versions verified

### Secondary (MEDIUM confidence)
- [React Native Arabic Text Clipping Issue #55220](https://github.com/facebook/react-native/issues/55220) -- RTL clipping bug, Jan 2026
- [React Native Arabic Justify Issue #32146](https://github.com/facebook/react-native/issues/32146) -- Text overflow with justify alignment
- [FlashList RTL Bug #544](https://github.com/Shopify/flash-list/issues/544) -- Android RTL rendering
- [KFGQPC Font on GitHub](https://github.com/thetruetruth/quran-data-kfgqpc) -- Font file and Quran text data
- [Quranic Universal Library - Font Resources](https://qul.tarteel.ai/resources/font/245) -- QPC Hafs font
- [Quran-db GitHub (EslamEssamM)](https://github.com/EslamEssamM/Quran-db) -- Word-level SQLite database toolkit
- [Expo Blog: Modern SQLite for React Native](https://expo.dev/blog/modern-sqlite-for-react-native-apps) -- expo-sqlite + Drizzle patterns
- [Architecting RTL in React Native (Feb 2026)](https://medium.com/@ancybhairavi/architecting-rtl-in-react-native-what-breaks-and-what-works-8d96c8cba62b) -- RTL challenges and solutions

### Tertiary (LOW confidence)
- [EAS CLI Bundled Database Issue #1335](https://github.com/expo/eas-cli/issues/1335) -- iOS/Android bundled database discrepancy. Needs validation on current SDK 55.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries are current stable releases, first-party Expo or widely-adopted ecosystem packages. Versions verified against npm registry.
- Architecture: HIGH -- Standard Expo Router file-based routing, expo-sqlite for bundled data, Zustand + MMKV for state. All well-documented patterns.
- Arabic text rendering: MEDIUM -- Known React Native issues with RTL Arabic text (clipping, diacritics). KFGQPC font rendering needs real-device validation. Mitigation strategies are documented.
- Pitfalls: HIGH -- Sourced from React Native GitHub issues (2025-2026), FlashList issue tracker, Expo documentation, and prior project research.

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain -- Expo SDK, font rendering, SQLite patterns change slowly)
