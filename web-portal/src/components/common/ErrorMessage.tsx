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
    <div className="card bg-error-light" style={{ textAlign: 'center', borderColor: '#fecaca' }}>
      <Typography variant="h4" style={{ color: 'var(--premium-error)', marginBottom: '8px' }}>
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
    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
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
    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Typography variant="h3" style={{ marginBottom: '8px' }}>
        Access Required
      </Typography>
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  );
}
