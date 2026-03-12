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

type AccountOverview = {
  plan: string;
  activeLineCount: number;
  outstandingAmount: number;
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

  const authedFetch = async (path: string) => {
    if (!session?.accessToken) throw new Error('Not authenticated');
    const res = await fetch(path, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
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
    } else {
      setOverview(null);
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
        <h1 style={styles.title}>MyTelco OIDC E2E Dashboard</h1>

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
