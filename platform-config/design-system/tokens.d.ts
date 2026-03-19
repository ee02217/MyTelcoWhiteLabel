declare const tokens: {
  color: Record<string, Record<string, string>>;
  typography: {
    family: Record<string, string>;
    size: Record<string, string>;
    weight: Record<string, string>;
  };
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  motion: Record<string, string>;
};

export type DesignTokens = typeof tokens;
export type ColorTokens = DesignTokens['color'];
export type TypographyTokens = DesignTokens['typography'];
export type SpacingTokens = DesignTokens['spacing'];
export type RadiusTokens = DesignTokens['radius'];
export type ShadowTokens = DesignTokens['shadow'];
export type MotionTokens = DesignTokens['motion'];

declare const rnTokens: {
  colors: ColorTokens;
  typography: TypographyTokens & { sizePx: Record<string, number> };
  spacingPx: Record<string, number>;
  radiusPx: Record<string, number>;
};

export { tokens, rnTokens };
