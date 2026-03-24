import React from 'react';
import { Typography } from './Typography';

export interface FieldProps {
  label: string;
  helper?: string;
  required?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Field({ label, helper, required = false, style, children }: FieldProps) {
  return (
    <div role="group" aria-label={label} style={{ display: 'grid', gap: 6, ...style }}>
      <Typography variant="caption" color="secondary" style={{ fontWeight: 600 }}>
        {label}
        {required ? ' *' : ''}
      </Typography>
      {children}
      {helper && (
        <Typography variant="caption" color="secondary">
          {helper}
        </Typography>
      )}
    </div>
  );
}
