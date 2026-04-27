jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { NightReadingPicker } from '../../../src/components/settings/NightReadingPicker';
import type { ActiveNightReadingMode } from '../../../src/constants/nightReading';

const labels: Record<ActiveNightReadingMode, { title: string; subtitle: string }> = {
  classical: {
    title: 'Classical Mushaf',
    subtitle: 'Deep teal-black',
  },
  sepia: {
    title: 'Sepia Lamp',
    subtitle: 'Warm charcoal',
  },
  'pure-ink': {
    title: 'Pure Ink',
    subtitle: 'OLED black',
  },
  indigo: {
    title: 'Indigo Night',
    subtitle: 'Midnight blue',
  },
};

describe('NightReadingPicker', () => {
  it('shows text details for the selected mode only', () => {
    const screen = render(
      <NightReadingPicker
        value="sepia"
        labels={labels}
        isArabic={false}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Sepia Lamp')).toBeTruthy();
    expect(screen.getByText('Warm charcoal')).toBeTruthy();
    expect(screen.queryByText('Classical Mushaf')).toBeNull();
    expect(screen.queryByText('Pure Ink')).toBeNull();
    expect(screen.queryByText('Indigo Night')).toBeNull();
  });
});
