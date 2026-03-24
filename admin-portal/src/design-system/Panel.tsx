import React from 'react';
import { Card } from './Card';
import { Typography } from './Typography';

export interface PanelProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Panel({ title, subtitle, actions, children, style }: PanelProps) {
  return (
    <Card padding="md" shadow="md" style={style}>
      <div
        role="region"
        aria-label={title}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="small" color="secondary">
              {subtitle}
            </Typography>
          )}
        </div>
        {actions}
      </div>
      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>{children}</div>
    </Card>
  );
}
