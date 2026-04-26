jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

import {
  buildMushafHtmlCacheKey,
  quranFontScaleToHtmlScale,
} from '../../src/hooks/useMushafPage';

describe('mushaf page font scaling', () => {
  it('maps the default settings slider value to the default reader scale', () => {
    expect(quranFontScaleToHtmlScale(0.58)).toBeCloseTo(1, 4);
  });

  it('maps lower and higher settings values to smaller and larger reader scales', () => {
    expect(quranFontScaleToHtmlScale(0.25)).toBeLessThan(1);
    expect(quranFontScaleToHtmlScale(0.85)).toBeGreaterThan(1);
  });

  it('keys generated mushaf HTML by font size so cached pages refresh after slider changes', () => {
    expect(buildMushafHtmlCacheKey('uthmanic', 604, 0.4)).not.toBe(
      buildMushafHtmlCacheKey('uthmanic', 604, 0.8)
    );
  });
});
