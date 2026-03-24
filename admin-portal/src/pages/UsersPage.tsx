import { ErrorBoundary } from '../components/ErrorBoundary';
import { RequireRole } from '../components/RequireRole';
import { UsersPanel } from '../features/users/UsersPanel';
import { Panel, Typography } from '../design-system';

export function UsersPage() {
  return (
    <RequireRole
      roles={['ADMIN']}
      fallback={
        <Panel title="User Management">
          <Typography variant="body" color="secondary">
            You need the ADMIN role to access user management.
          </Typography>
        </Panel>
      }
    >
      <ErrorBoundary fallbackTitle="Users error">
        <UsersPanel />
      </ErrorBoundary>
    </RequireRole>
  );
}
