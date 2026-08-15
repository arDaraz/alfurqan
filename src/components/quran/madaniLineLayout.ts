const CENTER_ALIGNED_PAGES = new Set([1, 2]);

// QCF V2 lines whose shorter measure is intentional in the printed Madani Mushaf.
// Keep this list pinned to Quran Foundation's renderer instead of inferring it from
// ayah length or surah boundaries:
// https://github.com/quran/quran.com-frontend-next/blob/aff1a035b09b66f28047b3216edcae4c5c949a49/src/components/Verse/pageUtils.ts
const CENTER_ALIGNED_PAGE_LINES: Readonly<Record<number, readonly number[]>> = {
  255: [2],
  528: [9],
  534: [6],
  545: [6],
  586: [1],
  593: [2],
  594: [5],
  600: [10],
  602: [5, 15],
  603: [10, 15],
  604: [4, 9, 14, 15],
};

export function isMadaniCenterAlignedLine(pageNumber: number, lineNumber: number): boolean {
  return (
    CENTER_ALIGNED_PAGES.has(pageNumber) ||
    (CENTER_ALIGNED_PAGE_LINES[pageNumber]?.includes(lineNumber) ?? false)
  );
}
