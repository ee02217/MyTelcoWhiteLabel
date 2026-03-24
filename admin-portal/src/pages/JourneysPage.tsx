import { ErrorBoundary } from '../components/ErrorBoundary';
import { JourneysPanel } from '../features/journeys/JourneysPanel';

export function JourneysPage() {
  return (
    <ErrorBoundary fallbackTitle="Journeys error">
      <JourneysPanel />
    </ErrorBoundary>
  );
}
