import React from 'react';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
  color?: 'primary' | 'secondary' | 'disabled' | 'inverse';
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  h1: {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 1.4,
  },
  h4: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 1.4,
  },
  body: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 1.5,
  },
  small: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 1.4,
  },
};

const colorStyles: Record<string, string> = {
  primary: 'var(--color-text-primary)',
  secondary: 'var(--color-text-secondary)',
  disabled: 'var(--color-text-disabled)',
  inverse: 'var(--color-text-inverse)',
};

export function Typography({
  children,
  variant = 'body',
  color = 'primary',
  style,
}: TypographyProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-sans)',
    color: colorStyles[color],
    ...variantStyles[variant],
  };

  const Component = variant.startsWith('h') ? variant : 'p';

  return <Component style={{ ...baseStyle, ...style }}>{children}</Component>;
}
