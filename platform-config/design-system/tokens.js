const rawTokens = require('./tokens.json');

const remToPx = (value) => {
  if (typeof value !== 'string') return Number(value) || 0;
  if (value.endsWith('rem')) return Number.parseFloat(value) * 16;
  if (value.endsWith('px')) return Number.parseFloat(value);
  return Number.parseFloat(value) || 0;
};

const tokens = rawTokens;

const spacingPx = {};
Object.keys(tokens.spacing).forEach((key) => {
  spacingPx[key] = remToPx(tokens.spacing[key]);
});

const radiusPx = {};
Object.keys(tokens.radius).forEach((key) => {
  radiusPx[key] = remToPx(tokens.radius[key]);
});

const typography = {
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
};

const rnTokens = {
  colors: tokens.color,
  typography,
  spacingPx,
  radiusPx,
};

module.exports = {
  tokens,
  rnTokens,
};
