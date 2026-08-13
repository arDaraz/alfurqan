import {
  getNightReadingPalette,
  isNightReadingEnabled,
  NIGHT_READING_MODES,
} from '../../src/constants/nightReading';

describe('night reading palettes', () => {
  it('exposes the four selectable night reading directions', () => {
    expect(NIGHT_READING_MODES.map((mode) => mode.id)).toEqual([
      'classical',
      'sepia',
      'pure-ink',
      'indigo',
    ]);
  });

  it('treats off as the only disabled night reading mode', () => {
    expect(isNightReadingEnabled('off')).toBe(false);
    expect(isNightReadingEnabled('classical')).toBe(true);
  });

  it('maps each direction to a concrete reader palette', () => {
    expect(getNightReadingPalette('classical')).toMatchObject({
      background: '#0A1C1A',
      surface: '#0F2420',
      bgSunken: '#061412',
      foreground: '#EFE5CE',
      muted: '#B3A884',
      subtle: '#7A7258',
      primary: '#5FA895',
      primaryPressed: '#4E8E7D',
      accent: '#D4AB5E',
      accentSoft: '#E8C987',
      border: 'rgba(239,229,206,0.12)',
    });
    expect(getNightReadingPalette('sepia')).toMatchObject({
      background: '#1F1814',
      surface: '#2A2018',
      bgSunken: '#16110D',
      foreground: '#F0DAB0',
      muted: '#B89C72',
      subtle: '#7A6648',
      primary: '#C8964A',
      accent: '#E0B265',
      border: 'rgba(240,218,176,0.10)',
    });
    expect(getNightReadingPalette('pure-ink').background).toBe('#000000');
    expect(getNightReadingPalette('indigo')).toMatchObject({
      background: '#0F1428',
      surface: '#161C36',
      bgSunken: '#0A0F1F',
      foreground: '#E2E6F2',
      muted: '#9BA3C0',
      subtle: '#5E658A',
      primary: '#7B98D6',
      accent: '#C8A767',
      border: 'rgba(226,230,242,0.10)',
    });
  });
});
