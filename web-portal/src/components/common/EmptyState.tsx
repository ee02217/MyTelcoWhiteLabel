// Empty state component

import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
      {icon && <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <Typography variant="h4" style={{ marginBottom: '8px' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body" color="secondary" style={{ marginBottom: '16px' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
