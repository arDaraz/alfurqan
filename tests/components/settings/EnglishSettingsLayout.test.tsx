jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SettingsGroup } from '../../../src/components/settings/SettingsGroup';
import { Pill } from '../../../src/components/settings/Pill';
import { SettingsRow } from '../../../src/components/settings/SettingsRow';
import { useSettingsStore } from '../../../src/stores/settingsStore';

describe('Settings English locale layout', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'en' });
  });

  it('aligns section labels and row copy for LTR text flow', () => {
    const { getByTestId, getByText } = render(
      <SettingsGroup label="App">
        <SettingsRow
          icon={<Text>icon</Text>}
          label="Language"
          value="English"
          trailing={<Pill label="Change" />}
        />
      </SettingsGroup>
    );

    const groupLabelStyle = StyleSheet.flatten(getByText('App').props.style);
    expect(groupLabelStyle).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
    });

    const rowLabelStyle = StyleSheet.flatten(getByText('Language').props.style);
    expect(rowLabelStyle).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
    });

    const rowValueStyle = StyleSheet.flatten(getByText('English').props.style);
    expect(rowValueStyle).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
    });

    const rowStyle = StyleSheet.flatten(getByTestId('settings-row-Language').props.style);
    expect(rowStyle).toMatchObject({
      flexDirection: 'row',
    });

    const pillStyle = StyleSheet.flatten(getByTestId('settings-pill-Change').props.style);
    expect(pillStyle).toMatchObject({
      flexDirection: 'row',
    });

    const pillLabelStyle = StyleSheet.flatten(getByText('Change').props.style);
    expect(pillLabelStyle).toMatchObject({
      fontFamily: 'Manrope',
      writingDirection: 'ltr',
    });
  });
});

describe('Settings Arabic locale layout', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'ar' });
  });

  it('keeps section labels and row copy on the visual right', () => {
    const { getByText } = render(
      <SettingsGroup label="التطبيق">
        <SettingsRow
          icon={<Text>icon</Text>}
          label="اللغة"
          value="العربية"
          trailing={<Pill label="تغيير" />}
        />
      </SettingsGroup>
    );

    expect(StyleSheet.flatten(getByText('التطبيق').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
    expect(StyleSheet.flatten(getByText('اللغة').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
    expect(StyleSheet.flatten(getByText('العربية').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'rtl',
    });
  });
});
