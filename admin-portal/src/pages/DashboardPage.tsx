import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ContentPanel } from '../features/content/ContentPanel';
import { OffersPanel } from '../features/offers/OffersPanel';
import { OperatorPanel, type OperatorContext } from '../features/operators/OperatorPanel';
import { useSession } from '../layout/AdminLayout';

export function DashboardPage() {
  const { setError, setStatus } = useSession();
  const [operatorCtx, setOperatorCtx] = useState<OperatorContext | null>(null);

  const rightColumn =
    operatorCtx && operatorCtx.profile ? (
      <>
        <ErrorBoundary fallbackTitle="Content panel error">
          <ContentPanel
            operatorId={operatorCtx.operatorId}
            contentItems={operatorCtx.contentItems}
            preferredLocales={operatorCtx.profile.locales}
            onError={setError}
            onStatus={setStatus}
            onDataChanged={() => {}}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Offers panel error">
          <OffersPanel
            operatorId={operatorCtx.operatorId}
            offers={operatorCtx.offers}
            onError={setError}
            onStatus={setStatus}
            onDataChanged={() => {}}
          />
        </ErrorBoundary>
      </>
    ) : null;

  return (
    <ErrorBoundary fallbackTitle="Operator panel error">
      <OperatorPanel
        onOperatorChange={setOperatorCtx}
        onError={setError}
        onStatus={setStatus}
        rightColumn={rightColumn}
      />
    </ErrorBoundary>
  );
}
