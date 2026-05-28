import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...args: any[]) => mockPush(...args) }),
}));

import { BrandBar } from '../../../src/components/home/BrandBar';

describe('BrandBar', () => {
  beforeEach(() => mockPush.mockReset());

  it('renders a bookmark icon button with the localized label', () => {
    const { getByLabelText } = render(<BrandBar />);
    expect(getByLabelText('افتح الإشارات المرجعية')).toBeTruthy();
  });

  it('navigates to /bookmarks when the icon is pressed', () => {
    const { getByLabelText } = render(<BrandBar />);
    fireEvent.press(getByLabelText('افتح الإشارات المرجعية'));
    expect(mockPush).toHaveBeenCalledWith('/bookmarks');
  });
});
