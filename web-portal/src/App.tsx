import { useEffect, useMemo, useState } from 'react';
import tokens from '../../platform-config/design-system/tokens.json';
import { Button, Card, DesignSystemProvider, Typography } from './design-system';
import {
  beginLogin,
  completeLoginIfCallback,
  logout,
  readSession,
  refreshSession,
  type OidcSession,
} from './auth-oidc';
import { CatalogPanel } from './features/catalog/CatalogPanel';

type AccountOverview = {
  plan: string;
  activeLineCount: number;
  outstandingAmount: number;
};

type PaymentMethodResponse = {
  paymentMethodId: string;
  token: string;
  status: string;
};

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

type PaymentHistoryResponse = {
  months: number;
  payments: PaymentHistoryItem[];
};

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

const fallbackOverview: AccountOverview = {
  plan: 'Unavailable (login required)',
  activeLineCount: 0,
  outstandingAmount: 0,
};

function App() {
  const [session, setSession] = useState<OidcSession | null>(readSession());
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);

  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('No payment attempt yet');

  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState('History not loaded yet');

  const [order, setOrder] = useState<CustomerOrderResponse | null>(null);
  const [orderStatus, setOrderStatus] = useState('No order submitted yet');
  const [orderAlerts, setOrderAlerts] = useState<AlertInboxItem[]>([]);

  const authedFetch = async (path: string, init: RequestInit = {}) => {
    if (!session?.accessToken) throw new Error('Not authenticated');
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (res.status === 401) {
      setStatus('401 from protected API');
      throw new Error('Unauthorized (401)');
    }
    if (res.status === 403) {
      setStatus('403 from protected API');
      throw new Error('Forbidden (403)');
    }
    if (!res.ok) throw new Error(`API failed with ${res.status}`);
    return res;
  };

  const loadOverview = async () => {
    setError(null);
    try {
      const response = await authedFetch('/api/v1/customer/account-overview');
      setOverview((await response.json()) as AccountOverview);
      setStatus('Protected API call succeeded');
    } catch (err) {
      setOverview(fallbackOverview);
      setError(err instanceof Error ? err.message : 'Failed to load account overview');
    }
  };

  const registerPaymentMethod = async () => {
    setError(null);
    try {
      const response = await authedFetch('/api/v1/customer/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardHolder: 'Demo Customer',
          cardLast4: '4242',
          cardBrand: 'VISA',
          expiry: '12/30',
        }),
      });
      const payload = (await response.json()) as PaymentMethodResponse;
      setPaymentToken(payload.token);
      setPaymentStatus(`Payment method registered (${payload.status})`);
    } catch (err) {
      setPaymentStatus('Payment method registration failed');
      setError(err instanceof Error ? err.message : 'Payment method registration failed');
    }
  };

  const checkout = async (idempotencyKey: string, forceFailure = false) => {
    if (!paymentToken) {
      setPaymentStatus('Register payment method first');
      return;
    }
    setError(null);
    try {
      const response = await authedFetch('/api/v1/customer/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          paymentMethodToken: paymentToken,
          amount: forceFailure ? 999.99 : 39.9,
          currency: 'EUR',
          billReference: forceFailure ? 'FAIL' : 'INV-35',
        }),
      });
      const payload = (await response.json()) as CheckoutResponse;
      setPaymentStatus(
        `${payload.status}: ${payload.message} (tx=${payload.transactionId}, idem=${payload.idempotencyKey})`
      );
    } catch (err) {
      setPaymentStatus('Checkout call failed');
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  const loadPaymentHistory = async () => {
    setError(null);
    try {
      const response = await authedFetch('/api/v1/customer/payments/history?months=12');
      const payload = (await response.json()) as PaymentHistoryResponse;
      setHistory(payload.payments);
      setHistoryStatus(`Loaded ${payload.payments.length} payments from ${payload.months} months`);
    } catch (err) {
      setHistoryStatus('Failed to load payment history');
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    setError(null);
    try {
      const response = await authedFetch(`/api/v1/customer/payments/receipt/${paymentId}/download`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setHistoryStatus(`Receipt downloaded for ${paymentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receipt download failed');
    }
  };

  const retryFailedPayment = async (paymentId: string) => {
    setError(null);
    try {
      const response = await authedFetch(`/api/v1/customer/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: { 'Idempotency-Key': `web-retry-${paymentId}` },
      });
      const payload = (await response.json()) as PaymentRetryResponse;
      setHistoryStatus(`${payload.status}: ${payload.outcome}`);
      await loadPaymentHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  const submitOrder = async (simulateFailure = false) => {
    setError(null);
    try {
      const idempotencyKey = simulateFailure ? 'web-order-fail-38' : 'web-order-success-38';
      const response = await authedFetch('/api/v1/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          lineId: 'line-web-1',
          itemType: 'ADDON',
          itemCode: simulateFailure ? 'FAIL' : 'ADDON-5G',
          simulateFailure,
        }),
      });
      const payload = (await response.json()) as CustomerOrderResponse;
      setOrder(payload);
      setOrderStatus(`Order ${payload.orderId} is ${payload.state}`);
      await loadOrderAlerts();
    } catch (err) {
      setOrderStatus('Order submission failed');
      setError(err instanceof Error ? err.message : 'Order submission failed');
    }
  };

  const refreshOrderStatus = async () => {
    if (!order?.orderId) {
      setOrderStatus('Submit an order first');
      return;
    }
    setError(null);
    try {
      const response = await authedFetch(`/api/v1/customer/orders/${order.orderId}`);
      const payload = (await response.json()) as CustomerOrderResponse;
      setOrder(payload);
      setOrderStatus(`Order ${payload.orderId} is ${payload.state}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh order');
    }
  };

  const loadOrderAlerts = async () => {
    try {
      const response = await authedFetch('/api/v1/customer/alerts/inbox');
      const payload = (await response.json()) as AlertInboxItem[];
      setOrderAlerts(payload.filter((item) => item.service === 'ORDER'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order alerts');
    }
  };

  useEffect(() => {
    completeLoginIfCallback()
      .then((newSession) => {
        if (newSession) {
          setSession(newSession);
          setStatus('Login completed via OIDC code+PKCE');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'OIDC callback failed'));
  }, []);

  useEffect(() => {
    if (session) {
      loadOverview().catch(() => undefined);
      loadPaymentHistory().catch(() => undefined);
      loadOrderAlerts().catch(() => undefined);
    } else {
      setOverview(null);
      setHistory([]);
      setOrderAlerts([]);
    }
  }, [session]);

  const expiresIn = useMemo(() => {
    if (!session) return 'n/a';
    return `${Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))}s`;
  }, [session]);

  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(overview?.outstandingAmount ?? 0);

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <h1 style={styles.title}>MyTelco OIDC + Payment Dashboard</h1>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Session</Typography>
          <Typography variant="small" color="secondary">
            Status: {status}
          </Typography>
          <Typography variant="small" color="secondary">
            Access token expires in: {expiresIn}
          </Typography>
          <div style={styles.row}>
            <Button size="sm" onClick={() => beginLogin().catch((e) => setError(String(e)))}>
              Login (Auth Code + PKCE)
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!session) return;
                refreshSession(session)
                  .then((next) => {
                    setSession(next);
                    setStatus('Refresh token grant succeeded');
                  })
                  .catch((e) => setError(String(e)));
              }}
            >
              Refresh token
            </Button>
            <Button size="sm" onClick={() => logout(session)}>
              Logout
            </Button>
          </div>
        </Card>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Protected route behaviour</Typography>
          <Button size="sm" onClick={() => loadOverview().catch(() => undefined)}>
            Call /api/v1/customer/account-overview
          </Button>
          {overview && (
            <>
              <Typography variant="body">Plan: {overview.plan}</Typography>
              <Typography variant="body">Active lines: {overview.activeLineCount}</Typography>
              <Typography variant="body">Outstanding: {formattedAmount}</Typography>
            </>
          )}
        </Card>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Payment journey (Issue #35)</Typography>
          <Typography variant="small" color="secondary">
            {paymentStatus}
          </Typography>
          <div style={styles.row}>
            <Button size="sm" onClick={() => registerPaymentMethod().catch(() => undefined)}>
              Register payment method
            </Button>
            <Button
              size="sm"
              onClick={() => checkout('web-idem-success-35').catch(() => undefined)}
              disabled={!paymentToken}
            >
              Checkout success
            </Button>
            <Button
              size="sm"
              onClick={() => checkout('web-idem-success-35').catch(() => undefined)}
              disabled={!paymentToken}
            >
              Replay same idempotency key
            </Button>
            <Button
              size="sm"
              onClick={() => checkout('web-idem-fail-35', true).catch(() => undefined)}
              disabled={!paymentToken}
            >
              Checkout failure
            </Button>
          </div>
        </Card>

        <CatalogPanel authedFetch={authedFetch} />

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Payment history (Issue #36)</Typography>
          <Typography variant="small" color="secondary">
            {historyStatus}
          </Typography>
          <Button size="sm" onClick={() => loadPaymentHistory().catch(() => undefined)}>
            Refresh 12-month history
          </Button>
          {history.map((item) => (
            <div key={item.paymentId} style={{ marginTop: 12 }}>
              <Typography variant="body">
                {new Date(item.paymentDate).toLocaleDateString()} — {item.methodSummary} —{' '}
                {item.status} —{' '}
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: item.currency,
                }).format(item.amount)}
              </Typography>
              <div style={styles.row}>
                <Button
                  size="sm"
                  onClick={() => downloadReceipt(item.paymentId).catch(() => undefined)}
                >
                  Download receipt
                </Button>
                {item.status === 'FAILED' && (
                  <Button
                    size="sm"
                    onClick={() => retryFailedPayment(item.paymentId).catch(() => undefined)}
                  >
                    Retry failed payment
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Order orchestration (Issue #38)</Typography>
          <Typography variant="small" color="secondary">
            {orderStatus}
          </Typography>
          <div style={styles.row}>
            <Button size="sm" onClick={() => submitOrder(false).catch(() => undefined)}>
              Submit sample add-on order
            </Button>
            <Button size="sm" onClick={() => submitOrder(true).catch(() => undefined)}>
              Submit failing order (rollback)
            </Button>
            <Button size="sm" onClick={() => refreshOrderStatus().catch(() => undefined)}>
              Refresh order state
            </Button>
          </div>
          {order && (
            <Typography variant="body" style={{ marginTop: 8 }}>
              {order.orderId} · {order.itemCode} · {order.state} · rollbackApplied=
              {String(order.rollbackApplied)}
            </Typography>
          )}
          {orderAlerts.slice(0, 3).map((alert) => (
            <Typography key={alert.id} variant="small" color="secondary" style={{ marginTop: 8 }}>
              {new Date(alert.createdAt).toLocaleString()}: {alert.message}
            </Typography>
          ))}
        </Card>

        {error && <p style={styles.warning}>{error}</p>}
      </div>
    </DesignSystemProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', maxWidth: 900, margin: '0 auto', padding: 20 },
  row: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  title: { fontSize: 28, color: tokens.color.primary[500] },
  warning: { marginTop: 16, color: tokens.color.warning[500] },
};

export default App;
