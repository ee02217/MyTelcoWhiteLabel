import { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Badge, Button, Typography } from '../design-system';
import { isDevMode } from '../services/api-client';
import {
  beginLogin,
  completeLoginIfCallback,
  logout,
  readSession,
  refreshSession,
  saveSession,
  type OidcSession,
} from '../auth-oidc';

type SessionContextValue = {
  session: OidcSession | null;
  status: string;
  error: string | null;
  setStatus: (msg: string) => void;
  setError: (msg: string | null) => void;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  status: 'Idle',
  error: null,
  setStatus: () => {},
  setError: () => {},
});

export const useSession = () => useContext(SessionContext);

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/users', label: 'Users' },
  { to: '/journeys', label: 'Journeys' },
  { to: '/audit', label: 'Audit Log' },
];

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: isActive ? 600 : 500,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  background: isActive ? 'var(--color-primary-500)' : 'transparent',
  color: isActive ? '#fff' : 'var(--color-text-secondary)',
  border: 'none',
});

export function AdminLayout() {
  const DEV_MODE = isDevMode();
  const devSession = { accessToken: 'demo', expiresAt: 9999999999, profile: {} } as OidcSession;

  const [session, setSession] = useState<OidcSession | null>(() => {
    if (DEV_MODE) {
      saveSession(devSession);
      return devSession;
    }
    return readSession();
  });
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEV_MODE) return;
    completeLoginIfCallback()
      .then((newSession) => {
        if (newSession) {
          setSession(newSession);
          setStatus('Admin login completed via OIDC');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'OIDC callback failed');
        setStatus('Login callback failed');
      });
  }, []);

  return (
    <SessionContext.Provider value={{ session, status, error, setStatus, setError }}>
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-background-primary)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top header bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--color-border-default)',
          background: 'var(--color-background-primary)',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Typography variant="h4" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              MyTelco Admin
            </Typography>
            <nav aria-label="Main navigation" style={{ display: 'flex', gap: 4 }}>
              {NAV_ITEMS.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => navLinkStyle(isActive)}>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {error && (
              <Badge variant="danger">
                {error}
              </Badge>
            )}
            {status !== 'Idle' && (
              <Badge variant="info" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {status}
              </Badge>
            )}
            {!session && (
              <Button size="sm" onClick={() => beginLogin().catch((err) => setError(String(err)))}>
                Login
              </Button>
            )}
            {session && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (DEV_MODE) {
                      setSession({ ...session, expiresAt: 9999999999 });
                      setStatus('Session refreshed (dev mode)');
                    } else {
                      refreshSession(session)
                        .then((next) => {
                          setSession(next);
                          setStatus('Session refreshed');
                        })
                        .catch((err) => setError(String(err)));
                    }
                  }}
                >
                  Refresh
                </Button>
                <Button size="sm" variant="ghost" onClick={() => logout(session)}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: 'var(--spacing-6)',
          display: 'grid',
          gap: 'var(--spacing-4)',
          alignContent: 'start',
        }}>
          {session ? (
            <Outlet />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <Typography variant="h3">Welcome to MyTelco Admin</Typography>
              <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
                Please log in to manage operators, users, and platform settings.
              </Typography>
              <div style={{ marginTop: 24 }}>
                <Button onClick={() => beginLogin().catch((err) => setError(String(err)))}>
                  Login with Keycloak
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </SessionContext.Provider>
  );
}
