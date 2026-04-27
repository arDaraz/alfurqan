import { generateMushafHtml } from '../mushafHtml';
import type { MushafWord } from '../../../data/types';

const words: MushafWord[] = [
  {
    id: 1,
    surahNumber: 1,
    ayahNumber: 1,
    wordPosition: 1,
    pageNumber: 1,
    lineNumber: 1,
    codeV2: 'word',
    charType: 'word',
  },
];

describe('generateMushafHtml recitation highlight protocol', () => {
  it('defines playing ayah styling and a setPlayingAyah bridge function', () => {
    const html = generateMushafHtml({
      pageNumber: 1,
      words,
      fontBase64: 'font',
    });

    expect(html).toContain('.w.playing,.rub.playing');
    expect(html).toContain('function setPlayingAyah(s,a)');
    expect(html).toContain("document.querySelectorAll('.playing')");
    expect(html).toContain('window.setPlayingAyah=setPlayingAyah');
  });
});
