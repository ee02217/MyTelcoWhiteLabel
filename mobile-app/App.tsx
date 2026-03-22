import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Typography } from './src/design-system';
import { CatalogPanel } from './src/features/catalog/CatalogPanel';
import { TroubleshootingPanel } from './src/features/troubleshooting/TroubleshootingPanel';
import { SupportCasesPanel } from './src/features/support/SupportCasesPanel';
import { NotificationCenterPanel } from './src/features/notifications/NotificationCenterPanel';
import { FamilyControlsPanel } from './src/features/family-controls';
import { DevicePanel } from './src/features/device';
import { StatusPanel } from './src/features/status';
import { TravelPanel } from './src/features/travel';
import { SettingsPanel } from './src/features/settings';
import { ProfilePanel } from './src/features/profile';
import { BillingPanel } from './src/features/billing';
import { LinesPanel } from './src/features/lines';
import { useLocalization } from './src/features/i18n';
import { useExperiments } from './src/features/experiment';
import { rnTokens } from '../platform-config/design-system/tokens';

WebBrowser.maybeCompleteAuthSession();

type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

type AccountOverview = { plan: string; activeLineCount: number; outstandingAmount: number };
type PaymentMethodResponse = { paymentMethodId: string; token: string; status: string };
type CheckoutResponse = {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  idempotencyKey: string;
};
type PaymentHistoryItem = {
  paymentId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  methodSummary: string;
  status: 'SUCCESS' | 'FAILED';
  referenceId: string;
};
type PaymentHistoryResponse = { months: number; payments: PaymentHistoryItem[] };
type PaymentRetryResponse = {
  paymentId: string;
  status: string;
  outcome: string;
  idempotencyKey: string;
};

type CustomerOrderResponse = {
  orderId: string;
  lineId: string;
  itemType: string;
  itemCode: string;
  idempotencyKey: string;
  state: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rollbackApplied: boolean;
  notificationMessage: string;
};

type AlertInboxItem = {
  id: string;
  service: string;
  lineId: string;
  message: string;
  createdAt: string;
};

type StepUpAction = 'SIM_BLOCK' | 'SIM_UNBLOCK';
type StepUpChallengeResponse = { challengeId: string; maskedDestination: string };
type StepUpVerifyResponse = { verificationToken: string };
type SimActionResponse = {
  previousStatus: 'ACTIVE' | 'BLOCKED';
  currentStatus: 'ACTIVE' | 'BLOCKED';
};
type EsimActivationResponse = {
  qrReference: string;
  status: 'QR_GENERATED' | 'ACTIVATION_IN_PROGRESS' | 'ACTIVATED';
};
type RoamingPack = { packId: string; name: string };
type RoamingPurchaseResponse = { packId: string; updatedAllowanceGb: number; validUntil: string };

const issuer = process.env.OIDC_ISSUER || 'http://localhost:8080/realms/mytelco-white-label';
const clientId = process.env.OIDC_CLIENT_ID || 'mobile-app';
const scopes = (process.env.OIDC_SCOPES || 'openid roles').split(' ');
const apiBase = process.env.CUSTOMER_BFF_BASE_URL || 'http://localhost:8081';
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mytelco', path: 'oauth/callback' });

const TOKEN_KEY = 'mobile_oidc_tokens';

export default function App() {
  const [tokens, setTokens] = useState<TokenSet | null>(null);
  const [status, setStatus] = useState('Idle');
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('No payment attempt yet');
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState('History not loaded yet');
  const [order, setOrder] = useState<CustomerOrderResponse | null>(null);
  const [orderStatus, setOrderStatus] = useState('No order submitted yet');
  const [orderAlerts, setOrderAlerts] = useState<AlertInboxItem[]>([]);

  const [simStatus, setSimStatus] = useState('SIM flow idle');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [stepUpToken, setStepUpToken] = useState<string | null>(null);
  const [esimStatus, setEsimStatus] = useState<EsimActivationResponse | null>(null);
  const [roamingPacks, setRoamingPacks] = useState<RoamingPack[]>([]);
  const [roamingStatus, setRoamingStatus] = useState('Roaming flow idle');

  const discovery = useMemo(
    () => ({
      authorizationEndpoint: `${issuer}/protocol/openid-connect/auth`,
      tokenEndpoint: `${issuer}/protocol/openid-connect/token`,
      revocationEndpoint: `${issuer}/protocol/openid-connect/revoke`,
      endSessionEndpoint: `${issuer}/protocol/openid-connect/logout`,
    }),
    []
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      responseType: AuthSession.ResponseType.Code,
      scopes,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((raw) => {
      if (raw) setTokens(JSON.parse(raw) as TokenSet);
    });
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return;

    AuthSession.exchangeCodeAsync(
      {
        code: response.params.code,
        clientId,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery
    )
      .then(async (result) => {
        const session: TokenSet = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          idToken: result.idToken,
          expiresAt: Math.floor(Date.now() / 1000) + (result.expiresIn || 300),
        };
        setTokens(session);
        await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(session));
        setStatus('Mobile login completed via auth code + PKCE');
      })
      .catch(() => setStatus('Token exchange failed'));
  }, [response, request?.codeVerifier]);

  const authedFetch = async (path: string, init: RequestInit = {}) => {
    if (!tokens?.accessToken) {
      throw new Error('No access token');
    }
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    if (!res.ok) throw new Error(`API failed (${res.status})`);
    return res;
  };

  const callProtected = async () => {
    if (!tokens?.accessToken) {
      setStatus('No access token (protected call blocked)');
      return;
    }
    const res = await fetch(`${apiBase}/api/v1/customer/account-overview`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (res.status === 401) {
      setStatus('401 evidence captured');
      return;
    }
    if (res.status === 403) {
      setStatus('403 evidence captured');
      return;
    }
    if (!res.ok) {
      setStatus(`Protected API failure (${res.status})`);
      return;
    }
    const payload = (await res.json()) as AccountOverview;
    setOverview(payload);
    setStatus('Protected API success (200)');
  };

  const registerPaymentMethod = async () => {
    if (!tokens?.accessToken) {
      setPaymentStatus('Login required');
      return;
    }
    const res = await fetch(`${apiBase}/api/v1/customer/payments/methods`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardHolder: 'Mobile Demo User',
        cardLast4: '1111',
        cardBrand: 'VISA',
        expiry: '11/30',
      }),
    });
    if (!res.ok) {
      setPaymentStatus(`Payment method registration failed (${res.status})`);
      return;
    }
    const payload = (await res.json()) as PaymentMethodResponse;
    setPaymentToken(payload.token);
    setPaymentStatus(`Payment method registered (${payload.status})`);
  };

  const checkout = async (idempotencyKey: string, forceFailure = false) => {
    if (!tokens?.accessToken) {
      setPaymentStatus('Login required');
      return;
    }
    if (!paymentToken) {
      setPaymentStatus('Register payment method first');
      return;
    }

    const res = await fetch(`${apiBase}/api/v1/customer/payments/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        paymentMethodToken: paymentToken,
        amount: forceFailure ? 999.99 : 15.5,
        currency: 'EUR',
        billReference: forceFailure ? 'FAIL' : 'INV-35-MOBILE',
      }),
    });

    if (!res.ok) {
      setPaymentStatus(`Checkout failed (${res.status})`);
      return;
    }

    const payload = (await res.json()) as CheckoutResponse;
    setPaymentStatus(`${payload.status}: ${payload.message} (${payload.transactionId})`);
  };

  const loadPaymentHistory = async () => {
    try {
      const res = await authedFetch('/api/v1/customer/payments/history?months=12');
      const payload = (await res.json()) as PaymentHistoryResponse;
      setHistory(payload.payments);
      setHistoryStatus(`Loaded ${payload.payments.length} payments from ${payload.months} months`);
    } catch (err) {
      setHistoryStatus(err instanceof Error ? err.message : 'Failed to load payment history');
    }
  };

  const shareReceipt = async (paymentId: string) => {
    try {
      if (!tokens?.accessToken) {
        setHistoryStatus('Login required');
        return;
      }
      const fileSystemWithCompatPaths = FileSystem as unknown as {
        cacheDirectory?: string | null;
        Paths?: { cache?: { uri?: string } };
      };
      const cacheDir =
        fileSystemWithCompatPaths.cacheDirectory ??
        `${fileSystemWithCompatPaths.Paths?.cache?.uri || 'file:///tmp/'}`;
      const fileUri = `${cacheDir}receipt-${paymentId}.pdf`;
      await FileSystem.downloadAsync(
        `${apiBase}/api/v1/customer/payments/receipt/${paymentId}/download`,
        fileUri,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        setHistoryStatus(`Receipt shared for ${paymentId}`);
      } else {
        setHistoryStatus('Sharing unavailable on this device');
      }
    } catch (err) {
      setHistoryStatus(err instanceof Error ? err.message : 'Receipt share failed');
    }
  };

  const retryFailedPayment = async (paymentId: string) => {
    try {
      const res = await authedFetch(`/api/v1/customer/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: { 'Idempotency-Key': `mobile-retry-${paymentId}` },
      });
      const payload = (await res.json()) as PaymentRetryResponse;
      setHistoryStatus(`${payload.status}: ${payload.outcome}`);
      await loadPaymentHistory();
    } catch (err) {
      setHistoryStatus(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  const submitOrder = async (simulateFailure = false) => {
    try {
      const idempotencyKey = simulateFailure ? 'mobile-order-fail-38' : 'mobile-order-success-38';
      const res = await authedFetch('/api/v1/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          lineId: 'line-mobile-1',
          itemType: 'PLAN',
          itemCode: simulateFailure ? 'FAIL' : 'PLAN-L',
          simulateFailure,
        }),
      });
      const payload = (await res.json()) as CustomerOrderResponse;
      setOrder(payload);
      setOrderStatus(`Order ${payload.orderId} is ${payload.state}`);
      await loadOrderAlerts();
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : 'Order submission failed');
    }
  };

  const refreshOrder = async () => {
    if (!order?.orderId) {
      setOrderStatus('Submit an order first');
      return;
    }
    try {
      const res = await authedFetch(`/api/v1/customer/orders/${order.orderId}`);
      const payload = (await res.json()) as CustomerOrderResponse;
      setOrder(payload);
      setOrderStatus(`Order ${payload.orderId} is ${payload.state}`);
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : 'Order refresh failed');
    }
  };

  const issueStepUpChallenge = async (action: StepUpAction) => {
    const res = await authedFetch('/api/v1/customer/step-up/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId: 'line-mobile-1', action }),
    });
    const payload = (await res.json()) as StepUpChallengeResponse;
    setChallengeId(payload.challengeId);
    setSimStatus(`Challenge sent to ${payload.maskedDestination}`);
  };

  const verifyStepUp = async () => {
    if (!challengeId) return;
    const res = await authedFetch('/api/v1/customer/step-up/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, code: '123456' }),
    });
    const payload = (await res.json()) as StepUpVerifyResponse;
    setStepUpToken(payload.verificationToken);
    setSimStatus('Step-up verified');
  };

  const simAction = async (action: 'block' | 'unblock') => {
    if (!stepUpToken) {
      setSimStatus('Step-up verification required first');
      return;
    }
    const res = await authedFetch(`/api/v1/customer/sim/line-mobile-1/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepUpVerificationToken: stepUpToken, reason: 'self-service' }),
    });
    const payload = (await res.json()) as SimActionResponse;
    setSimStatus(`SIM ${action} success (${payload.previousStatus} -> ${payload.currentStatus})`);
  };

  const activateEsim = async () => {
    const res = await authedFetch('/api/v1/customer/esim/line-mobile-1/activate', {
      method: 'POST',
    });
    setEsimStatus((await res.json()) as EsimActivationResponse);
  };

  const pollEsimStatus = async () => {
    const res = await authedFetch('/api/v1/customer/esim/line-mobile-1/status');
    setEsimStatus((await res.json()) as EsimActivationResponse);
  };

  const loadRoamingPacks = async () => {
    const res = await authedFetch('/api/v1/customer/roaming/packs?country=pt&lineId=line-mobile-1');
    setRoamingPacks((await res.json()) as RoamingPack[]);
  };

  const purchaseRoamingPack = async (packId: string) => {
    const res = await authedFetch('/api/v1/customer/roaming/packs/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId: 'line-mobile-1', country: 'pt', packId }),
    });
    const payload = (await res.json()) as RoamingPurchaseResponse;
    setRoamingStatus(
      `Purchased ${payload.packId}: ${payload.updatedAllowanceGb}GB until ${payload.validUntil}`
    );
  };

  const loadOrderAlerts = async () => {
    try {
      const res = await authedFetch('/api/v1/customer/alerts/inbox');
      const payload = (await res.json()) as AlertInboxItem[];
      setOrderAlerts(payload.filter((item) => item.service === 'ORDER'));
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : 'Failed to load order alerts');
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      loadPaymentHistory().catch(() => undefined);
      loadOrderAlerts().catch(() => undefined);
    } else {
      setHistory([]);
      setOrderAlerts([]);
    }
  }, [tokens?.accessToken]);

  const refresh = async () => {
    if (!tokens?.refreshToken) {
      setStatus('No refresh token available');
      return;
    }
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken: tokens.refreshToken,
      },
      discovery
    );
    const next: TokenSet = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      idToken: refreshed.idToken || tokens.idToken,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expiresIn || 300),
    };
    setTokens(next);
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(next));
    setStatus('Refresh grant succeeded');
  };

  const signOut = async () => {
    const idTokenHint = tokens?.idToken
      ? `&id_token_hint=${encodeURIComponent(tokens.idToken)}`
      : '';
    await AsyncStorage.removeItem(TOKEN_KEY);
    setTokens(null);
    setOverview(null);
    setPaymentToken(null);
    setHistory([]);
    setStatus('Session cleared locally');
    await WebBrowser.openBrowserAsync(
      `${discovery.endSessionEndpoint}?client_id=${encodeURIComponent(clientId)}${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" color="primary">
          MyTelco Mobile OIDC + Payments
        </Typography>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Session</Typography>
          <Typography variant="small" color="secondary">
            {status}
          </Typography>
          <Typography variant="small" color="secondary">
            Redirect URI: {redirectUri}
          </Typography>
          <Button
            title="Login (Auth Code + PKCE)"
            onPress={() => promptAsync()}
            disabled={!request}
          />
          <Button title="Refresh token" onPress={refresh} style={styles.buttonSpacing} />
          <Button title="Logout" onPress={signOut} style={styles.buttonSpacing} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Protected route behavior</Typography>
          <Button title="Call customer protected endpoint" onPress={callProtected} />
          {overview && (
            <>
              <Typography variant="body">Plan: {overview.plan}</Typography>
              <Typography variant="body">Active lines: {overview.activeLineCount}</Typography>
              <Typography variant="body">
                Outstanding: €{overview.outstandingAmount.toFixed(2)}
              </Typography>
            </>
          )}
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Payment journey (Issue #35)</Typography>
          <Typography variant="small" color="secondary">
            {paymentStatus}
          </Typography>
          <Button title="Register payment method" onPress={registerPaymentMethod} />
          <Button
            title="Checkout success"
            onPress={() => checkout('mobile-idem-success-35')}
            style={styles.buttonSpacing}
          />
          <Button
            title="Replay same idempotency key"
            onPress={() => checkout('mobile-idem-success-35')}
            style={styles.buttonSpacing}
          />
          <Button
            title="Checkout failure"
            onPress={() => checkout('mobile-idem-fail-35', true)}
            style={styles.buttonSpacing}
          />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <CatalogPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Payment history (Issue #36)</Typography>
          <Typography variant="small" color="secondary">
            {historyStatus}
          </Typography>
          <Button title="Refresh 12-month history" onPress={() => loadPaymentHistory()} />
          {history.map((item) => (
            <Card key={item.paymentId} padding="sm" shadow="sm" style={styles.innerCard}>
              <Typography variant="body">
                {new Date(item.paymentDate).toLocaleDateString()} — {item.methodSummary}
              </Typography>
              <Typography variant="small" color="secondary">
                {item.status} — {item.currency} {item.amount.toFixed(2)}
              </Typography>
              <Button
                title="Download/Share receipt"
                onPress={() => shareReceipt(item.paymentId)}
                style={styles.buttonSpacing}
              />
              {item.status === 'FAILED' && (
                <Button
                  title="Retry failed payment"
                  onPress={() => retryFailedPayment(item.paymentId)}
                  style={styles.buttonSpacing}
                />
              )}
            </Card>
          ))}
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Order orchestration (Issue #38)</Typography>
          <Typography variant="small" color="secondary">
            {orderStatus}
          </Typography>
          <Button title="Submit sample plan order" onPress={() => submitOrder(false)} />
          <Button
            title="Submit failing order (rollback)"
            onPress={() => submitOrder(true)}
            style={styles.buttonSpacing}
          />
          <Button
            title="Refresh order state"
            onPress={() => refreshOrder()}
            style={styles.buttonSpacing}
          />
          {order && (
            <Typography variant="small" color="secondary">
              {order.orderId} · {order.itemCode} · {order.state} · rollbackApplied=
              {String(order.rollbackApplied)}
            </Typography>
          )}
          {orderAlerts.slice(0, 3).map((alert) => (
            <Typography key={alert.id} variant="small" color="secondary">
              {new Date(alert.createdAt).toLocaleString()}: {alert.message}
            </Typography>
          ))}
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">SIM/eSIM/Roaming (Issue #39)</Typography>
          <Typography variant="small" color="secondary">
            {simStatus}
          </Typography>
          <Button
            title="Issue step-up challenge"
            onPress={() => issueStepUpChallenge('SIM_BLOCK')}
          />
          <Button
            title="Verify challenge (MVP code)"
            onPress={verifyStepUp}
            style={styles.buttonSpacing}
          />
          <Button
            title="Block SIM"
            onPress={() => simAction('block')}
            style={styles.buttonSpacing}
          />
          <Button
            title="Unblock SIM"
            onPress={() => simAction('unblock')}
            style={styles.buttonSpacing}
          />
          <Button title="Activate eSIM" onPress={activateEsim} style={styles.buttonSpacing} />
          <Button title="Poll eSIM status" onPress={pollEsimStatus} style={styles.buttonSpacing} />
          {esimStatus && (
            <Typography variant="small" color="secondary">
              eSIM {esimStatus.status} · QR ref {esimStatus.qrReference}
            </Typography>
          )}
          <Typography variant="small" color="secondary">
            {roamingStatus}
          </Typography>
          <Button
            title="Load PT roaming packs"
            onPress={loadRoamingPacks}
            style={styles.buttonSpacing}
          />
          {roamingPacks.slice(0, 2).map((pack) => (
            <Button
              key={pack.packId}
              title={`Buy ${pack.name}`}
              onPress={() => purchaseRoamingPack(pack.packId)}
              style={styles.buttonSpacing}
            />
          ))}
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <NotificationCenterPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <TroubleshootingPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <SupportCasesPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <FamilyControlsPanel />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <DevicePanel />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <StatusPanel />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <TravelPanel />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <LinesPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <BillingPanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <ProfilePanel authedFetch={authedFetch} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <SettingsPanel />
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
  innerCard: { marginTop: rnTokens.spacingPx[2] },
  buttonSpacing: { marginTop: rnTokens.spacingPx[2] },
});
