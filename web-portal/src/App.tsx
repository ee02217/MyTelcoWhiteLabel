import { useEffect, useMemo, useState } from 'react';
import tokens from '../../platform-config/design-system/tokens.json';
import { Card, Typography, DesignSystemProvider } from './design-system';

type ActiveLine = { lineId: string; msisdn: string; nickname: string; status: string };
type ServiceUsageBreakdown = { dataMb: number; voiceMinutes: number; smsCount: number };
type LineUsageEntry = { lineId: string; msisdn: string; nickname: string; usage: ServiceUsageBreakdown };
type UsageResponse = {
  view: 'daily' | 'billing-cycle';
  periodStart: string;
  periodEnd: string;
  totals: ServiceUsageBreakdown;
  lines: LineUsageEntry[];
  dataFreshness: { asOf: string; sla: string };
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

const fallbackUsage: UsageResponse = {
  view: 'daily',
  periodStart: '2026-03-12',
  periodEnd: '2026-03-12',
  totals: { dataMb: 2070, voiceMinutes: 55, smsCount: 13 },
  lines: [
    { lineId: 'LINE-001', msisdn: '+351910000001', nickname: 'Primary', usage: { dataMb: 1250, voiceMinutes: 34, smsCount: 8 } },
    { lineId: 'LINE-002', msisdn: '+351910000002', nickname: 'Family', usage: { dataMb: 820, voiceMinutes: 21, smsCount: 5 } },
  ],
  dataFreshness: { asOf: '2026-03-12T11:55:00Z', sla: 'Updated every 15 minutes (SLA <= 15m)' },
};

function App() {
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [view, setView] = useState<'daily' | 'billing-cycle'>('daily');
  const [lineId, setLineId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [overviewResponse, usageResponse] = await Promise.all([
          fetch('/api/v1/customer/account-overview'),
          fetch(`/api/v1/customer/usage?view=${view}${lineId !== 'ALL' ? `&lineId=${lineId}` : ''}`),
        ]);

        if (!overviewResponse.ok || !usageResponse.ok) {
          throw new Error(`BFF call failed (${overviewResponse.status}/${usageResponse.status})`);
        }

        const overviewPayload = (await overviewResponse.json()) as AccountOverview;
        const usagePayload = (await usageResponse.json()) as UsageResponse;

        if (mounted) {
          setOverview(overviewPayload);
          setUsage(usagePayload);
        }
      } catch (err) {
        if (mounted) {
          setOverview(fallbackOverview);
          setUsage(fallbackUsage);
          setError(err instanceof Error ? `${err.message}. Using fallback data.` : 'Unable to load data. Using fallback data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [view, lineId]);

  const formattedAmount = useMemo(
    () => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(overview?.outstandingAmount ?? 0),
    [overview]
  );

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>MyTelco Account Dashboard</h1>
          <p style={styles.subtitle}>F-05.1 + F-05.2</p>
        </header>
        <main style={styles.main}>
          {loading && <p style={styles.text}>Loading…</p>}
          {!loading && overview && (
            <div style={styles.grid}>
              <Card padding="md" shadow="md"><Typography variant="h4" color="primary">Plan</Typography><Typography variant="h3">{overview.plan}</Typography></Card>
              <Card padding="md" shadow="md"><Typography variant="h4" color="primary">Active lines</Typography><Typography variant="h3">{overview.activeLineCount}</Typography></Card>
              <Card padding="md" shadow="md"><Typography variant="h4" color="primary">Next bill date</Typography><Typography variant="h3">{overview.nextBillDate}</Typography></Card>
              <Card padding="md" shadow="md"><Typography variant="h4" color="primary">Outstanding amount</Typography><Typography variant="h3">{formattedAmount}</Typography></Card>
            </div>
          )}

          {!loading && usage && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Usage details</h2>
              <div style={styles.controls}>
                <label>
                  View:{' '}
                  <select value={view} onChange={(e) => setView(e.target.value as 'daily' | 'billing-cycle')}>
                    <option value="daily">Daily</option>
                    <option value="billing-cycle">Billing cycle</option>
                  </select>
                </label>
                <label>
                  Line:{' '}
                  <select value={lineId} onChange={(e) => setLineId(e.target.value)}>
                    <option value="ALL">All lines</option>
                    {fallbackOverview.activeLines.map((line) => (
                      <option key={line.lineId} value={line.lineId}>{line.nickname}</option>
                    ))}
                  </select>
                </label>
              </div>

              <Card padding="md" shadow="sm" style={{ marginBottom: 12 }}>
                <Typography variant="body">Period: {usage.periodStart} → {usage.periodEnd}</Typography>
                <Typography variant="small" color="secondary">Freshness: {new Date(usage.dataFreshness.asOf).toLocaleString()} · {usage.dataFreshness.sla}</Typography>
              </Card>

              <div style={styles.grid}>
                <Card padding="md" shadow="sm"><Typography variant="small" color="secondary">Data</Typography><Typography variant="h3">{usage.totals.dataMb} MB</Typography></Card>
                <Card padding="md" shadow="sm"><Typography variant="small" color="secondary">Voice</Typography><Typography variant="h3">{usage.totals.voiceMinutes} min</Typography></Card>
                <Card padding="md" shadow="sm"><Typography variant="small" color="secondary">SMS</Typography><Typography variant="h3">{usage.totals.smsCount}</Typography></Card>
              </div>

              {usage.lines.map((line) => (
                <Card key={line.lineId} padding="sm" shadow="sm" style={{ marginTop: 8 }}>
                  <Typography variant="body">{line.nickname} · {line.msisdn}</Typography>
                  <Typography variant="small" color="secondary">Data {line.usage.dataMb} MB · Voice {line.usage.voiceMinutes} min · SMS {line.usage.smsCount}</Typography>
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  section: { marginTop: '20px' },
  sectionTitle: { fontSize: '20px', marginBottom: '12px', color: tokens.color.neutral[800] },
  controls: { display: 'flex', gap: 16, marginBottom: 12 },
  warning: { marginTop: '16px', color: tokens.color.warning[500], fontSize: '13px' },
};

export default App;
