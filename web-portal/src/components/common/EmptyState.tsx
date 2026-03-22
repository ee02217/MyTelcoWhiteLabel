// Empty state component

import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
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
