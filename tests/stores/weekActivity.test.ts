jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import { weekActivity } from '../../src/stores/readingStore';

const today = new Date(2026, 7, 15);

describe('weekActivity', () => {
  it('is empty when nothing has been read', () => {
    expect(weekActivity(0, null, today)).toEqual(Array(7).fill(false));
  });

  it('fills the tail of the window for a run read up to today', () => {
    expect(weekActivity(3, '2026-08-15', today)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it('fills every day when the run is longer than the window', () => {
    expect(weekActivity(28, '2026-08-15', today)).toEqual(Array(7).fill(true));
  });

  it('leaves today empty when the last read was yesterday', () => {
    expect(weekActivity(2, '2026-08-14', today)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      false,
    ]);
  });

  it('shows nothing when the run ended before the window', () => {
    expect(weekActivity(2, '2026-08-01', today)).toEqual(Array(7).fill(false));
  });
});
