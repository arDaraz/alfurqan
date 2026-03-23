import type { MushafWord, MushafLine } from '../../data/types';

/**
 * Generates a complete HTML document for rendering a single Mushaf page
 * using QCF v2 page fonts. The HTML is designed for display in a WebView
 * with no scrolling, no JavaScript, and no user interaction.
 */
export function generateMushafHtml(
  pageNumber: number,
  words: MushafWord[],
  fontBase64: string
): string {
  // Group words by line number into MushafLine[]
  const lineMap = new Map<number, MushafWord[]>();
  for (const word of words) {
    const existing = lineMap.get(word.lineNumber);
    if (existing) {
      existing.push(word);
    } else {
      lineMap.set(word.lineNumber, [word]);
    }
  }

  // Build MushafLine array ordered by line number (1-15)
  const lines: MushafLine[] = [];
  const sortedKeys = Array.from(lineMap.keys()).sort((a, b) => a - b);
  for (const lineNum of sortedKeys) {
    const lineWords = lineMap.get(lineNum)!;
    // A line is centered if it has fewer than 4 words and all words are non-'word' type
    const isCentered =
      lineWords.length < 4 &&
      lineWords.every((w) => w.charType !== 'word');
    lines.push({
      lineNumber: lineNum,
      words: lineWords,
      isCentered,
    });
  }

  // Generate line divs
  const lineDivs = lines
    .map((line) => {
      const className = line.isCentered ? 'line-centered' : 'line';
      const text = line.words.map((w) => w.codeV2).join(' ');
      return `  <div class="${className}">${text}</div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <style>
    @font-face {
      font-family: 'QCF_P${pageNumber}';
      src: url(data:font/woff2;base64,${fontBase64});
      font-display: block;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #FAF8F2;
      color: #1A1A2E;
      font-family: 'QCF_P${pageNumber}';
      font-size: 28px;
      line-height: 1.9;
      word-spacing: -2px;
      direction: rtl;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      -webkit-user-select: none;
      user-select: none;
      overflow: hidden;
    }
    .line {
      text-align: justify;
      width: 100%;
    }
    .line-centered {
      text-align: center;
      width: 100%;
    }
  </style>
</head>
<body>
${lineDivs}
</body>
</html>`;
}
