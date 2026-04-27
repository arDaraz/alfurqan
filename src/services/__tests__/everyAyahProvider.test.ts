import { urlForAyah } from '../everyAyahProvider';

describe('urlForAyah', () => {
  it('builds a flat EveryAyah ayah URL with padded surah and ayah', () => {
    expect(urlForAyah('Husary_128kbps', 1, 1)).toBe(
      'https://everyayah.com/data/Husary_128kbps/001001.mp3'
    );
  });

  it('does not allow ayah zero', () => {
    expect(() => urlForAyah('Husary_128kbps', 1, 0)).toThrow(
      'ayah must be between 1 and 286'
    );
  });
});
