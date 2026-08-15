import {
  onboardingIndexFromOffset,
  onboardingPageOffset,
} from '../../../src/components/onboarding/paging';

const TOTAL = 3;
const WIDTH = 393;

describe('onboarding paging offsets', () => {
  it('walks left to right when the layout is left to right', () => {
    expect(onboardingPageOffset(0, TOTAL, WIDTH, false)).toBe(0);
    expect(onboardingPageOffset(1, TOTAL, WIDTH, false)).toBe(393);
    expect(onboardingPageOffset(2, TOTAL, WIDTH, false)).toBe(786);
  });

  // The Simulator showed this: Next from slide 2 scrolled back to slide 1,
  // because slide 0 sits at the far right once the layout is mirrored.
  it('mirrors the offsets when the layout is right to left', () => {
    expect(onboardingPageOffset(0, TOTAL, WIDTH, true)).toBe(786);
    expect(onboardingPageOffset(1, TOTAL, WIDTH, true)).toBe(393);
    expect(onboardingPageOffset(2, TOTAL, WIDTH, true)).toBe(0);
  });

  it('reads the slide index back out of a scroll offset', () => {
    expect(onboardingIndexFromOffset(0, TOTAL, WIDTH, false)).toBe(0);
    expect(onboardingIndexFromOffset(786, TOTAL, WIDTH, false)).toBe(2);
    expect(onboardingIndexFromOffset(786, TOTAL, WIDTH, true)).toBe(0);
    expect(onboardingIndexFromOffset(0, TOTAL, WIDTH, true)).toBe(2);
  });

  it('round trips every slide in both directions', () => {
    for (const isRTL of [false, true]) {
      for (let index = 0; index < TOTAL; index += 1) {
        const offset = onboardingPageOffset(index, TOTAL, WIDTH, isRTL);
        expect(onboardingIndexFromOffset(offset, TOTAL, WIDTH, isRTL)).toBe(index);
      }
    }
  });

  it('clamps an out of range or unmeasured offset', () => {
    expect(onboardingIndexFromOffset(-200, TOTAL, WIDTH, false)).toBe(0);
    expect(onboardingIndexFromOffset(5000, TOTAL, WIDTH, false)).toBe(2);
    expect(onboardingIndexFromOffset(120, TOTAL, 0, false)).toBe(0);
  });
});
