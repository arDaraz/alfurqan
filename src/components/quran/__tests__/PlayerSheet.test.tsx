jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock('../../../data/quranRepository', () => ({
  getAyahTextRange: jest.fn().mockResolvedValue('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    next: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    prev: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    seek: jest.fn().mockResolvedValue(undefined),
    setMode: jest.fn(),
    setSpeed: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../ReciterPickerSheet', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ReciterPickerSheet: ({ visible }: { visible: boolean }) =>
      visible ? <Text>reciter-picker</Text> : null,
  };
});

import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PlayerSheet } from '../PlayerSheet';
import { getAyahTextRange } from '../../../data/quranRepository';
import { recitationEngine } from '../../../services/recitationEngine';
import { downloadKey, useReciterStore } from '../../../stores/reciterStore';
import { useRecitationStore } from '../../../stores/recitationStore';
import { theme } from '../../../constants/theme';

const getAyahTextRangeMock = getAyahTextRange as jest.MockedFunction<typeof getAyahTextRange>;

describe('PlayerSheet', () => {
  const startSurahDownload = jest.fn();
  const cancelSurahDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
    useRecitationStore.getState()._setSession({
      surah: 1,
      startAyah: 1,
      stopAyah: 7,
      trigger: 'popup',
    }, 1);
    useRecitationStore.getState()._setState('playing');
    useRecitationStore.getState()._setProgress(2, 8);
    useReciterStore.setState({
      selectedReciterId: 'Husary_128kbps',
      downloads: {},
      startSurahDownload,
      cancelSurahDownload,
    });
  });

  it('wires seek and transport controls to the recitation engine', async () => {
    const onClose = jest.fn();
    const { getByLabelText, getByText } = render(<PlayerSheet visible onClose={onClose} />);

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());

    fireEvent.press(getByLabelText('منتصف المقطع'));
    expect(recitationEngine.seek).toHaveBeenCalledWith(4);

    fireEvent.press(getByLabelText('التالي'));
    fireEvent.press(getByLabelText('السابق'));
    fireEvent.press(getByLabelText('إيقاف'));

    expect(recitationEngine.next).toHaveBeenCalledTimes(1);
    expect(recitationEngine.prev).toHaveBeenCalledTimes(1);
    expect(recitationEngine.stop).toHaveBeenCalledTimes(1);
  });

  it('renders the current ayah with the Mushaf Quran font and physical-right RTL alignment', async () => {
    const { getByText } = render(<PlayerSheet visible onClose={jest.fn()} />);

    const ayah = await waitFor(() => getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'));
    const meta = getByText('السورة 1 · الآية 1');
    const style = StyleSheet.flatten(ayah.props.style);
    const metaStyle = StyleSheet.flatten(meta.props.style);

    expect(style).toMatchObject({
      fontFamily: theme.fonts.quran,
      direction: 'rtl',
      alignSelf: 'stretch',
      textAlign: 'left',
      writingDirection: 'rtl',
    });
    expect(metaStyle).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
  });

  it('removes copied ayah number glyphs from the now-playing ayah text', async () => {
    getAyahTextRangeMock.mockResolvedValueOnce(
      'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين ﴿٧﴾'
    );

    const { getByText, queryByText } = render(<PlayerSheet visible onClose={jest.fn()} />);

    expect(
      await waitFor(() =>
        getByText('صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين')
      )
    ).toBeTruthy();
    expect(queryByText('صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين ﴿٧﴾')).toBeNull();
  });

  it('cycles speed and toggles repeat mode', async () => {
    useRecitationStore.getState().setSpeed(0.75);
    const { getByLabelText, getByText } = render(<PlayerSheet visible onClose={jest.fn()} />);

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());

    fireEvent.press(getByLabelText('السرعة'));
    fireEvent.press(getByLabelText('التكرار'));

    expect(recitationEngine.setSpeed).toHaveBeenCalledWith(1);
    expect(recitationEngine.setMode).toHaveBeenCalledWith('loop-surah');
  });

  it('opens the reciter picker from the reciter control', async () => {
    const { getByLabelText, getByText, queryByText } = render(
      <PlayerSheet visible onClose={jest.fn()} />
    );

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());
    expect(queryByText('reciter-picker')).toBeNull();

    fireEvent.press(getByLabelText('القارئ'));

    expect(getByText('reciter-picker')).toBeTruthy();
  });

  it('starts and cancels current surah downloads', async () => {
    const { getByLabelText, getByText, rerender } = render(
      <PlayerSheet visible onClose={jest.fn()} />
    );

    await waitFor(() => expect(getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeTruthy());
    fireEvent.press(getByLabelText('تحميل'));
    expect(startSurahDownload).toHaveBeenCalledWith('Husary_128kbps', 1);

    act(() => {
      useReciterStore.setState({
        downloads: {
          [downloadKey('Husary_128kbps', 1)]: {
            ayahsTotal: 7,
            ayahsCached: 1,
            status: 'downloading',
          },
        },
        startSurahDownload,
        cancelSurahDownload,
      });
    });
    rerender(<PlayerSheet visible onClose={jest.fn()} />);

    fireEvent.press(getByLabelText('تحميل'));
    expect(cancelSurahDownload).toHaveBeenCalledWith('Husary_128kbps', 1);
  });
});
