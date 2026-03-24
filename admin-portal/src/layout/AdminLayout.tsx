import { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Badge, Button, Panel, Typography } from '../design-system';
import { isDevMode } from '../services/api-client';
import { styles } from '../shared-styles';
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
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  background: isActive ? 'var(--color-primary-500)' : 'var(--color-background-secondary)',
  color: isActive ? '#fff' : 'var(--color-text-primary)',
  border: isActive ? 'none' : '1px solid var(--color-border-default)',
});

function SessionRoleBadges() {
  const { session } = useContext(SessionContext);
  if (!session?.accessToken) return null;

  // Decode JWT to show roles
  try {
    const parts = session.accessToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const roles: string[] = payload?.realm_access?.roles ?? [];
      const username: string = payload?.preferred_username ?? '';
      if (roles.length > 0 || username) {
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {username && <Badge variant="neutral">User: {username}</Badge>}
            {roles
              .filter((r) => !r.startsWith('default-roles'))
              .map((role) => (
                <Badge key={role} variant="info">{role}</Badge>
              ))}
          </div>
        );
      }
    }
  } catch {
    // Dev mode token won't decode — that's fine
  }
  return null;
}

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

  const expiresIn = session
    ? Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))
    : 'n/a';

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
      <div style={styles.container}>
        <Typography variant="h2">MyTelco Admin Portal</Typography>

        {/* Navigation */}
        <nav aria-label="Main navigation" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => navLinkStyle(isActive)}>
              {label}
            </NavLink>
          ))}
        </nav>

        <Typography variant="body" color="secondary">
          Operator metadata management (backend-first): profile, channel flags, users/roles and
          audit.
        </Typography>

        {/* Session Panel */}
        <Panel
          title="Session"
          subtitle="Admin OIDC authentication and data refresh controls"
          actions={
            <Badge variant={session ? 'success' : 'warning'}>
              {session ? 'Authenticated' : 'Not logged in'}
            </Badge>
          }
        >
          <div style={styles.row}>
            <Badge variant="info">Status: {status}</Badge>
            <Badge variant="neutral">Access token expires in: {expiresIn}</Badge>
          </div>
          {session && <SessionRoleBadges />}

          <div style={styles.row}>
            {!session && (
              <Button size="sm" onClick={() => beginLogin().catch((err) => setError(String(err)))}>
                Login (Admin)
              </Button>
            )}
            {session && (
              <>
                <Button
                  size="sm"
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
                  Refresh session
                </Button>
                <Button size="sm" variant="ghost" onClick={() => logout(session)}>
                  Logout
                </Button>
              </>
            )}
          </div>

          {error && (
            <Badge variant="danger" style={{ width: 'fit-content' }}>
              Error: {error}
            </Badge>
          )}
        </Panel>

        {/* Route content — only render when authenticated */}
        {session && <Outlet />}
      </div>
    </SessionContext.Provider>
  );
}
