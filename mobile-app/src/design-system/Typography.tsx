import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { tokens } from '../../../../platform-config/design-tokens/tokens';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
type TypographyColor = 'primary' | 'secondary' | 'disabled' | 'inverse';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  style?: TextStyle;
}

const variantStyles: Record<TypographyVariant, TextStyle> = {
  h1: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  h2: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};

const colorValues: Record<TypographyColor, string> = {
  primary: tokens.semantic.text.primary,
  secondary: tokens.semantic.text.secondary,
  disabled: tokens.semantic.text.disabled,
  inverse: tokens.semantic.text.inverse,
};

export function Typography({
  children,
  variant = 'body',
  color = 'primary',
  style,
}: TypographyProps) {
  return (
    <Text style={[variantStyles[variant], { color: colorValues[color] }, style]}>{children}</Text>
  );
}
