import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary-500)',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--color-secondary-500)',
    color: '#ffffff',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary-500)',
    border: '1px solid var(--color-primary-500)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary-500)',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: 'var(--spacing-1) var(--spacing-3)',
    fontSize: 'var(--font-size-sm)',
  },
  md: {
    padding: 'var(--spacing-2) var(--spacing-4)',
    fontSize: 'var(--font-size-base)',
  },
  lg: {
    padding: 'var(--spacing-3) var(--spacing-6)',
    fontSize: 'var(--font-size-lg)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  children,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    transition: 'all var(--motion-duration-normal) var(--motion-easing-ease)',
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button style={{ ...baseStyle, ...style }} {...props}>
      {children}
    </button>
  );
}
