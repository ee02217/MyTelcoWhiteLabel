import React from 'react';
import { Text, TextStyle } from 'react-native';
import { rnTokens } from '../../../../platform-config/design-system/tokens';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
type TypographyColor = 'primary' | 'secondary' | 'disabled' | 'inverse';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  style?: TextStyle;
}

const variants: Record<TypographyVariant, TextStyle> = {
  h1: { fontSize: rnTokens.typography.sizePx['4xl'], lineHeight: 44, fontWeight: '700' },
  h2: { fontSize: rnTokens.typography.sizePx['3xl'], lineHeight: 38, fontWeight: '700' },
  h3: { fontSize: rnTokens.typography.sizePx['2xl'], lineHeight: 32, fontWeight: '600' },
  h4: { fontSize: rnTokens.typography.sizePx.xl, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: rnTokens.typography.sizePx.base, lineHeight: 24, fontWeight: '400' },
  small: { fontSize: rnTokens.typography.sizePx.sm, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: rnTokens.typography.sizePx.xs, lineHeight: 16, fontWeight: '400' },
};

const colors: Record<TypographyColor, string> = {
  primary: rnTokens.colors.semantic.text.primary,
  secondary: rnTokens.colors.semantic.text.secondary,
  disabled: rnTokens.colors.semantic.text.disabled,
  inverse: rnTokens.colors.semantic.text.inverse,
};

export function Typography({
  children,
  variant = 'body',
  color = 'primary',
  style,
}: TypographyProps) {
  return <Text style={[variants[variant], { color: colors[color] }, style]}>{children}</Text>;
}
