import { generateLayoutMushafHtml } from '../../../src/components/quran/mushafHtmlLayout';
import { getMushafLayout } from '../../../src/data/mushafLayouts';
import type { MushafLine } from '../../../src/data/types';

describe('generateLayoutMushafHtml', () => {
  const lines: MushafLine[] = [
    { lineNumber: 1, lineType: 'surah_name', isCentered: true, surahNumber: 112, words: [] },
    { lineNumber: 2, lineType: 'basmallah', isCentered: true, surahNumber: 112, words: [] },
    {
      lineNumber: 3,
      lineType: 'ayah',
      isCentered: false,
      surahNumber: 112,
      words: [
        {
          id: 1,
          canonicalWordKey: '112:1:1',
          sourceWordId: 9001,
          surahNumber: 112,
          ayahNumber: 1,
          wordPosition: 1,
          pageNumber: 609,
          lineNumber: 3,
          codeV2: 'قُلْ',
          semanticText: 'قُلْ',
          charType: 'word',
        },
      ],
    },
    ...Array.from({ length: 12 }, (_, index): MushafLine => ({
      lineNumber: index + 4,
      lineType: 'empty',
      isCentered: true,
      words: [],
    })),
  ];

  it('renders exact authoritative line slots with stable canonical word identity', () => {
    const html = generateLayoutMushafHtml({
      layout: getMushafLayout('indopak-15-line-hafs'),
      pageNumber: 609,
      lines,
      fontBase64: 'offline-font',
      surahNames: { 112: 'الإخلاص' },
    });

    expect(html).toContain('grid-template-rows:repeat(15,minmax(0,1fr))');
    expect(html).toContain('data-line="1"');
    expect(html).toContain('data-line="15"');
    expect(html).toContain('data-wk="112:1:1"');
    expect(html).toContain('data-p="1"');
    expect(html).toContain('الإخلاص');
  });

  it('uses only the bundled matching font and uniform page-font fitting', () => {
    const html = generateLayoutMushafHtml({
      layout: getMushafLayout('indopak-15-line-hafs'),
      pageNumber: 609,
      lines,
      fontBase64: 'offline-font',
      surahNames: { 112: 'الإخلاص' },
    });

    expect(html).toContain('data:font/woff2;base64,offline-font');
    expect(html).toContain('function naturalLineWidth(inner){');
    expect(html).toContain('function fitPageFont(){');
    expect(html).toContain("canvas.style.fontSize=(fontSize*scale)+'px'");
    expect(html).toContain('html,body{width:100%;height:100%;overflow:visible');
    expect(html).toContain('#pageViewport{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:visible}');
    expect(html).toContain('var naturalWidth=Math.max(inner.clientWidth,naturalLineWidth(inner))');
    expect(html).not.toContain('canvas.style.transform');
    expect(html).not.toContain('Math.max(.72,scale)');
    expect(html).not.toContain('scaleX(');
    expect(html).not.toMatch(/src:url\(https?:\/\//);
    expect(html).not.toContain('fetch(');
  });

  it('preserves semantic selection and playback hooks', () => {
    const html = generateLayoutMushafHtml({
      layout: getMushafLayout('indopak-15-line-hafs'),
      pageNumber: 609,
      lines,
      fontBase64: 'offline-font',
      surahNames: { 112: 'الإخلاص' },
    });

    expect(html).toContain('canonicalWordKey:token.dataset.wk');
    expect(html).toContain('wordPosition:+token.dataset.p');
    expect(html).toContain('window.clearSelection=clearSelection');
    expect(html).toContain('window.setPlayingAyah=setPlayingAyah');
    expect(html).toContain('longPressed=true;selectToken(startPoint.token,startPoint.x,startPoint.y,true)');
    expect(html).toContain('if(longPressed){startPoint=null;longPressed=false;return}');
  });
});
