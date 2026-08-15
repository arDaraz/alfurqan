# Mushaf content packs

Quranic accuracy is a release gate. A visual page number is never treated as a
canonical Quran location: navigation, reading progress, bookmarks, selection,
and future memorization highlighting use `surah:ayah:word-position`. Page and
line coordinates are scoped by the stable layout ID.

## Shipped layouts

| Stable layout ID | Upstream Mushaf ID | Edition | Renderer | Pages × lines | Tokens | Data version |
| --- | ---: | --- | --- | ---: | ---: | --- |
| `madani-qcf-v2-hafs` | 1 | Madani QCF V2, Hafs | Per-page QCF V2 glyph font | 604 × 15 | 83,665 | `quran-foundation-mushaf-1@2026-08-14` |
| `indopak-15-line-hafs` | 6 | Qudratullah IndoPak 15-line, Hafs | Unicode Nastaleeq on authoritative QUL lines | 610 × 15 | 83,668 | `qul-resource-12@2026-08-14` |

Both packs contain all 6,236 ayahs. The IndoPak pack contains 9,150 explicit
line records, including `surah_name`, `basmallah`, and intentional empty lines.
It maps `112:1` to page 609 and ends with canonical token `114:6:4` on page
610, proving that it is not the 604-page Madani mapping with a different font.

## Sources, versions, and attribution

### Madani QCF V2

- Quran Foundation/Quran.com Mushaf ID **1** (QCF V2).
- Word glyphs and page/line metadata were seeded from the Quran.com v4 content
  API with `code_v2,line_number,page_number`.
- The 604 matching QCF V2 WOFF2 page fonts are bundled in `qcf_fonts`.
- Attribution: Quran Foundation and the King Fahd Glorious Quran Printing
  Complex. The page fonts remain the property of their upstream publisher.

### Qudratullah IndoPak 15-line

- Quran Foundation Mushaf ID **6** names the 610-page IndoPak 15-line edition.
- Layout: [QUL resource 12](https://qul.tarteel.ai/resources/mushaf-layout/12),
  following the Qudratullah Company print from Lahore.
- Script: [QUL resource 59](https://qul.tarteel.ai/resources/quran-script/59),
  IndoPak Nastaleeq word-by-word Hafs text.
- Font: [QUL resource 242](https://qul.tarteel.ai/resources/font/242),
  `normal-v4.2.2/with-waqf-lazmi/font.woff2`, bundled unmodified.
- Credits required by the script/font authors: Ayman Siddiqui and R. Siddiqua,
  QuranWBW.com and Quran.com. The layout is credited to Qudratullah Company and
  QUL/Tarteel. These credits are also visible in the Settings selector.
- The upstream author notice says not to sell, manipulate, redistribute without
  credits, or tamper with the script/font. The pack is stored unmodified and
  credited. QUL notes that resource licenses vary; a qualified legal/content
  reviewer must confirm suitability before any commercial release.

The Quran Foundation page-layout tutorial currently illustrates `2:255` on
page 44 for Mushaf 6, while live QUL resource 12 places it on page 42. The
content-pack builder pins the live resource rather than silently changing its
coordinates. This discrepancy must be reviewed by a qualified Quran-layout
reviewer before release.

## Pinned integrity values

| Item | SHA-256 |
| --- | --- |
| Madani ordered QCF V2 words + coordinates | `e4b3c4cf5c2d4ea9438a267bd6a9495bb25682101cd4c9f67ae6ce0ad835b745` |
| Madani ordered page-font checksum manifest | `1798312207bab701df92a59b5cc80bd012158832dfd5b5a90bdcca6f044f9427` |
| IndoPak authoritative lines + ordered tokens | `c32df177983ffa39230e3599782de490b302b656b87be9b1df42deaf724a747a` |
| IndoPak Nastaleeq 4.2.2 WOFF2 | `01f10434c0f0e30303647603e0018fb9fe08b81e3e7716804e00dfc37d2b5a7c` |
| Bundled `quran.db` after pack generation | `c07793668e0b53ddbf9542129629b7d9153688656104b0e563cfe1fd621631ae` |

The runtime validates the pinned manifest, structural word/page/line/ayah/key
counts, the stored font checksum, a final-location sentinel, and asset presence
before rendering. Automated integrity tests also recompute the bundled font
checksum. Missing or mismatched packs produce a user-facing repair state; no
network fallback is allowed.

## Regeneration and update procedure

1. Review the QUL resource pages and author notices. Do not change the layout,
   script, or font independently.
2. Start from a clean LFS checkout and run `git lfs pull` followed by `npm ci`.
3. Run `npm run seed:mushaf-layouts`. The builder downloads all 610 public QUL
   page previews and the exact 4.2.2 font, parses canonical identities and line
   metadata, verifies page/line/ayah/token invariants, writes layout-keyed
   SQLite tables, verifies the retained Madani words/page fonts, sets schema
   version 3, vacuums the file, and prints hashes.
4. Compare page 1, page 2, page 42, a multi-surah boundary, page 604, page 609,
   and page 610 against the QUL preview and a physical Qudratullah copy.
5. Update the hashes and expected counts in `src/data/mushafLayouts.ts` and this
   document only after qualified Quran review. Commit the changed LFS object
   together with the registry and documentation.

Never run the legacy `seedMushafData.ts` IndoPak path as a substitute: it asks
the unauthenticated legacy API for `mushaf=3`, which returns 604-page Madani
coordinates and is not the Qudratullah 610-page layout.
