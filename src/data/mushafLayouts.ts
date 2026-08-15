export const MUSHAF_LAYOUT_IDS = [
  'madani-qcf-v2-hafs',
  'indopak-15-line-hafs',
] as const;

export type MushafLayoutId = (typeof MUSHAF_LAYOUT_IDS)[number];
export type MushafScriptKind = 'qcf-v2-glyphs' | 'indopak-nastaleeq-unicode';
export type MushafRendererKind = 'qcf-page-font' | 'unicode-authoritative-lines';

export interface MushafLayoutCapabilities {
  wordSelection: boolean;
  ayahSelection: boolean;
  canonicalWordIdentity: boolean;
  semanticUnicode: boolean;
  offline: boolean;
  tajweedColors: boolean;
}

export interface MushafLayoutDescriptor {
  id: MushafLayoutId;
  upstreamMushafId: number;
  displayName: { ar: string; en: string };
  shortName: { ar: string; en: string };
  region: { ar: string; en: string };
  scriptKind: MushafScriptKind;
  rendererKind: MushafRendererKind;
  pageCount: number;
  linesPerPage: number;
  dataVersion: string;
  assetVersion: string;
  capabilities: MushafLayoutCapabilities;
  attribution: { ar: string; en: string };
  expected: {
    ayahCount: number;
    wordCount: number;
    dataSha256: string;
    fontSha256: string;
  };
}

const commonCapabilities: MushafLayoutCapabilities = {
  wordSelection: true,
  ayahSelection: true,
  canonicalWordIdentity: true,
  semanticUnicode: true,
  offline: true,
  tajweedColors: false,
};

export const MUSHAF_LAYOUTS: readonly MushafLayoutDescriptor[] = [
  {
    id: 'madani-qcf-v2-hafs',
    upstreamMushafId: 1,
    displayName: { ar: 'مصحف المدينة النبوية', en: 'Madani Mushaf' },
    shortName: { ar: 'المدني', en: 'Madani' },
    region: { ar: 'المدينة المنورة', en: 'Madinah' },
    scriptKind: 'qcf-v2-glyphs',
    rendererKind: 'qcf-page-font',
    pageCount: 604,
    linesPerPage: 15,
    dataVersion: 'quran-foundation-mushaf-1@2026-08-14',
    assetVersion: 'qcf-v2-page-fonts@3.1',
    capabilities: commonCapabilities,
    attribution: {
      ar: 'مجمع الملك فهد لطباعة المصحف الشريف · مؤسسة القرآن',
      en: 'King Fahd Quran Printing Complex · Quran Foundation',
    },
    expected: {
      ayahCount: 6236,
      wordCount: 83665,
      dataSha256: 'e4b3c4cf5c2d4ea9438a267bd6a9495bb25682101cd4c9f67ae6ce0ad835b745',
      fontSha256: '1798312207bab701df92a59b5cc80bd012158832dfd5b5a90bdcca6f044f9427',
    },
  },
  {
    id: 'indopak-15-line-hafs',
    upstreamMushafId: 6,
    displayName: { ar: 'مصحف إندوباك ١٥ سطرًا', en: 'IndoPak 15-line Mushaf' },
    shortName: { ar: 'إندوباك', en: 'IndoPak' },
    region: { ar: 'شبه القارة الهندية', en: 'South Asia' },
    scriptKind: 'indopak-nastaleeq-unicode',
    rendererKind: 'unicode-authoritative-lines',
    pageCount: 610,
    linesPerPage: 15,
    dataVersion: 'qul-resource-12@2026-08-14',
    assetVersion: 'indopak-nastaleeq-with-waqf-lazmi@4.2.2',
    capabilities: commonCapabilities,
    attribution: {
      ar: 'تخطيط شركة قدرت الله عبر QUL · خط أيمن صديقي وR. Siddiqua',
      en: 'Qudratullah layout via QUL · font by Ayman Siddiqui and R. Siddiqua',
    },
    expected: {
      ayahCount: 6236,
      wordCount: 83668,
      dataSha256: 'c32df177983ffa39230e3599782de490b302b656b87be9b1df42deaf724a747a',
      fontSha256: '01f10434c0f0e30303647603e0018fb9fe08b81e3e7716804e00dfc37d2b5a7c',
    },
  },
] as const;

export const DEFAULT_MUSHAF_LAYOUT_ID: MushafLayoutId = 'madani-qcf-v2-hafs';

export function isMushafLayoutId(value: unknown): value is MushafLayoutId {
  return typeof value === 'string' && MUSHAF_LAYOUT_IDS.includes(value as MushafLayoutId);
}

export function getMushafLayout(id: MushafLayoutId): MushafLayoutDescriptor {
  return MUSHAF_LAYOUTS.find((layout) => layout.id === id)!;
}
