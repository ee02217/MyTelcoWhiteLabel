import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Typography } from './src/design-system';
import { rnTokens } from '../platform-config/design-system/tokens';

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

export default function App() {
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/customer/account-overview');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as AccountOverview;
        if (active) {
          setOverview(payload);
        }
      } catch (err) {
        if (active) {
          setOverview(fallbackOverview);
          setError(
            err instanceof Error
              ? `${err.message}. Using local fallback payload.`
              : 'Unable to load account overview. Using local fallback payload.'
          );
        }
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const formattedAmount = useMemo(() => {
    const amount = overview?.outstandingAmount ?? 0;
    return `€${amount.toFixed(2)}`;
  }, [overview]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" color="primary">
            MyTelco
          </Typography>
          <Typography variant="body" color="secondary">
            Account Overview
          </Typography>
        </View>

        {overview && (
          <>
            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="small" color="secondary">
                Plan
              </Typography>
              <Typography variant="h3">{overview.plan}</Typography>
            </Card>

            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="small" color="secondary">
                Active Lines
              </Typography>
              <Typography variant="h3">{overview.activeLineCount}</Typography>
              <Typography variant="small" color="secondary">
                {overview.lineStructure === 'MULTI_LINE_READY'
                  ? 'Multi-line ready account'
                  : 'Single-line account'}
              </Typography>
            </Card>

            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="small" color="secondary">
                Next Bill Date
              </Typography>
              <Typography variant="h3">{overview.nextBillDate}</Typography>
            </Card>

            <Card padding="md" shadow="md" style={styles.card}>
              <Typography variant="small" color="secondary">
                Outstanding Amount
              </Typography>
              <Typography variant="h3">{formattedAmount}</Typography>
            </Card>

            <Card padding="md" shadow="sm" style={styles.card}>
              <Typography variant="h4">Lines</Typography>
              {overview.activeLines.map((line) => (
                <View key={line.lineId} style={styles.lineRow}>
                  <Typography variant="body">
                    {line.nickname} · {line.msisdn}
                  </Typography>
                  <Typography variant="small" color="secondary">
                    {line.status}
                  </Typography>
                </View>
              ))}
            </Card>
          </>
        )}

        {error && (
          <Typography variant="small" color="secondary" style={styles.warning}>
            {error}
          </Typography>
        )}

        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rnTokens.colors.semantic.background.primary,
  },
  content: {
    padding: rnTokens.spacingPx[6],
  },
  header: {
    marginBottom: rnTokens.spacingPx[6],
    alignItems: 'center',
  },
  card: {
    marginBottom: rnTokens.spacingPx[4],
  },
  lineRow: {
    marginTop: rnTokens.spacingPx[2],
  },
  warning: {
    marginTop: rnTokens.spacingPx[2],
  },
});
