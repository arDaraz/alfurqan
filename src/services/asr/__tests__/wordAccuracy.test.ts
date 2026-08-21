import { scoreTranscript } from '../wordAccuracy';

const FATIHA_2 = 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ';

describe('scoreTranscript', () => {
  it('scores a perfect recitation as fully accurate', () => {
    const result = scoreTranscript(FATIHA_2, 'الحمد لله رب العالمين');

    expect(result).toMatchObject({
      expectedCount: 4,
      correct: 4,
      substituted: 0,
      skipped: 0,
      added: 0,
      accuracy: 1,
    });
  });

  it('counts one wrong word as a substitution', () => {
    const result = scoreTranscript(FATIHA_2, 'الحمد لله رب الناس');

    expect(result).toMatchObject({ correct: 3, substituted: 1, skipped: 0, added: 0 });
    expect(result.accuracy).toBeCloseTo(0.75);
  });

  it('counts a dropped word as skipped without failing the words after it', () => {
    const result = scoreTranscript(FATIHA_2, 'الحمد لله العالمين');

    expect(result).toMatchObject({ correct: 3, substituted: 0, skipped: 1, added: 0 });
  });

  it('counts an extra word as added', () => {
    const result = scoreTranscript(FATIHA_2, 'الحمد لله رب رب العالمين');

    expect(result).toMatchObject({ correct: 4, substituted: 0, skipped: 0, added: 1 });
    expect(result.accuracy).toBe(1);
  });

  it('scores silence as nothing recognized', () => {
    const result = scoreTranscript(FATIHA_2, '');

    expect(result).toMatchObject({ correct: 0, skipped: 4, accuracy: 0 });
  });
});
