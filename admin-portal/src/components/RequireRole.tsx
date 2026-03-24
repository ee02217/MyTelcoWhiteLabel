import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Typography } from '../design-system';

type Props = {
  roles: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function RequireRole({ roles, fallback, children }: Props) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(...roles)) {
    return fallback ? <>{fallback}</> : (
      <Typography variant="small" color="secondary">
        Insufficient permissions.
      </Typography>
    );
  }

  return <>{children}</>;
}
