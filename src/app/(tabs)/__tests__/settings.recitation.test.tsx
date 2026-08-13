jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    setReciter: jest.fn().mockResolvedValue(undefined),
  },
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SettingsScreen from '../settings';
import { downloadKey, useReciterStore } from '../../../stores/reciterStore';

describe('SettingsScreen recitation settings', () => {
  beforeEach(() => {
    useReciterStore.setState({
      selectedReciterId: 'Husary_128kbps',
      downloads: {},
    });
  });

  it('opens reciter selection from the reciter row', () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('القارئ'));

    expect(getByText('عبد الباسط عبد الصمد')).toBeTruthy();
  });

  it('shows saved recitation size and deletes saved rows', () => {
    const deleteSurahDownload = jest.fn();
    useReciterStore.setState({
      downloads: {
        [downloadKey('Husary_128kbps', 1)]: {
          ayahsTotal: 7,
          ayahsCached: 7,
          status: 'complete',
          bytes: 1234,
        },
      },
      deleteSurahDownload,
    });
    const { getByText, getByLabelText } = render(<SettingsScreen />);

    expect(getByText('1.2 KB محفوظة')).toBeTruthy();
    fireEvent.press(getByText('التلاوات المحفوظة'));
    expect(getByText('Husary_128kbps · سورة 1')).toBeTruthy();

    fireEvent.press(getByLabelText('حذف سورة 1'));
    expect(deleteSurahDownload).toHaveBeenCalledWith('Husary_128kbps', 1);
  });
});
