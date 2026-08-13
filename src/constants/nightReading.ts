export type ActiveNightReadingMode = 'classical' | 'sepia' | 'pure-ink' | 'indigo';
export type NightReadingMode = 'off' | ActiveNightReadingMode;

export interface NightReadingPalette {
  background: string;
  surface: string;
  bgSunken: string;
  foreground: string;
  muted: string;
  subtle: string;
  accent: string;
  accentSoft: string;
  border: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  ornamentFill: string;
  selectedBackground: string;
  selectedBorder: string;
}

export const NIGHT_READING_MODES: readonly { id: ActiveNightReadingMode }[] = [
  { id: 'classical' },
  { id: 'sepia' },
  { id: 'pure-ink' },
  { id: 'indigo' },
] as const;

const PALETTES: Record<NightReadingMode, NightReadingPalette> = {
  off: {
    background: '#F5EEDB',
    surface: '#FBF6EA',
    bgSunken: '#EBE2C9',
    foreground: '#0E2724',
    muted: '#4A635F',
    subtle: '#8A9F9B',
    accent: '#B8923F',
    accentSoft: '#E2C480',
    border: '#0E27241A',
    primary: '#0B5D53',
    primaryPressed: '#094A42',
    primaryForeground: '#FBF6EA',
    ornamentFill: '#F5EEDB',
    selectedBackground: 'rgba(11,93,83,0.10)',
    selectedBorder: 'rgba(11,93,83,0.35)',
  },
  classical: {
    background: '#0A1C1A',
    surface: '#0F2420',
    bgSunken: '#061412',
    foreground: '#EFE5CE',
    muted: '#B3A884',
    subtle: '#7A7258',
    accent: '#D4AB5E',
    accentSoft: '#E8C987',
    border: 'rgba(239,229,206,0.12)',
    primary: '#5FA895',
    primaryPressed: '#4E8E7D',
    primaryForeground: '#061412',
    ornamentFill: '#0A1C1A',
    selectedBackground: 'rgba(95,168,149,0.22)',
    selectedBorder: 'rgba(95,168,149,0.48)',
  },
  sepia: {
    background: '#1F1814',
    surface: '#2A2018',
    bgSunken: '#16110D',
    foreground: '#F0DAB0',
    muted: '#B89C72',
    subtle: '#7A6648',
    accent: '#E0B265',
    accentSoft: '#E0B265',
    border: 'rgba(240,218,176,0.10)',
    primary: '#C8964A',
    primaryPressed: '#B5843E',
    primaryForeground: '#16110D',
    ornamentFill: '#1F1814',
    selectedBackground: 'rgba(200,150,74,0.18)',
    selectedBorder: 'rgba(200,150,74,0.38)',
  },
  'pure-ink': {
    background: '#000000',
    surface: '#0A0A0A',
    bgSunken: '#000000',
    foreground: '#E8DEC3',
    muted: '#7E7660',
    subtle: '#4D4838',
    accent: '#B8923F',
    accentSoft: '#B8923F',
    border: 'rgba(232,222,195,0.06)',
    primary: '#6FB8A4',
    primaryPressed: '#5FA895',
    primaryForeground: '#000000',
    ornamentFill: '#000000',
    selectedBackground: 'rgba(111,184,164,0.18)',
    selectedBorder: 'rgba(111,184,164,0.42)',
  },
  indigo: {
    background: '#0F1428',
    surface: '#161C36',
    bgSunken: '#0A0F1F',
    foreground: '#E2E6F2',
    muted: '#9BA3C0',
    subtle: '#5E658A',
    accent: '#C8A767',
    accentSoft: '#C8A767',
    border: 'rgba(226,230,242,0.10)',
    primary: '#7B98D6',
    primaryPressed: '#667FBA',
    primaryForeground: '#0A0F1F',
    ornamentFill: '#0F1428',
    selectedBackground: 'rgba(123,152,214,0.22)',
    selectedBorder: 'rgba(123,152,214,0.45)',
  },
};

export function isNightReadingEnabled(mode: NightReadingMode): mode is ActiveNightReadingMode {
  return mode !== 'off';
}

export function getNightReadingPalette(mode: NightReadingMode): NightReadingPalette {
  return PALETTES[mode];
}
