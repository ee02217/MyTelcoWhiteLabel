import { useEffect, useMemo, useState } from 'react';
import tokens from '../../platform-config/design-system/tokens.json';
import { Card, Typography, DesignSystemProvider, Button } from './design-system';

type ActiveLine = { lineId: string; msisdn: string; nickname: string; status: string };
type ServiceUsageBreakdown = { dataMb: number; voiceMinutes: number; smsCount: number };
type LineUsageEntry = {
  lineId: string;
  msisdn: string;
  nickname: string;
  usage: ServiceUsageBreakdown;
};
type ThresholdCrossing = {
  lineId: string;
  service: string;
  thresholdPercent: number;
  currentPercent: number;
  crossedAt: string;
};
type UsageResponse = {
  view: 'daily' | 'billing-cycle';
  periodStart: string;
  periodEnd: string;
  totals: ServiceUsageBreakdown;
  lines: LineUsageEntry[];
  thresholdCrossings: ThresholdCrossing[];
  dataFreshness: { asOf: string; sla: string };
};
type AlertThresholdConfig = {
  thresholds: number[];
  dedupTtlMinutes: number;
  updatedAt: string;
  updatedBy: string;
};
type AlertInboxItem = {
  id: string;
  lineId: string;
  thresholdPercent: number;
  currentPercent: number;
  channel: string;
  message: string;
  createdAt: string;
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

type BillCategory = 'plan' | 'add-ons' | 'overages' | 'taxes';
type BillLineItem = { itemId: string; description: string; amount: number; category: BillCategory };
type BillCategoryGroup = { category: BillCategory; items: BillLineItem[]; total: number };
type BillExplorer = {
  period: string;
  groupedLineItems: BillCategoryGroup[];
  totalsByCategory: Record<BillCategory, number>;
  grandTotal: number;
  comparison: {
    previous: { period: string; grandTotal: number };
    deltaAbsolute: number;
    deltaPercentage: number;
  };
  invoice: { invoiceId: string; fileName: string; downloadUrl: string };
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
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [thresholds, setThresholds] = useState<AlertThresholdConfig | null>(null);
  const [inbox, setInbox] = useState<AlertInboxItem[]>([]);
  const [billExplorer, setBillExplorer] = useState<BillExplorer | null>(null);
  const [thresholdInput, setThresholdInput] = useState('80,100');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [overviewRes, usageRes, thresholdRes, inboxRes, billExplorerRes] = await Promise.all([
      fetch('/api/v1/customer/account-overview'),
      fetch('/api/v1/customer/usage?view=billing-cycle'),
      fetch('/api/v1/customer/alerts/thresholds'),
      fetch('/api/v1/customer/alerts/inbox'),
      fetch('/api/v1/customer/billing/explorer?period=2026-03'),
    ]);

    if (
      !overviewRes.ok ||
      !usageRes.ok ||
      !thresholdRes.ok ||
      !inboxRes.ok ||
      !billExplorerRes.ok
    ) {
      throw new Error('One or more API requests failed');
    }

    const [overviewData, usageData, thresholdData, inboxData, billExplorerData] = await Promise.all([
      overviewRes.json(),
      usageRes.json(),
      thresholdRes.json(),
      inboxRes.json(),
      billExplorerRes.json(),
    ]);

    setOverview(overviewData as AccountOverview);
    setUsage(usageData as UsageResponse);
    setBillExplorer(billExplorerData as BillExplorer);
    const thresholdPayload = thresholdData as AlertThresholdConfig;
    setThresholds(thresholdPayload);
    setThresholdInput(thresholdPayload.thresholds.join(','));
    setInbox(inboxData as AlertInboxItem[]);
  };

  useEffect(() => {
    load().catch((err) => {
      setOverview(fallbackOverview);
      setError(
        err instanceof Error
          ? `${err.message}. Using fallback account data.`
          : 'Using fallback account data.'
      );
    });
  }, []);

  const saveThresholds = async () => {
    const parsed = thresholdInput
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item));

    const response = await fetch('/api/v1/customer/alerts/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholds: parsed }),
    });

    if (!response.ok) {
      setError('Failed to update threshold config');
      return;
    }

    await load();
  };

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(
        overview?.outstandingAmount ?? 0
      ),
    [overview]
  );

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(value);

  const downloadInvoice = () => {
    if (billExplorer?.invoice.downloadUrl) {
      window.open(billExplorer.invoice.downloadUrl, '_blank');
    }
  };

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <h1 style={styles.title}>MyTelco Alerts Dashboard</h1>
        {overview && (
          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Plan: {overview.plan}</Typography>
            <Typography variant="body">Outstanding: {formattedAmount}</Typography>
            <Typography variant="body">Lines: {overview.activeLineCount}</Typography>
          </Card>
        )}

        {billExplorer && (
          <>
            <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
              <Typography variant="h4" color="primary">
                Bill Explorer ({billExplorer.period})
              </Typography>
              {billExplorer.groupedLineItems.map((group) => (
                <div key={group.category} style={{ marginTop: 8 }}>
                  <Typography variant="body">
                    {group.category.toUpperCase()}: {formatMoney(group.total)}
                  </Typography>
                  {group.items.map((item) => (
                    <Typography key={item.itemId} variant="small" color="secondary">
                      • {item.description}: {formatMoney(item.amount)}
                    </Typography>
                  ))}
                </div>
              ))}
              <Typography variant="h4" style={{ marginTop: 8 }}>
                Total: {formatMoney(billExplorer.grandTotal)}
              </Typography>
            </Card>

            <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
              <Typography variant="h4" color="primary">
                Period comparison
              </Typography>
              <Typography variant="body">
                Previous ({billExplorer.comparison.previous.period}):{' '}
                {formatMoney(billExplorer.comparison.previous.grandTotal)}
              </Typography>
              <Typography variant="body">
                Delta: {formatMoney(billExplorer.comparison.deltaAbsolute)} (
                {billExplorer.comparison.deltaPercentage.toFixed(2)}%)
              </Typography>
            </Card>

            <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
              <Typography variant="h4" color="primary">
                Invoice
              </Typography>
              <Typography variant="small" color="secondary">
                {billExplorer.invoice.fileName}
              </Typography>
              <Button onClick={downloadInvoice} size="sm">
                Download PDF invoice
              </Button>
            </Card>
          </>
        )}

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4" color="primary">
            Threshold settings
          </Typography>
          <Typography variant="small" color="secondary">
            Comma-separated values (e.g., 80,100)
          </Typography>
          <input
            style={styles.input}
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
          <Button onClick={saveThresholds} size="sm">
            Save thresholds
          </Button>
          {thresholds && (
            <Typography variant="small" color="secondary">
              Dedup TTL: {thresholds.dedupTtlMinutes} minutes
            </Typography>
          )}
        </Card>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4" color="primary">
            Threshold crossing status
          </Typography>
          {usage?.thresholdCrossings?.length ? (
            usage.thresholdCrossings.map((crossing) => (
              <Typography
                key={`${crossing.lineId}-${crossing.thresholdPercent}-${crossing.crossedAt}`}
                variant="body"
              >
                {crossing.lineId}: crossed {crossing.thresholdPercent}% (
                {crossing.currentPercent.toFixed(1)}%)
              </Typography>
            ))
          ) : (
            <Typography variant="small" color="secondary">
              No new crossings in current dedup window.
            </Typography>
          )}
        </Card>

        <Card padding="md" shadow="md">
          <Typography variant="h4" color="primary">
            In-app alert inbox
          </Typography>
          {inbox.length ? (
            inbox.map((item) => (
              <Typography key={item.id} variant="body">
                [{item.channel}] {item.message}
              </Typography>
            ))
          ) : (
            <Typography variant="small" color="secondary">
              No alerts yet.
            </Typography>
          )}
        </Card>

        {error && <p style={styles.warning}>{error}</p>}
      </div>
    </DesignSystemProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', maxWidth: 900, margin: '0 auto', padding: 20 },
  title: { fontSize: 28, color: tokens.color.primary[500] },
  input: { width: '100%', margin: '8px 0 12px 0', padding: 8 },
  warning: { marginTop: 16, color: tokens.color.warning[500] },
};

export default App;
