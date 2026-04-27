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

describe('SettingsScreen recitation settings', () => {
  it('opens reciter selection from the reciter row', () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('القارئ'));

    expect(getByText('عبد الباسط عبد الصمد')).toBeTruthy();
  });
});
