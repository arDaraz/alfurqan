import { generateMushafHtml } from '../../../src/components/quran/mushafHtml';
import type { MushafWord } from '../../../src/data/types';

const word = (
  id: number,
  surahNumber: number,
  ayahNumber: number,
  wordPosition: number,
  lineNumber: number,
  codeV2: string,
  charType: MushafWord['charType'] = 'word'
): MushafWord => ({
  id,
  surahNumber,
  ayahNumber,
  wordPosition,
  pageNumber: 604,
  lineNumber,
  codeV2,
  charType,
});

describe('generateMushafHtml', () => {
  it('centers a short line that contains the final ayah of a surah', () => {
    const words: MushafWord[] = [
      word(1, 112, 4, 1, 5, 'وَلَمْ'),
      word(2, 112, 4, 2, 5, 'يَكُن'),
      word(3, 112, 4, 3, 5, 'لَّهُ'),
      word(4, 112, 4, 4, 5, 'كُفُواً'),
      word(5, 112, 4, 5, 5, 'أَحَدٌ'),
      word(6, 112, 4, 6, 5, '٤', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="lc surahEnd" data-surah-end="true"><span class="w" data-s="112" data-a="4">وَلَمْ</span>');
    expect(html).toContain('<span class="w" data-s="112" data-a="4">أَحَدٌ</span> <span class="w" data-s="112" data-a="4">٤</span></div>');
    expect(html).not.toContain('<div class="l"><span class="w" data-s="112" data-a="4">وَلَمْ</span>');
  });

  it('keeps non-final short ayah lines on the normal scalable track', () => {
    const words: MushafWord[] = [
      word(1, 112, 3, 1, 4, 'لَمْ'),
      word(2, 112, 3, 2, 4, 'يَلِدْ'),
      word(3, 112, 3, 3, 4, 'وَلَمْ'),
      word(4, 112, 3, 4, 4, 'يُولَدْ'),
      word(5, 112, 3, 5, 4, '٣', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="l"><span class="w" data-s="112" data-a="3">لَمْ</span>');
    expect(html).not.toContain('data-surah-end="true"');
  });

  it('centers measured QCF lines instead of stretching short lines', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [
        word(1, 114, 5, 1, 14, 'يُوَسْوِسُ'),
        word(2, 114, 5, 2, 14, 'فِي'),
        word(3, 114, 5, 3, 14, 'صُدُورِ'),
        word(4, 114, 5, 4, 14, 'النَّاسِ'),
        word(5, 114, 5, 5, 14, '٥', 'end'),
      ],
      fontBase64: 'font-data',
    });

    expect(html).toContain('.l{justify-content:center;transform-origin:center center}');
    expect(html).toContain("els[i].style.justifyContent='center'");
    expect(html).toContain("if(s>0.3&&s<1)els[i].style.transform='scaleX('+s+')'");
    expect(html).toContain("else els[i].style.justifyContent='center'");
    expect(html).not.toContain('MAX_LINE_STRETCH');
  });

  it('applies the configured font size scale to QCF mushaf pages', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
      fontSizeScale: 1.2,
    });

    expect(html).toContain("body{height:100%;background:#F5EEDB;color:#0E2724;font-family:'QCF';font-palette:--QcfSepia;font-size:8.4vw;");
    expect(html).toContain('.group .l,.group .lc{height:auto;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-size:min(8.4vw,33.6px)}');
    expect(html).toContain('.bsm{display:flex;align-items:center;justify-content:center;color:#0E2724;font-family:\'QCF1\';font-palette:--QcfBismillahSepia;font-size:min(6.6vw,28.8px);white-space:nowrap}');
  });
});
