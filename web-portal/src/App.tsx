import { useEffect, useMemo, useState } from 'react';
import tokens from '../../platform-config/design-system/tokens.json';
import { Card, Typography, DesignSystemProvider } from './design-system';

type ActiveLine = {
  lineId: string;
  msisdn: string;
  nickname: string;
  status: string;
};

type AccountOverview = {
  plan: string;
  activeLines: ActiveLine[];
  activeLineCount: number;
  nextBillDate: string;
  outstandingAmount: number;
  accountType: string;
  lineStructure: 'SINGLE_LINE' | 'MULTI_LINE_READY';
};

const fallbackOverview: AccountOverview = {
  plan: 'Premium Unlimited',
  activeLines: [
    { lineId: 'LINE-001', msisdn: '+351910000001', nickname: 'Primary', status: 'ACTIVE' },
    { lineId: 'LINE-002', msisdn: '+351910000002', nickname: 'Family', status: 'ACTIVE' },
  ],
  activeLineCount: 2,
  nextBillDate: '2026-03-20',
  outstandingAmount: 24.99,
  accountType: 'POSTPAID',
  lineStructure: 'MULTI_LINE_READY',
};

function App() {
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      try {
        const response = await fetch('/api/v1/customer/account-overview');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as AccountOverview;
        if (mounted) {
          setOverview(payload);
        }
      } catch (err) {
        if (mounted) {
          setOverview(fallbackOverview);
          setError(
            err instanceof Error
              ? `${err.message}. Using local fallback while BFF wiring is in progress.`
              : 'Unable to load account overview. Using local fallback while BFF wiring is in progress.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
      }).format(overview?.outstandingAmount ?? 0),
    [overview]
  );

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>MyTelco Account Dashboard</h1>
          <p style={styles.subtitle}>F-05.1 account overview</p>
        </header>

        <main style={styles.main}>
          {loading && <p style={styles.text}>Loading account overview…</p>}
          {!loading && overview && (
            <div style={styles.grid}>
              <Card padding="md" shadow="md">
                <Typography variant="h4" color="primary">
                  Plan
                </Typography>
                <Typography variant="h3">{overview.plan}</Typography>
              </Card>

              <Card padding="md" shadow="md">
                <Typography variant="h4" color="primary">
                  Active lines
                </Typography>
                <Typography variant="h3">{overview.activeLineCount}</Typography>
                <Typography variant="small" color="secondary">
                  {overview.lineStructure === 'MULTI_LINE_READY'
                    ? 'Multi-line ready account'
                    : 'Single-line account'}
                </Typography>
              </Card>

              <Card padding="md" shadow="md">
                <Typography variant="h4" color="primary">
                  Next bill date
                </Typography>
                <Typography variant="h3">{overview.nextBillDate}</Typography>
              </Card>

              <Card padding="md" shadow="md">
                <Typography variant="h4" color="primary">
                  Outstanding amount
                </Typography>
                <Typography variant="h3">{formattedAmount}</Typography>
              </Card>
            </div>
          )}

          {!loading && overview && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Lines</h2>
              {overview.activeLines.map((line) => (
                <Card key={line.lineId} padding="sm" shadow="sm" style={{ marginBottom: 8 }}>
                  <Typography variant="body">
                    {line.nickname} · {line.msisdn}
                  </Typography>
                  <Typography variant="small" color="secondary">
                    {line.status}
                  </Typography>
                </Card>
              ))}
            </section>
          )}

          {error && <p style={styles.warning}>{error}</p>}
        </main>
      </div>
    </DesignSystemProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', padding: '24px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  title: { fontSize: '32px', fontWeight: '700', color: tokens.color.primary[500] },
  subtitle: { fontSize: '16px', color: tokens.color.neutral[500], marginTop: '4px' },
  main: { maxWidth: '920px', margin: '0 auto' },
  text: { fontSize: '14px', color: tokens.color.neutral[500] },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  section: { marginTop: '20px' },
  sectionTitle: { fontSize: '20px', marginBottom: '12px', color: tokens.color.neutral[800] },
  warning: { marginTop: '16px', color: tokens.color.warning[500], fontSize: '13px' },
};

export default App;
