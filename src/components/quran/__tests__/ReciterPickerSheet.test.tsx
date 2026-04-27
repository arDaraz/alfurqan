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
import { ReciterPickerSheet } from '../ReciterPickerSheet';
import { RECITERS } from '../../../data/reciters';
import { recitationEngine } from '../../../services/recitationEngine';

describe('ReciterPickerSheet', () => {
  it('shows all catalog reciters and selects through the engine', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ReciterPickerSheet visible onClose={onClose} />);

    for (const reciter of RECITERS) {
      expect(getByText(reciter.nameAr)).toBeTruthy();
    }

    fireEvent.press(getByText('محمد صديق المنشاوي'));

    expect(recitationEngine.setReciter).toHaveBeenCalledWith('Minshawy_Murattal_128kbps');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
