jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

import { getStrings } from '../../src/constants/strings';

describe('localized strings', () => {
  it('keeps Arabic night reading details Arabic-only', () => {
    const strings = getStrings('ar');

    expect(strings.settingsNightPureInkValue).not.toMatch(/[A-Za-z]/);
  });
});
