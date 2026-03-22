import { theme } from '../../src/constants/theme';

describe('Theme constants', () => {
  describe('Colors', () => {
    it('has correct primary color', () => {
      expect(theme.colors.primary).toBe('#0D7377');
    });

    it('has correct accent color', () => {
      expect(theme.colors.accent).toBe('#C9A84C');
    });

    it('has correct background color', () => {
      expect(theme.colors.background).toBe('#FAF8F2');
    });

    it('has correct text color', () => {
      expect(theme.colors.text).toBe('#1A1A2E');
    });

    it('has correct surface color', () => {
      expect(theme.colors.surface).toBe('#FFFFFF');
    });

    it('has correct primaryDark color', () => {
      expect(theme.colors.primaryDark).toBe('#0B6163');
    });

    it('has correct textSecondary color', () => {
      expect(theme.colors.textSecondary).toBe('#6B7280');
    });

    it('has correct textDisabled color', () => {
      expect(theme.colors.textDisabled).toBe('#9CA3AF');
    });

    it('has correct destructive color', () => {
      expect(theme.colors.destructive).toBe('#DC2626');
    });

    it('has correct selectedRange color', () => {
      expect(theme.colors.selectedRange).toBe('#0D737720');
    });

    it('has correct divider color', () => {
      expect(theme.colors.divider).toBe('#E5E2DA');
    });
  });

  describe('Spacing', () => {
    it('has correct xs spacing', () => {
      expect(theme.spacing.xs).toBe(4);
    });

    it('has correct sm spacing', () => {
      expect(theme.spacing.sm).toBe(8);
    });

    it('has correct md spacing', () => {
      expect(theme.spacing.md).toBe(16);
    });

    it('has correct lg spacing', () => {
      expect(theme.spacing.lg).toBe(24);
    });

    it('has correct xl spacing', () => {
      expect(theme.spacing.xl).toBe(32);
    });

    it('has correct 2xl spacing', () => {
      expect(theme.spacing['2xl']).toBe(48);
    });

    it('has correct 3xl spacing', () => {
      expect(theme.spacing['3xl']).toBe(64);
    });
  });

  describe('Typography', () => {
    it('has correct display size', () => {
      expect(theme.typography.display.size).toBe(28);
    });

    it('has correct display weight', () => {
      expect(theme.typography.display.weight).toBe('700');
    });

    it('has correct display arabicLineHeight', () => {
      expect(theme.typography.display.arabicLineHeight).toBe(2.2);
    });

    it('has correct heading size', () => {
      expect(theme.typography.heading.size).toBe(24);
    });

    it('has correct body size', () => {
      expect(theme.typography.body.size).toBe(18);
    });

    it('has correct label size', () => {
      expect(theme.typography.label.size).toBe(14);
    });
  });
});
