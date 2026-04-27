import { theme, lightTheme, darkTheme } from '../../src/constants/theme';

describe('Theme constants — v2 Mushaf palette', () => {
  describe('Legacy color aliases', () => {
    it('primary maps to teal-500', () => {
      expect(theme.colors.primary).toBe('#0B5D53');
    });

    it('primaryDark maps to teal-600', () => {
      expect(theme.colors.primaryDark).toBe('#094A42');
    });

    it('accent maps to gold-500', () => {
      expect(theme.colors.accent).toBe('#B8923F');
    });

    it('background maps to paper-100', () => {
      expect(theme.colors.background).toBe('#F5EEDB');
    });

    it('surface maps to paper-50', () => {
      expect(theme.colors.surface).toBe('#FBF6EA');
    });

    it('text maps to ink-900', () => {
      expect(theme.colors.text).toBe('#0E2724');
    });

    it('textSecondary maps to ink-500', () => {
      expect(theme.colors.textSecondary).toBe('#4A635F');
    });

    it('textDisabled maps to ink-300', () => {
      expect(theme.colors.textDisabled).toBe('#8A9F9B');
    });

    it('destructive maps to rose-500', () => {
      expect(theme.colors.destructive).toBe('#A14444');
    });

    it('selectedRange uses teal-500 with ~14% alpha', () => {
      expect(theme.colors.selectedRange).toBe('#0B5D5324');
    });

    it('divider uses ink-900 at ~10% alpha', () => {
      expect(theme.colors.divider).toBe('#0E27241A');
    });
  });

  describe('Palette ramps', () => {
    it('exposes paper, ink, teal, gold, rose, sage ramps', () => {
      expect(theme.palette.paper[100]).toBe('#F5EEDB');
      expect(theme.palette.ink[900]).toBe('#0E2724');
      expect(theme.palette.teal[500]).toBe('#0B5D53');
      expect(theme.palette.gold[500]).toBe('#B8923F');
      expect(theme.palette.rose[500]).toBe('#A14444');
      expect(theme.palette.sage[500]).toBe('#5F8567');
    });
  });

  describe('Spacing', () => {
    it('keeps the v1 8-point scale', () => {
      expect(theme.spacing.xs).toBe(4);
      expect(theme.spacing.sm).toBe(8);
      expect(theme.spacing.md).toBe(16);
      expect(theme.spacing.lg).toBe(24);
      expect(theme.spacing.xl).toBe(32);
      expect(theme.spacing['2xl']).toBe(48);
      expect(theme.spacing['3xl']).toBe(64);
    });

    it('adds named gutters (screen 24, row 16, ayah 28)', () => {
      expect(theme.gutter.screen).toBe(24);
      expect(theme.gutter.row).toBe(16);
      expect(theme.gutter.ayah).toBe(28);
    });
  });

  describe('Type scale (7 steps)', () => {
    it('caption · label · body · title · heading · display · hero', () => {
      expect(theme.typeScale.caption.size).toBe(12);
      expect(theme.typeScale.label.size).toBe(14);
      expect(theme.typeScale.body.size).toBe(17);
      expect(theme.typeScale.title.size).toBe(22);
      expect(theme.typeScale.heading.size).toBe(28);
      expect(theme.typeScale.display.size).toBe(40);
      expect(theme.typeScale.hero.size).toBe(56);
    });

    it('reserves quran/quranSm and arabic-display sizes', () => {
      expect(theme.typeScale.quran.size).toBe(30);
      expect(theme.typeScale.quran.lineHeight).toBe(2.35);
      expect(theme.typeScale.quranSm.size).toBe(24);
      expect(theme.typeScale.arabicDisplay.size).toBe(44);
    });
  });

  describe('Legacy typography surface (back-compat)', () => {
    it('exposes label/body/heading/display sizes', () => {
      expect(theme.typography.label.size).toBe(14);
      expect(theme.typography.body.size).toBe(17);
      expect(theme.typography.heading.size).toBe(22);
      expect(theme.typography.display.size).toBe(28);
    });
  });

  describe('Radii (xs..2xl + pill)', () => {
    it('uses softer 14/20/28 radii (was 8/12/24)', () => {
      expect(theme.radii.xs).toBe(4);
      expect(theme.radii.sm).toBe(8);
      expect(theme.radii.md).toBe(14);
      expect(theme.radii.lg).toBe(20);
      expect(theme.radii.xl).toBe(28);
      expect(theme.radii['2xl']).toBe(36);
      expect(theme.radii.pill).toBe(9999);
    });
  });

  describe('Motion', () => {
    it('exposes named durations and curves', () => {
      expect(theme.motion.duration.fast).toBe(140);
      expect(theme.motion.duration.base).toBe(220);
      expect(theme.motion.duration.slow).toBe(360);
      expect(theme.motion.duration.ambient).toBe(1200);
      expect(theme.motion.easing.standard).toEqual([0.4, 0, 0.2, 1]);
      expect(theme.motion.easing.entrance).toEqual([0.2, 0.9, 0.3, 1]);
      expect(theme.motion.easing.exit).toEqual([0.4, 0, 1, 1]);
    });
  });

  describe('Fonts', () => {
    it('keeps Quranic font references', () => {
      expect(theme.fonts.arabic).toBe('ReemKufi');
      expect(theme.fonts.quran).toBe('KFGQPC-Uthmani');
      expect(theme.fonts.latin).toBe('Manrope');
      expect(theme.fonts.latinDisplay).toBe('Fraunces');
    });
  });

  describe('Dark mode ("Night reading")', () => {
    it('inverts paper to deep teal-black, ink to ghee', () => {
      expect(darkTheme.semantic.bg).toBe('#0A1C1A');
      expect(darkTheme.semantic.fg).toBe('#EFE5CE');
    });

    it('lightens primary teal to remain readable on dark', () => {
      expect(darkTheme.semantic.primary).toBe('#5FA895');
    });

    it('warms gold rather than literal-inverting it', () => {
      expect(darkTheme.semantic.accent).toBe('#D4AB5E');
    });
  });

  describe('Default export is light theme', () => {
    it('points at lightTheme', () => {
      expect(theme.mode).toBe('light');
      expect(theme.semantic.bg).toBe(lightTheme.semantic.bg);
    });
  });
});
