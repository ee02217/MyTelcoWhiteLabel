import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Typography } from './src/design-system';
import { rnTokens } from '../platform-config/design-system/tokens';

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

export default function App() {
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [view, setView] = useState<'daily' | 'billing-cycle'>('daily');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [overviewResponse, usageResponse] = await Promise.all([
          fetch('http://localhost:8081/api/v1/customer/account-overview'),
          fetch(`http://localhost:8081/api/v1/customer/usage?view=${view}`),
        ]);

        if (!overviewResponse.ok || !usageResponse.ok) throw new Error('Failed to load usage payload');

        if (active) {
          setOverview((await overviewResponse.json()) as AccountOverview);
          setUsage((await usageResponse.json()) as UsageResponse);
        }
      } catch (err) {
        if (active) {
          setOverview(fallbackOverview);
          setUsage({ ...fallbackUsage, view });
          setError(err instanceof Error ? `${err.message}. Using local fallback payload.` : 'Using local fallback payload.');
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [view]);

  const formattedAmount = useMemo(() => `€${(overview?.outstandingAmount ?? 0).toFixed(2)}`, [overview]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" color="primary">MyTelco</Typography>
          <Typography variant="body" color="secondary">Usage overview</Typography>
        </View>

        <Card padding="sm" shadow="sm" style={styles.card}>
          <Typography variant="small">View mode</Typography>
          <View style={styles.row}>
            <Button title="Daily" size="sm" variant={view === 'daily' ? 'primary' : 'outline'} onPress={() => setView('daily')} />
            <Button title="Billing cycle" size="sm" variant={view === 'billing-cycle' ? 'primary' : 'outline'} onPress={() => setView('billing-cycle')} />
          </View>
        </Card>

        {overview && (
          <Card padding="md" shadow="md" style={styles.card}>
            <Typography variant="small" color="secondary">Plan</Typography>
            <Typography variant="h3">{overview.plan}</Typography>
            <Typography variant="small" color="secondary">Outstanding {formattedAmount}</Typography>
          </Card>
        )}

        {usage && (
          <>
            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="small" color="secondary">Period</Typography>
              <Typography variant="body">{usage.periodStart} → {usage.periodEnd}</Typography>
              <Typography variant="small" color="secondary">{usage.dataFreshness.sla}</Typography>
            </Card>
            <Card padding="md" shadow="sm" style={styles.card}>
              <Typography variant="h4">Totals</Typography>
              <Typography variant="body">Data {usage.totals.dataMb} MB</Typography>
              <Typography variant="body">Voice {usage.totals.voiceMinutes} min</Typography>
              <Typography variant="body">SMS {usage.totals.smsCount}</Typography>
            </Card>
            {usage.lines.map((line) => (
              <Card key={line.lineId} padding="md" shadow="sm" style={styles.card}>
                <Typography variant="body">{line.nickname} · {line.msisdn}</Typography>
                <Typography variant="small" color="secondary">Data {line.usage.dataMb} MB · Voice {line.usage.voiceMinutes} min · SMS {line.usage.smsCount}</Typography>
              </Card>
            ))}
          </>
        )}

        {error && <Typography variant="small" color="secondary" style={styles.warning}>{error}</Typography>}
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rnTokens.colors.semantic.background.primary },
  content: { padding: rnTokens.spacingPx[6] },
  header: { marginBottom: rnTokens.spacingPx[6], alignItems: 'center' },
  card: { marginBottom: rnTokens.spacingPx[4] },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rnTokens.spacingPx[2] },
  warning: { marginTop: rnTokens.spacingPx[2] },
});
