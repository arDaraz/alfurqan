import { matchTranscriptToReference } from '../tasmeeaMatcher';

const FATIHA_AYAH_2 = ['ٱلْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'ٱلْعَٰلَمِينَ'];

describe('tasmeeaMatcher', () => {
  it('advances the expected index when transcript tokens match', () => {
    expect(
      matchTranscriptToReference({
        referenceTokens: FATIHA_AYAH_2,
        transcriptText: 'الحمد لله',
      })
    ).toMatchObject({
      status: 'match',
      expectedIndex: 2,
      consumedCount: 2,
      confidence: 1,
      observedTokens: ['الحمد', 'لله'],
    });
  });

  it('classifies a skipped expected word', () => {
    expect(
      matchTranscriptToReference({
        referenceTokens: FATIHA_AYAH_2,
        transcriptText: 'الحمد رب',
      })
    ).toMatchObject({
      status: 'mismatch',
      errorType: 'skipped-word',
      expectedIndex: 1,
      expectedToken: 'لله',
      observedTokens: ['الحمد', 'رب'],
    });
  });

  it('classifies a wrong observed word', () => {
    expect(
      matchTranscriptToReference({
        referenceTokens: FATIHA_AYAH_2,
        transcriptText: 'الحمد للله',
      })
    ).toMatchObject({
      status: 'mismatch',
      errorType: 'wrong-word',
      expectedIndex: 1,
      expectedToken: 'لله',
      observedTokens: ['الحمد', 'للله'],
    });
  });

  it('classifies a repeated previous word', () => {
    expect(
      matchTranscriptToReference({
        referenceTokens: FATIHA_AYAH_2,
        expectedIndex: 1,
        transcriptText: 'الحمد',
      })
    ).toMatchObject({
      status: 'mismatch',
      errorType: 'repeated-word',
      expectedIndex: 1,
      expectedToken: 'لله',
      observedTokens: ['الحمد'],
    });
  });
});
