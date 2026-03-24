import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ContentPanel } from '../features/content/ContentPanel';
import { OffersPanel } from '../features/offers/OffersPanel';
import { OperatorPanel, type OperatorContext } from '../features/operators/OperatorPanel';
import { useSession } from '../layout/AdminLayout';
import { styles } from '../shared-styles';

export function DashboardPage() {
  const { setError, setStatus } = useSession();
  const [operatorCtx, setOperatorCtx] = useState<OperatorContext | null>(null);

  return (
    <>
      <ErrorBoundary fallbackTitle="Operator panel error">
        <OperatorPanel
          onOperatorChange={setOperatorCtx}
          onError={setError}
          onStatus={setStatus}
        />
      </ErrorBoundary>

      {operatorCtx && operatorCtx.profile && (
        <div style={styles.twoCols}>
          <div />
          <div />
          <div style={styles.rightColumn}>
            <ErrorBoundary fallbackTitle="Content panel error">
              <ContentPanel
                operatorId={operatorCtx.operatorId}
                contentItems={operatorCtx.contentItems}
                preferredLocales={operatorCtx.profile.locales}
                onError={setError}
                onStatus={setStatus}
                onDataChanged={() => {/* Operator panel handles its own refresh */}}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Offers panel error">
              <OffersPanel
                operatorId={operatorCtx.operatorId}
                offers={operatorCtx.offers}
                onError={setError}
                onStatus={setStatus}
                onDataChanged={() => {/* Operator panel handles its own refresh */}}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </>
  );
}
