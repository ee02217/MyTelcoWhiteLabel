import { ErrorBoundary } from '../components/ErrorBoundary';
import { AnalyticsPanel } from '../features/analytics/AnalyticsPanel';

export function AnalyticsPage() {
  return (
    <ErrorBoundary fallbackTitle="Analytics error">
      <AnalyticsPanel />
    </ErrorBoundary>
  );
}
