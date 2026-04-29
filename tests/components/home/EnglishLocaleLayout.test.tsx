jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { BrandBar } from '../../../src/components/home/BrandBar';
import { GreetingCard } from '../../../src/components/home/GreetingCard';
import { JuzListItem } from '../../../src/components/home/JuzListItem';
import { SearchBar } from '../../../src/components/home/SearchBar';
import { SurahListItem } from '../../../src/components/home/SurahListItem';
import { TabBar } from '../../../src/components/navigation/TabBar';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import type { Juz, Surah } from '../../../src/data/types';

const alFatiha: Surah = {
  number: 1,
  nameArabic: 'الفاتحة',
  nameEnglish: 'Al-Fatihah',
  ayahCount: 7,
  revelationType: 'Makki',
  revelationOrder: 5,
  juzStart: 1,
};

const juzOne: Juz = {
  number: 1,
  startSurah: 1,
  startAyah: 1,
  endSurah: 2,
  endAyah: 141,
};

describe('Home English locale layout', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'en' });
  });

  it('keeps the brand wordmark and search field in LTR text flow', () => {
    const { getByPlaceholderText, getByText } = render(
      <>
        <BrandBar avatarInitial="A" />
        <SearchBar value="" onChangeText={jest.fn()} />
      </>
    );

    const titleStyle = StyleSheet.flatten(getByText('Al Furqan').props.style);
    expect(titleStyle).toMatchObject({
      fontFamily: 'Manrope',
      textAlign: 'left',
      writingDirection: 'ltr',
    });

    const inputStyle = StyleSheet.flatten(getByPlaceholderText('Search surahs...').props.style);
    expect(inputStyle).toMatchObject({
      fontFamily: 'Manrope',
      textAlign: 'left',
      writingDirection: 'ltr',
    });
  });

  it('uses English greeting copy without duplicating the continue label', () => {
    const { getByText, queryByText } = render(
      <GreetingCard
        variant="continue"
        surahName="Al-Baqarah"
        ayahNumber={255}
        juzNumber={3}
        pageNumber={42}
        lastReadAt={Date.now()}
        streakDays={27}
        streakAtRisk={false}
        onResume={jest.fn()}
      />
    );

    expect(getByText('Continue')).toBeTruthy();
    expect(queryByText('Continue · Continue')).toBeNull();
    expect(getByText('Surah Al-Baqarah · Ayah 255')).toBeTruthy();
    expect(queryByText(/سورة/)).toBeNull();
  });

  it('does not show a zero-day streak on migrated continue cards', () => {
    const { queryByText } = render(
      <GreetingCard
        variant="continue"
        surahName="Al-Baqarah"
        ayahNumber={255}
        juzNumber={3}
        pageNumber={42}
        lastReadAt={Date.now()}
        streakDays={0}
        streakAtRisk={false}
        onResume={jest.fn()}
      />
    );

    expect(queryByText('day streak')).toBeNull();
  });

  it('surfaces streak risk instead of a numeric streak', () => {
    const { getByText, queryByText } = render(
      <GreetingCard
        variant="continue"
        surahName="Al-Baqarah"
        ayahNumber={255}
        juzNumber={3}
        pageNumber={42}
        lastReadAt={Date.now()}
        streakDays={2}
        streakAtRisk
        onResume={jest.fn()}
      />
    );

    expect(getByText('Read today to keep your streak')).toBeTruthy();
    expect(queryByText('day streak')).toBeNull();
  });

  it('shows cold-start copy without progress metadata', () => {
    const { getByText, queryByText } = render(
      <GreetingCard variant="cold-start" onStart={jest.fn()} />
    );

    expect(getByText('Begin with Al-Fatihah')).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
    expect(queryByText(/Juz/)).toBeNull();
    expect(queryByText(/day streak/)).toBeNull();
  });

  it('puts surah row content in English-first LTR visual order', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <SurahListItem
        surah={alFatiha}
        onSelect={jest.fn()}
        onOpen={jest.fn()}
      />
    );

    const rowStyle = StyleSheet.flatten(getByLabelText('Al-Fatihah').props.style);
    expect(rowStyle).toMatchObject({
      flexDirection: 'row',
    });

    expect(getByText('Al-Fatihah')).toBeTruthy();
    expect(queryByText('الفاتحة')).toBeNull();

    const metaStyle = StyleSheet.flatten(
      getByText('The Opening · Meccan').props.style
    );
    expect(metaStyle).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
    });
  });

  it('keeps the bottom tab bar in English visual order', () => {
    const routes = [
      { key: 'index-key', name: 'index' },
      { key: 'surahs-key', name: 'surahs' },
      { key: 'review-key', name: 'review' },
      { key: 'settings-key', name: 'settings' },
    ];
    const { getByTestId } = render(
      <TabBar
        state={{ index: 0, routes } as never}
        navigation={{
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never}
        descriptors={{} as never}
        insets={{} as never}
      />
    );

    expect(StyleSheet.flatten(getByTestId('bottom-tab-bar').props.style)).toMatchObject({
      flexDirection: 'row',
    });
  });

  it('uses English copy for juz rows in English locale', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <JuzListItem
        juz={juzOne}
        surahNames={new Map([[1, 'Al-Fatihah']])}
        onSelect={jest.fn()}
        onOpen={jest.fn()}
      />
    );

    expect(getByLabelText('Juz 1')).toBeTruthy();
    expect(getByText('Juz 1')).toBeTruthy();
    expect(getByText('Starts at Surah Al-Fatihah, Ayah 1')).toBeTruthy();
    expect(queryByText('الجزء')).toBeNull();
  });
});

describe('Home Arabic locale layout', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'ar' });
  });

  it('does not leak English-only greeting copy into Arabic', () => {
    const { getByText, queryByText } = render(
      <GreetingCard
        variant="continue"
        surahName="البقرة"
        ayahNumber={255}
        juzNumber={3}
        pageNumber={42}
        lastReadAt={Date.now()}
        streakDays={27}
        streakAtRisk={false}
        onResume={jest.fn()}
      />
    );

    expect(getByText('الجزء ٣ · صفحة ٤٢')).toBeTruthy();
    expect(getByText('سلسلة ٢٧ يوم')).toBeTruthy();
    expect(queryByText('day streak')).toBeNull();
    expect(queryByText(/Juz/)).toBeNull();

    expect(StyleSheet.flatten(getByText('سورة البقرة ‏· الآية ‏﴿٢٥٥﴾').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
  });

  it('uses readable UI typography for Arabic greeting card metadata', () => {
    const { getByTestId, getByText, queryByText } = render(
      <GreetingCard
        variant="continue"
        surahName="آل عمران"
        ayahNumber={3}
        juzNumber={3}
        pageNumber={51}
        lastReadAt={Date.now()}
        streakDays={1}
        streakAtRisk={false}
        onResume={jest.fn()}
      />
    );

    const title = getByText('سورة آل عمران ‏· الآية ‏﴿٣﴾');
    expect(queryByText('سورة آل عمران ‏· الآية ‏٣')).toBeNull();
    expect(StyleSheet.flatten(getByText('تابع').props.style)).toMatchObject({
      fontFamily: 'ReemKufi-Medium',
      fontSize: 22,
    });
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({
      fontFamily: 'ReemKufi-Medium',
      fontSize: 32,
    });
    expect(StyleSheet.flatten(getByTestId('greeting-title-glyph').props.style)).toMatchObject({
      fontFamily: 'KFGQPC-Uthmani',
      fontSize: 30,
    });
    expect(StyleSheet.flatten(getByText('الجزء ٣ · صفحة ٥١').props.style)).toMatchObject({
      fontFamily: 'ReemKufi',
      fontSize: 24,
    });
    expect(StyleSheet.flatten(getByText('آخر قراءة الآن').props.style)).toMatchObject({
      fontFamily: 'ReemKufi',
      fontSize: 20,
    });
    expect(StyleSheet.flatten(getByText('استأنف').props.style)).toMatchObject({
      fontFamily: 'ReemKufi-Medium',
      fontSize: 23,
    });
    expect(StyleSheet.flatten(getByText('سلسلة ١ يوم').props.style)).toMatchObject({
      fontFamily: 'ReemKufi',
      fontSize: 22,
    });
    expect(StyleSheet.flatten(getByTestId('greeting-juz-glyph').props.style)).toMatchObject({
      fontFamily: 'KFGQPC-Uthmani',
      fontSize: 38,
    });
    expect(StyleSheet.flatten(getByTestId('greeting-page-glyph').props.style)).toMatchObject({
      fontFamily: 'KFGQPC-Uthmani',
      fontSize: 38,
    });
    expect(StyleSheet.flatten(getByTestId('greeting-streak-glyph').props.style)).toMatchObject({
      fontFamily: 'KFGQPC-Uthmani',
      fontSize: 34,
    });
  });

  it('keeps Arabic surah and juz row text on the visual right', () => {
    const { getByLabelText, getByText } = render(
      <>
        <SurahListItem
          surah={alFatiha}
          onSelect={jest.fn()}
          onOpen={jest.fn()}
        />
        <JuzListItem
          juz={juzOne}
          surahNames={new Map([[1, 'الفاتحة']])}
          onSelect={jest.fn()}
          onOpen={jest.fn()}
        />
      </>
    );

    expect(getByLabelText('الفاتحة')).toBeTruthy();
    expect(StyleSheet.flatten(getByText('الفاتحة').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
    expect(StyleSheet.flatten(getByText('الجزء').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
  });
});
