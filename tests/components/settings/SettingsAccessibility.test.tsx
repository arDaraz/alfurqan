jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FontSizeRow } from '../../../src/components/settings/FontSizeRow';
import { Pill } from '../../../src/components/settings/Pill';

describe('settings controls expose their semantics', () => {
  it('publishes the Quran font size as an adjustable slider', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <FontSizeRow label="حجم النص القرآني" value={0.8} onChange={onChange} />
    );

    const slider = getByLabelText('حجم النص القرآني');
    expect(slider.props.accessibilityRole).toBe('adjustable');
    expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 80, text: '80%' });

    fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(0.9);

    fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(0.7000000000000001);
  });

  it('clamps the slider at both ends', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(
      <FontSizeRow label="حجم" value={1} onChange={onChange} />
    );
    fireEvent(getByLabelText('حجم'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).toHaveBeenLastCalledWith(1);

    rerender(<FontSizeRow label="حجم" value={0} onChange={onChange} />);
    fireEvent(getByLabelText('حجم'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('publishes a pressable pill as a button that names its setting', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <Pill label="قوي" accessibilityLabel="حساسية التصحيح" onPress={onPress} withChevron={false} />
    );

    const pill = getByLabelText('حساسية التصحيح');
    expect(pill.props.accessibilityRole).toBe('button');
    expect(pill.props.accessibilityValue).toEqual({ text: 'قوي' });

    fireEvent.press(pill);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
