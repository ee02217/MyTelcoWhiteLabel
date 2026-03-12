import rawTokens from './tokens.json';

export const tokens = rawTokens;

export type DesignTokens = typeof tokens;
export type ColorTokens = DesignTokens['color'];
export type TypographyTokens = DesignTokens['typography'];
export type SpacingTokens = DesignTokens['spacing'];
export type RadiusTokens = DesignTokens['radius'];
export type ShadowTokens = DesignTokens['shadow'];
export type MotionTokens = DesignTokens['motion'];

const remToPx = (value: string): number => {
  if (value.endsWith('rem')) return Number.parseFloat(value) * 16;
  if (value.endsWith('px')) return Number.parseFloat(value);
  return Number.parseFloat(value) || 0;
};

export const rnTokens = {
  colors: tokens.color,
  typography: {
    ...tokens.typography,
    sizePx: {
      xs: remToPx(tokens.typography.size.xs),
      sm: remToPx(tokens.typography.size.sm),
      base: remToPx(tokens.typography.size.base),
      lg: remToPx(tokens.typography.size.lg),
      xl: remToPx(tokens.typography.size.xl),
      '2xl': remToPx(tokens.typography.size['2xl']),
      '3xl': remToPx(tokens.typography.size['3xl']),
      '4xl': remToPx(tokens.typography.size['4xl']),
    },
  },
  spacingPx: Object.fromEntries(
    Object.entries(tokens.spacing).map(([key, value]) => [key, remToPx(value)])
  ) as Record<string, number>,
  radiusPx: Object.fromEntries(
    Object.entries(tokens.radius).map(([key, value]) => [key, remToPx(value)])
  ) as Record<string, number>,
};
