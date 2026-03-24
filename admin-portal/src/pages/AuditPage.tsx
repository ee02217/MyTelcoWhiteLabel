import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuditPanel } from '../features/audit/AuditPanel';

export function AuditPage() {
  return (
    <ErrorBoundary fallbackTitle="Audit log error">
      <AuditPanel />
    </ErrorBoundary>
  );
}
