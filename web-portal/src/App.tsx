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
import { FamilyRolesPanel } from './features/family/FamilyRolesPanel';
import { TroubleshootingPanel } from './features/troubleshooting/TroubleshootingPanel';
import { SupportCasesPanel } from './features/support/SupportCasesPanel';
import { NotificationCenterPanel } from './features/notifications/NotificationCenterPanel';

type AccountOverview = {
  plan: string;
  activeLineCount: number;
  outstandingAmount: number;
  nextBillDate?: string;
  accountType?: string;
};

type HomeDashboardResponse = {
  accountSummary: {
    accountStatus: string;
    planName: string;
    primaryMsisdn: string;
  };
  usageSummary: {
    dataUsedMb: number;
    dataLimitMb: number;
    voiceMinutesUsed: number;
    voiceMinutesLimit: number;
    smsUsed: number;
    smsLimit: number;
    dataUsagePercent: number;
    voiceUsagePercent: number;
    smsUsagePercent: number;
  };
  billingSummary: {
    currentBalance: number;
    lastPaymentAmount: number;
    lastPaymentDate: string;
    nextPaymentDueDate: string;
    paymentMethod: string;
    autoPayEnabled: boolean;
  };
  responseTime: string;
};

type HomeNotificationItem = {
  notificationId: string;
  readAt: string | null;
};

type HomeSupportCase = {
  caseId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
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

type StepUpAction = 'SIM_BLOCK' | 'SIM_UNBLOCK';

type StepUpChallengeResponse = {
  challengeId: string;
  lineId: string;
  action: StepUpAction;
  expiresAt: string;
  maskedDestination: string;
  message: string;
};

type StepUpVerifyResponse = {
  verificationToken: string;
  expiresAt: string;
  message: string;
};

type SimActionResponse = {
  lineId: string;
  previousStatus: 'ACTIVE' | 'BLOCKED';
  currentStatus: 'ACTIVE' | 'BLOCKED';
  changedAt: string;
  message: string;
};

type EsimActivationResponse = {
  lineId: string;
  activationId: string;
  qrPayload: string;
  qrReference: string;
  status: 'QR_GENERATED' | 'ACTIVATION_IN_PROGRESS' | 'ACTIVATED';
  updatedAt: string;
};

type RoamingPack = {
  packId: string;
  country: string;
  name: string;
  allowanceGb: number;
  validityDays: number;
  price: number;
  currency: string;
};

type RoamingPurchaseResponse = {
  lineId: string;
  country: string;
  packId: string;
  updatedAllowanceGb: number;
  validFrom: string;
  validUntil: string;
  status: string;
};

type AppRoute = 'home' | 'lab';
type AccountLoadState = 'idle' | 'loading' | 'ready' | 'auth-error' | 'api-error';

const routeFromPath = (pathname: string): AppRoute => {
  if (pathname === '/lab' || pathname.startsWith('/lab/')) return 'lab';
  return 'home';
};

const parseJwtRoles = (accessToken: string | undefined) => {
  if (!accessToken) return [] as string[];
  try {
    const payload = accessToken.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
    const roles = claims?.realm_access?.roles;
    return Array.isArray(roles)
      ? roles.filter((role): role is string => typeof role === 'string')
      : [];
  } catch {
    return [] as string[];
  }
};

const isAuthError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes('Unauthorized') || error.message.includes('Forbidden'));

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function App() {
  const [session, setSession] = useState<OidcSession | null>(readSession());
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname));
  const [homeDashboard, setHomeDashboard] = useState<HomeDashboardResponse | null>(null);
  const [homeUnreadNotifications, setHomeUnreadNotifications] = useState(0);
  const [homeOpenSupportCases, setHomeOpenSupportCases] = useState(0);
  const [homeWaitingSupportCases, setHomeWaitingSupportCases] = useState(0);
  const [accountLoadState, setAccountLoadState] = useState<AccountLoadState>('idle');
  const [accountLoadMessage, setAccountLoadMessage] = useState<string | null>(null);

  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('No payment attempt yet');

  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState('History not loaded yet');

  const [order, setOrder] = useState<CustomerOrderResponse | null>(null);
  const [orderStatus, setOrderStatus] = useState('No order submitted yet');
  const [orderAlerts, setOrderAlerts] = useState<AlertInboxItem[]>([]);

  const [simStatus, setSimStatus] = useState('SIM flow idle');
  const [stepUpChallengeId, setStepUpChallengeId] = useState<string | null>(null);
  const [stepUpToken, setStepUpToken] = useState<string | null>(null);
  const [stepUpCode, setStepUpCode] = useState('');

  const [esimStatus, setEsimStatus] = useState<EsimActivationResponse | null>(null);

  const [roamingPacks, setRoamingPacks] = useState<RoamingPack[]>([]);
  const [roamingStatus, setRoamingStatus] = useState('Roaming flow idle');

  const sessionRoles = useMemo(() => parseJwtRoles(session?.accessToken), [session?.accessToken]);
  const canSendNotificationTest = sessionRoles.includes('ADMIN');

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

  const navigateTo = (nextRoute: AppRoute) => {
    const targetPath = nextRoute === 'lab' ? '/lab' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute(nextRoute);
  };

  const loadOverview = async () => {
    const response = await authedFetch('/api/v1/customer/account-overview');
    const payload = (await response.json()) as AccountOverview;
    setOverview(payload);
    return payload;
  };

  const loadHomeDashboard = async () => {
    const response = await authedFetch('/api/v1/customer/dashboard');
    return (await response.json()) as HomeDashboardResponse;
  };

  const loadHomeNotificationSummary = async () => {
    const response = await authedFetch('/api/v1/customer/notifications/inbox');
    const payload = (await response.json()) as HomeNotificationItem[];
    return payload.filter((item) => !item.readAt).length;
  };

  const loadHomeSupportSummary = async () => {
    const response = await authedFetch('/api/v1/customer/support/cases');
    const payload = (await response.json()) as HomeSupportCase[];
    return {
      openOrInProgress: payload.filter(
        (item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS'
      ).length,
      waitingCustomer: payload.filter((item) => item.status === 'WAITING_CUSTOMER').length,
    };
  };

  const refreshHomepageData = async () => {
    setError(null);
    setAccountLoadState('loading');
    setAccountLoadMessage(null);

    const [overviewResult, dashboardResult, notificationResult, supportResult] =
      await Promise.allSettled([
        loadOverview(),
        loadHomeDashboard(),
        loadHomeNotificationSummary(),
        loadHomeSupportSummary(),
      ]);

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
      setAccountLoadState('ready');
      setStatus('Protected API call succeeded');
    } else {
      setOverview(null);
      if (isAuthError(overviewResult.reason)) {
        setAccountLoadState('auth-error');
        setAccountLoadMessage('Session is no longer authorized. Refresh session or login again.');
      } else {
        setAccountLoadState('api-error');
        setAccountLoadMessage('Account snapshot unavailable. Try refreshing homepage data.');
      }
    }

    if (dashboardResult.status === 'fulfilled') {
      setHomeDashboard(dashboardResult.value);
    } else {
      setHomeDashboard(null);
    }

    if (notificationResult.status === 'fulfilled') {
      setHomeUnreadNotifications(notificationResult.value);
    } else {
      setHomeUnreadNotifications(0);
    }

    if (supportResult.status === 'fulfilled') {
      setHomeOpenSupportCases(supportResult.value.openOrInProgress);
      setHomeWaitingSupportCases(supportResult.value.waitingCustomer);
    } else {
      setHomeOpenSupportCases(0);
      setHomeWaitingSupportCases(0);
    }

    const results = [overviewResult, dashboardResult, notificationResult, supportResult];
    const failed = results.filter((item) => item.status === 'rejected').length;

    if (failed === 0) {
      setStatus('Homepage data refreshed');
      return;
    }

    if (failed < results.length) {
      setStatus(`Homepage partially loaded (${results.length - failed}/${results.length})`);
    } else {
      setStatus('Homepage data load failed');
    }

    const firstFailure = results.find((item) => item.status === 'rejected');
    if (firstFailure && firstFailure.status === 'rejected' && !isAuthError(firstFailure.reason)) {
      setError(toErrorMessage(firstFailure.reason, 'Failed to refresh homepage data'));
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

  const issueStepUpChallenge = async (action: StepUpAction) => {
    const response = await authedFetch('/api/v1/customer/step-up/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId: 'line-web-1', action }),
    });
    const payload = (await response.json()) as StepUpChallengeResponse;
    setStepUpChallengeId(payload.challengeId);
    setStepUpCode('');
    setStepUpToken(null);
    setSimStatus(
      `Challenge sent to ${payload.maskedDestination} (challenge ${payload.challengeId})`
    );
  };

  const verifyStepUp = async () => {
    if (!stepUpChallengeId) {
      setSimStatus('Issue a challenge first');
      return;
    }
    if (!stepUpCode.trim()) {
      setSimStatus('Enter the challenge code before verification');
      return;
    }
    const response = await authedFetch('/api/v1/customer/step-up/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: stepUpChallengeId, code: stepUpCode.trim() }),
    });
    const payload = (await response.json()) as StepUpVerifyResponse;
    setStepUpToken(payload.verificationToken);
    setSimStatus('Step-up token verified');
  };

  const simAction = async (action: 'block' | 'unblock') => {
    if (!stepUpToken) {
      setSimStatus('Step-up verification required first');
      return;
    }
    const response = await authedFetch(`/api/v1/customer/sim/line-web-1/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepUpVerificationToken: stepUpToken,
        reason: 'self-service request',
      }),
    });
    const payload = (await response.json()) as SimActionResponse;
    setSimStatus(`SIM ${action} success (${payload.previousStatus} -> ${payload.currentStatus})`);
  };

  const activateEsim = async () => {
    const response = await authedFetch('/api/v1/customer/esim/line-web-1/activate', {
      method: 'POST',
    });
    setEsimStatus((await response.json()) as EsimActivationResponse);
  };

  const pollEsim = async () => {
    const response = await authedFetch('/api/v1/customer/esim/line-web-1/status');
    setEsimStatus((await response.json()) as EsimActivationResponse);
  };

  const loadRoamingPacks = async () => {
    const response = await authedFetch(
      '/api/v1/customer/roaming/packs?country=pt&lineId=line-web-1'
    );
    setRoamingPacks((await response.json()) as RoamingPack[]);
  };

  const purchaseRoamingPack = async (packId: string) => {
    const response = await authedFetch('/api/v1/customer/roaming/packs/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId: 'line-web-1', country: 'pt', packId }),
    });
    const payload = (await response.json()) as RoamingPurchaseResponse;
    setRoamingStatus(
      `Purchased ${payload.packId}: ${payload.updatedAllowanceGb}GB until ${payload.validUntil}`
    );
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
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    completeLoginIfCallback()
      .then((newSession) => {
        if (newSession) {
          setSession(newSession);
          setStatus('Login completed via OIDC code+PKCE');
          setRoute('home');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'OIDC callback failed'));
  }, []);

  useEffect(() => {
    if (session) {
      if (route === 'home') {
        refreshHomepageData().catch(() => undefined);
      }
      if (route === 'lab') {
        loadOverview()
          .then(() => {
            setAccountLoadState('ready');
            setAccountLoadMessage(null);
          })
          .catch((err) => {
            setOverview(null);
            if (isAuthError(err)) {
              setAccountLoadState('auth-error');
              setAccountLoadMessage(
                'Session is no longer authorized. Refresh session or login again.'
              );
            } else {
              setAccountLoadState('api-error');
              setAccountLoadMessage('Account data unavailable. Try refreshing the page.');
            }
            setError(toErrorMessage(err, 'Failed to load account overview'));
          });
        loadPaymentHistory().catch(() => undefined);
        loadOrderAlerts().catch(() => undefined);
      }
    } else {
      setOverview(null);
      setHomeDashboard(null);
      setHomeUnreadNotifications(0);
      setHomeOpenSupportCases(0);
      setHomeWaitingSupportCases(0);
      setAccountLoadState('idle');
      setAccountLoadMessage(null);
      setHistory([]);
      setOrderAlerts([]);
    }
  }, [route, session]);

  const expiresIn = useMemo(() => {
    if (!session) return 'n/a';
    return `${Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))}s`;
  }, [session]);

  const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return currencyFormatter.format(value);
  };

  const formattedOutstandingAmount = formatCurrency(overview?.outstandingAmount);

  const formatDateValue = (value: string | null | undefined) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const dataUsedGb = homeDashboard
    ? (homeDashboard.usageSummary.dataUsedMb / 1024).toFixed(1)
    : '0.0';
  const dataLimitGb = homeDashboard
    ? (homeDashboard.usageSummary.dataLimitMb / 1024).toFixed(1)
    : '0.0';

  if (route === 'home') {
    return (
      <DesignSystemProvider>
        <div style={styles.container}>
          <h1 style={styles.title}>MyTelco Self-Care</h1>
          <Typography variant="body" color="secondary" style={{ marginBottom: 12 }}>
            Manage your account, usage, payments, and support in one place.
          </Typography>

          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Session</Typography>
            <Typography variant="small" color="secondary">
              Status: {status}
            </Typography>
            <Typography variant="small" color="secondary">
              Access token expires in: {expiresIn}
            </Typography>
            <div style={styles.row}>
              {!session && (
                <Button size="sm" onClick={() => beginLogin().catch((e) => setError(String(e)))}>
                  Login
                </Button>
              )}
              {session && (
                <Button
                  size="sm"
                  onClick={() => {
                    refreshSession(session)
                      .then((next) => {
                        setSession(next);
                        setStatus('Refresh token grant succeeded');
                      })
                      .catch((e) => setError(String(e)));
                  }}
                >
                  Refresh session
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigateTo('lab')}>
                Open Self-Care Lab
              </Button>
              {session && (
                <Button size="sm" variant="ghost" onClick={() => logout(session)}>
                  Logout
                </Button>
              )}
            </div>
          </Card>

          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Account at a glance</Typography>
            {session && accountLoadState === 'ready' && (
              <>
                <Typography variant="body">
                  Plan: {homeDashboard?.accountSummary.planName || overview?.plan || '—'}
                </Typography>
                <Typography variant="body">
                  Account status: {homeDashboard?.accountSummary.accountStatus || '—'}
                </Typography>
                <Typography variant="body">
                  Primary line: {homeDashboard?.accountSummary.primaryMsisdn || '—'}
                </Typography>
                <Typography variant="body">Account type: {overview?.accountType || '—'}</Typography>
                <Typography variant="body">
                  Active lines: {overview?.activeLineCount ?? 0}
                </Typography>
              </>
            )}
            {session && accountLoadState === 'loading' && (
              <Typography variant="small" color="secondary">
                Loading account snapshot…
              </Typography>
            )}
            {session && accountLoadState !== 'ready' && accountLoadState !== 'loading' && (
              <Typography variant="small" color="secondary">
                {accountLoadMessage ||
                  'Account snapshot unavailable. Try refreshing homepage data.'}
              </Typography>
            )}
            {!session && (
              <Typography variant="small" color="secondary">
                Login to see your personal account snapshot.
              </Typography>
            )}
            {session && (
              <div style={styles.row}>
                <Button size="sm" onClick={() => refreshHomepageData().catch(() => undefined)}>
                  Refresh homepage data
                </Button>
              </div>
            )}
          </Card>

          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Usage this cycle</Typography>
            {session && homeDashboard ? (
              <>
                <Typography variant="body">
                  Data: {dataUsedGb} GB / {dataLimitGb} GB (
                  {homeDashboard.usageSummary.dataUsagePercent.toFixed(1)}%)
                </Typography>
                <Typography variant="body">
                  Voice: {homeDashboard.usageSummary.voiceMinutesUsed} /{' '}
                  {homeDashboard.usageSummary.voiceMinutesLimit} min (
                  {homeDashboard.usageSummary.voiceUsagePercent.toFixed(1)}%)
                </Typography>
                <Typography variant="body">
                  SMS: {homeDashboard.usageSummary.smsUsed} / {homeDashboard.usageSummary.smsLimit}{' '}
                  ({homeDashboard.usageSummary.smsUsagePercent.toFixed(1)}%)
                </Typography>
              </>
            ) : (
              <Typography variant="small" color="secondary">
                Usage summary unavailable.
              </Typography>
            )}
          </Card>

          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Billing snapshot</Typography>
            {session && (
              <>
                <Typography variant="body">
                  Current balance: {formatCurrency(homeDashboard?.billingSummary.currentBalance)}
                </Typography>
                <Typography variant="body">
                  Outstanding amount: {formattedOutstandingAmount}
                </Typography>
                <Typography variant="body">
                  Next payment due:{' '}
                  {formatDateValue(
                    homeDashboard?.billingSummary.nextPaymentDueDate || overview?.nextBillDate
                  )}
                </Typography>
                <Typography variant="body">
                  Payment method: {homeDashboard?.billingSummary.paymentMethod || '—'}
                </Typography>
                <Typography variant="body">
                  Auto-pay: {homeDashboard?.billingSummary.autoPayEnabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </>
            )}
          </Card>

          <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
            <Typography variant="h4">Support and notifications</Typography>
            {session && (
              <>
                <Typography variant="body">
                  Unread notifications: {homeUnreadNotifications}
                </Typography>
                <Typography variant="body">Open support cases: {homeOpenSupportCases}</Typography>
                <Typography variant="body">Waiting on you: {homeWaitingSupportCases}</Typography>
              </>
            )}
            {!session && (
              <Typography variant="small" color="secondary">
                Login to see support and notification status.
              </Typography>
            )}
          </Card>

          <Card padding="md" shadow="md">
            <Typography variant="h4">Quick actions</Typography>
            <Typography variant="body">
              - Open payment, SIM, support and troubleshooting flows
            </Typography>
            <Typography variant="body">
              - Validate order rollback and notification pipelines
            </Typography>
            <Typography variant="body">
              - Run full self-care lab journey for integration checks
            </Typography>
            <div style={styles.row}>
              <Button size="sm" onClick={() => navigateTo('lab')}>
                Open advanced flows
              </Button>
            </div>
          </Card>

          {error && <p style={styles.warning}>{error}</p>}
        </div>
      </DesignSystemProvider>
    );
  }

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <h1 style={styles.title}>MyTelco Self-Care Lab</h1>
        <Typography variant="small" color="secondary" style={{ marginBottom: 12 }}>
          Engineering and integration workspace for advanced end-to-end flows.
        </Typography>

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">Navigation</Typography>
          <div style={styles.row}>
            <Button size="sm" variant="outline" onClick={() => navigateTo('home')}>
              Back to homepage
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigateTo('lab')}>
              Stay in lab
            </Button>
          </div>
        </Card>

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
              <Typography variant="body">Outstanding: {formattedOutstandingAmount}</Typography>
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
        <FamilyRolesPanel authedFetch={authedFetch} />

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

        <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
          <Typography variant="h4">SIM/eSIM/Roaming (Issue #39)</Typography>
          <Typography variant="small" color="secondary">
            {simStatus}
          </Typography>
          <div style={styles.row}>
            <Button
              size="sm"
              onClick={() => issueStepUpChallenge('SIM_BLOCK').catch(() => undefined)}
            >
              Issue step-up challenge
            </Button>
            <input
              value={stepUpCode}
              onChange={(event) => setStepUpCode(event.target.value)}
              placeholder="Enter OTP code"
              style={{ minWidth: 140 }}
            />
            <Button
              size="sm"
              onClick={() => verifyStepUp().catch(() => undefined)}
              disabled={!stepUpChallengeId || !stepUpCode.trim()}
            >
              Verify challenge code
            </Button>
            <Button
              size="sm"
              onClick={() => simAction('block').catch(() => undefined)}
              disabled={!stepUpToken}
            >
              Block SIM
            </Button>
            <Button
              size="sm"
              onClick={() => simAction('unblock').catch(() => undefined)}
              disabled={!stepUpToken}
            >
              Unblock SIM
            </Button>
          </div>
          <Typography variant="small" color="secondary">
            Local stub OTP is delivered via customer-bff logs. Use that code for verification.
          </Typography>
          <div style={styles.row}>
            <Button size="sm" onClick={() => activateEsim().catch(() => undefined)}>
              Activate eSIM
            </Button>
            <Button
              size="sm"
              onClick={() => pollEsim().catch(() => undefined)}
              disabled={!esimStatus}
            >
              Poll eSIM status
            </Button>
          </div>
          {esimStatus && (
            <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
              eSIM {esimStatus.status} · QR ref {esimStatus.qrReference}
            </Typography>
          )}
          <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
            {roamingStatus}
          </Typography>
          <div style={styles.row}>
            <Button size="sm" onClick={() => loadRoamingPacks().catch(() => undefined)}>
              Load PT roaming packs
            </Button>
            {roamingPacks.slice(0, 2).map((pack) => (
              <Button
                key={pack.packId}
                size="sm"
                onClick={() => purchaseRoamingPack(pack.packId).catch(() => undefined)}
              >
                Buy {pack.name}
              </Button>
            ))}
          </div>
        </Card>

        <NotificationCenterPanel authedFetch={authedFetch} canSendTest={canSendNotificationTest} />

        <TroubleshootingPanel authedFetch={authedFetch} />

        <SupportCasesPanel authedFetch={authedFetch} />

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
