import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const paddingStyles: Record<string, string> = {
  none: '0',
  sm: 'var(--spacing-2)',
  md: 'var(--spacing-4)',
  lg: 'var(--spacing-6)',
};

const shadowStyles: Record<string, string> = {
  none: 'none',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
};

export function Card({ children, padding = 'md', shadow = 'md', style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background-primary, #ffffff)',
    borderRadius: 'var(--radius-lg)',
    padding: paddingStyles[padding],
    boxShadow: shadowStyles[shadow],
    border: '1px solid var(--color-border-default)',
    transition: 'box-shadow var(--motion-duration-normal) var(--motion-easing-ease)',
    ...style,
  };

  return <div style={cardStyle}>{children}</div>;
}
