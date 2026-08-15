/**
 * Under forceRTL the onboarding slides are laid out right to left, but
 * `scrollTo` and `contentOffset` stay physical. Slide 0 therefore sits at the
 * far right, and a logical index has to be mirrored before it is used.
 */
export function onboardingPageOffset(
  index: number,
  total: number,
  width: number,
  isRTL: boolean
): number {
  return (isRTL ? total - 1 - index : index) * width;
}

export function onboardingIndexFromOffset(
  offsetX: number,
  total: number,
  width: number,
  isRTL: boolean
): number {
  if (width <= 0) return 0;
  const page = Math.round(offsetX / width);
  const index = isRTL ? total - 1 - page : page;
  return Math.max(0, Math.min(total - 1, index));
}
