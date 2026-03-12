import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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

const fallbackThresholds: AlertThresholdConfig = { thresholds: [80, 100], dedupTtlMinutes: 360 };

export default function App() {
  const [usage, setUsage] = useState<UsageResponse>({ thresholdCrossings: [] });
  const [thresholds, setThresholds] = useState<AlertThresholdConfig>(fallbackThresholds);
  const [inbox, setInbox] = useState<AlertInboxItem[]>([]);
  const [thresholdInput, setThresholdInput] = useState('80,100');

  const load = async () => {
    const [usageRes, thresholdsRes, inboxRes] = await Promise.all([
      fetch('http://localhost:8081/api/v1/customer/usage?view=billing-cycle'),
      fetch('http://localhost:8081/api/v1/customer/alerts/thresholds'),
      fetch('http://localhost:8081/api/v1/customer/alerts/inbox'),
    ]);

    if (usageRes.ok) setUsage((await usageRes.json()) as UsageResponse);
    if (thresholdsRes.ok) {
      const payload = (await thresholdsRes.json()) as AlertThresholdConfig;
      setThresholds(payload);
      setThresholdInput(payload.thresholds.join(','));
    }
    if (inboxRes.ok) setInbox((await inboxRes.json()) as AlertInboxItem[]);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" color="primary">
          MyTelco Alerts
        </Typography>

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
