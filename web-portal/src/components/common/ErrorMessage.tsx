// Error message component

import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
      }}
    >
      <Typography variant="h4" style={{ color: '#dc2626', marginBottom: '8px' }}>
        {title}
      </Typography>
      <Typography variant="body" color="secondary" style={{ marginBottom: '16px' }}>
        {message}
      </Typography>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

interface NotFoundProps {
  title?: string;
  message?: string;
}

export function NotFound({
  title = 'Not found',
  message = "We couldn't find what you're looking for.",
}: NotFoundProps) {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" style={{ marginBottom: '8px' }}>
        {title}
      </Typography>
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  );
}

interface UnauthorizedProps {
  message?: string;
}

export function Unauthorized({
  message = 'Please log in to continue.',
}: UnauthorizedProps) {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" style={{ marginBottom: '8px' }}>
        🔒
      </Typography>
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  );
}
