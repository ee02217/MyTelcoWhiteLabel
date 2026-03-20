import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  style?: React.CSSProperties;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  neutral: {
    backgroundColor: 'var(--color-neutral-100)',
    color: 'var(--color-neutral-800)',
    border: '1px solid var(--color-border-default)',
  },
  info: {
    backgroundColor: 'rgba(0, 115, 230, 0.10)',
    color: 'var(--color-primary-500)',
    border: '1px solid rgba(0, 115, 230, 0.24)',
  },
  success: {
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
    color: 'var(--color-success-500)',
    border: '1px solid rgba(22, 163, 74, 0.24)',
  },
  warning: {
    backgroundColor: 'rgba(217, 119, 6, 0.10)',
    color: '#b45309',
    border: '1px solid rgba(217, 119, 6, 0.24)',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    color: 'var(--color-error-500)',
    border: '1px solid rgba(239, 68, 68, 0.24)',
  },
};

export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 1,
    padding: '4px 8px',
    ...variantStyles[variant],
  };

  return <span style={{ ...baseStyle, ...style }}>{children}</span>;
}
