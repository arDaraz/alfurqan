jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

import {
  DEFAULT_THEME_MODE,
  migrateSettingsState,
  useSettingsStore,
} from '../../src/stores/settingsStore';

describe('settings store appearance defaults', () => {
  it('defaults the app appearance to light instead of following the device at first launch', () => {
    expect(DEFAULT_THEME_MODE).toBe('light');
    expect(useSettingsStore.getState().themeMode).toBe('light');
  });

  it('migrates the old implicit system appearance default to light', () => {
    expect(migrateSettingsState({ themeMode: 'system' }, 0)).toMatchObject({
      themeMode: 'light',
      hasChosenThemeMode: false,
    });
  });

  it('preserves an explicitly selected appearance during migration', () => {
    expect(migrateSettingsState({ themeMode: 'dark' }, 0)).toMatchObject({
      themeMode: 'dark',
    });
    expect(
      migrateSettingsState({ themeMode: 'system', hasChosenThemeMode: true }, 0)
    ).toMatchObject({
      themeMode: 'system',
      hasChosenThemeMode: true,
    });
  });

  it('migrates legacy font choices to genuine layout identities', () => {
    expect(migrateSettingsState({ mushafFont: 'indopak-nastaleeq' }, 1)).toMatchObject({
      mushafLayoutId: 'indopak-15-line-hafs',
    });
    expect(migrateSettingsState({ mushafFont: 'qcf-v4' }, 1)).toMatchObject({
      mushafLayoutId: 'madani-qcf-v2-hafs',
    });
    expect(migrateSettingsState({ mushafFont: 'digital-khatt-indopak' }, 1))
      .not.toHaveProperty('mushafFont');
  });

  it('preserves a valid saved layout selection', () => {
    expect(migrateSettingsState({ mushafLayoutId: 'indopak-15-line-hafs' }, 2))
      .toMatchObject({ mushafLayoutId: 'indopak-15-line-hafs' });
  });
});
