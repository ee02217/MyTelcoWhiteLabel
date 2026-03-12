import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking, SafeAreaView, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Button, Card, Typography } from './src/design-system';
import { rnTokens } from '../platform-config/design-system/tokens';

type ThresholdCrossing = {
  lineId: string;
  thresholdPercent: number;
  currentPercent: number;
  crossedAt: string;
};
type UsageResponse = { thresholdCrossings: ThresholdCrossing[] };
type AlertThresholdConfig = { thresholds: number[]; dedupTtlMinutes: number };
type AlertInboxItem = { id: string; channel: string; message: string };
type BillCategory = 'plan' | 'add-ons' | 'overages' | 'taxes';
type BillLineItem = { itemId: string; description: string; amount: number; category: BillCategory };
type BillCategoryGroup = { category: BillCategory; items: BillLineItem[]; total: number };
type BillExplorer = {
  period: string;
  groupedLineItems: BillCategoryGroup[];
  grandTotal: number;
  comparison: {
    previous: { period: string; grandTotal: number };
    deltaAbsolute: number;
    deltaPercentage: number;
  };
  invoice: { invoiceId: string; fileName: string; downloadUrl: string };
};

const fallbackThresholds: AlertThresholdConfig = { thresholds: [80, 100], dedupTtlMinutes: 360 };

export default function App() {
  const [usage, setUsage] = useState<UsageResponse>({ thresholdCrossings: [] });
  const [thresholds, setThresholds] = useState<AlertThresholdConfig>(fallbackThresholds);
  const [inbox, setInbox] = useState<AlertInboxItem[]>([]);
  const [billExplorer, setBillExplorer] = useState<BillExplorer | null>(null);
  const [thresholdInput, setThresholdInput] = useState('80,100');

  const load = async () => {
    const [usageRes, thresholdsRes, inboxRes, billExplorerRes] = await Promise.all([
      fetch('http://localhost:8081/api/v1/customer/usage?view=billing-cycle'),
      fetch('http://localhost:8081/api/v1/customer/alerts/thresholds'),
      fetch('http://localhost:8081/api/v1/customer/alerts/inbox'),
      fetch('http://localhost:8081/api/v1/customer/billing/explorer?period=2026-03'),
    ]);

    if (usageRes.ok) setUsage((await usageRes.json()) as UsageResponse);
    if (thresholdsRes.ok) {
      const payload = (await thresholdsRes.json()) as AlertThresholdConfig;
      setThresholds(payload);
      setThresholdInput(payload.thresholds.join(','));
    }
    if (inboxRes.ok) setInbox((await inboxRes.json()) as AlertInboxItem[]);
    if (billExplorerRes.ok) setBillExplorer((await billExplorerRes.json()) as BillExplorer);
  };

  useEffect(() => {
    load().catch(() => {
      setThresholds(fallbackThresholds);
    });
  }, []);

  const save = async () => {
    const parsed = thresholdInput
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));

    await fetch('http://localhost:8081/api/v1/customer/alerts/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholds: parsed }),
    });

    await load();
  };

  const money = (value: number) => `€${value.toFixed(2)}`;

  const downloadInvoice = async () => {
    if (!billExplorer?.invoice.downloadUrl) return;
    await Linking.openURL(`http://localhost:8081${billExplorer.invoice.downloadUrl}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" color="primary">
          MyTelco Alerts
        </Typography>

        {billExplorer && (
          <>
            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="h4">Bill Explorer ({billExplorer.period})</Typography>
              {billExplorer.groupedLineItems.map((group) => (
                <Typography key={group.category} variant="body">
                  {group.category.toUpperCase()}: {money(group.total)}
                </Typography>
              ))}
              <Typography variant="body">Total: {money(billExplorer.grandTotal)}</Typography>
            </Card>

            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="h4">Period comparison</Typography>
              <Typography variant="body">
                Previous ({billExplorer.comparison.previous.period}):{' '}
                {money(billExplorer.comparison.previous.grandTotal)}
              </Typography>
              <Typography variant="body">
                Delta: {money(billExplorer.comparison.deltaAbsolute)} (
                {billExplorer.comparison.deltaPercentage.toFixed(2)}%)
              </Typography>
            </Card>

            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="h4">Invoice</Typography>
              <Typography variant="small" color="secondary">
                {billExplorer.invoice.fileName}
              </Typography>
              <Button title="Download PDF invoice" size="sm" onPress={downloadInvoice} />
            </Card>
          </>
        )}

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Threshold settings</Typography>
          <Typography variant="small" color="secondary">
            Current: {thresholds.thresholds.join(', ')}%
          </Typography>
          <TextInput style={styles.input} value={thresholdInput} onChangeText={setThresholdInput} />
          <Button title="Save thresholds" size="sm" onPress={save} />
          <Typography variant="small" color="secondary">
            Dedup TTL: {thresholds.dedupTtlMinutes} min
          </Typography>
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Crossing status</Typography>
          {usage.thresholdCrossings.length ? (
            usage.thresholdCrossings.map((crossing) => (
              <Typography
                key={`${crossing.lineId}-${crossing.thresholdPercent}-${crossing.crossedAt}`}
                variant="body"
              >
                {crossing.lineId}: {crossing.thresholdPercent}% (
                {crossing.currentPercent.toFixed(1)}%)
              </Typography>
            ))
          ) : (
            <Typography variant="small" color="secondary">
              No new crossings.
            </Typography>
          )}
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Alert inbox</Typography>
          {inbox.length ? (
            inbox.map((entry) => (
              <Typography key={entry.id} variant="body">
                [{entry.channel}] {entry.message}
              </Typography>
            ))
          ) : (
            <Typography variant="small" color="secondary">
              No alerts yet.
            </Typography>
          )}
        </Card>

        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rnTokens.colors.semantic.background.primary },
  content: { padding: rnTokens.spacingPx[6] },
  card: { marginTop: rnTokens.spacingPx[4] },
  input: {
    borderWidth: 1,
    borderColor: rnTokens.colors.neutral[300],
    borderRadius: rnTokens.radiusPx.sm,
    padding: rnTokens.spacingPx[2],
    marginVertical: rnTokens.spacingPx[2],
  },
});
