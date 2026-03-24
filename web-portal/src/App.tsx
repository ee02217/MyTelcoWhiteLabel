// New App.tsx - Production-ready with AppShell

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DesignSystemProvider, Field, Typography } from './design-system';
import { AppShell } from './app/AppShell';
import { Dashboard } from './app/routes/Dashboard';
import { Usage } from './app/routes/Usage';
import { Billing } from './app/routes/Billing';
import { Lines } from './app/routes/Lines';
import { LineDetail } from './app/routes/LineDetail';
import { Roaming } from './app/routes/Roaming';
import { Support } from './app/routes/Support';
import { Notifications } from './app/routes/Notifications';
import { Catalog } from './app/routes/Catalog';
import { Orders } from './app/routes/Orders';
import { Settings } from './app/routes/Settings';
import {
  completeLoginIfCallback,
  loginWithCredentials,
  logout,
  readSession,
  type OidcSession,
} from './auth-oidc';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_SESSION: OidcSession = {
  accessToken: 'dev-mode-token',
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  subject: 'Customer',
  roles: ['CUSTOMER'],
};

function App() {
  const navigate = useNavigate();
  const [route, setRoute] = useState<string>(window.location.pathname);
  const [session, setSession] = useState<OidcSession | null>(DEV_MODE ? DEV_SESSION : null);
  const [loading, setLoading] = useState(DEV_MODE ? false : true);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (DEV_MODE) return;
    // Check for OIDC callback (backward compatibility)
    completeLoginIfCallback();

    // Read session from BFF (async)
    const initSession = async () => {
      const stored = await readSession();
      setSession(stored);
      setLoading(false);
    };
    initSession();
  }, []);

  const navigateTo = (nextRoute: string) => {
    navigate(nextRoute);
    setRoute(nextRoute);
  };

  // Keep route state in sync with browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    setLoginError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');

    try {
      const newSession = await loginWithCredentials(username, password);
      setSession(newSession);
      setIsLoggingIn(false);
      setUsername('');
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    navigateTo('/');
  };

  // Wait for initial load
  if (loading) {
    return (
      <DesignSystemProvider>
        <div style={{ padding: '24px' }}>
          <Typography>Loading...</Typography>
        </div>
      </DesignSystemProvider>
    );
  }

  // Show login form if not authenticated or logging in
  if (!session || isLoggingIn) {
    return (
      <DesignSystemProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
          }}
        >
          <Card padding="lg" shadow="lg" style={{ maxWidth: '400px', width: '100%' }}>
            <Typography variant="h3" style={{ marginBottom: '8px', textAlign: 'center' }}>
              MyTelco
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginBottom: '24px', textAlign: 'center' }}>
              Sign in to manage your account
            </Typography>

            {isLoggingIn ? (
              <form onSubmit={handleLoginSubmit}>
                <Field
                  label="Username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="Enter username"
                  required
                  style={{ marginBottom: '16px' }}
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter password"
                  required
                  style={{ marginBottom: '16px' }}
                />

                {loginError && (
                  <Typography variant="body" style={{ marginBottom: '16px', color: '#d32f2f' }}>
                    {loginError}
                  </Typography>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsLoggingIn(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={handleLoginClick} style={{ width: '100%' }}>
                Sign In
              </Button>
            )}
          </Card>
        </div>
      </DesignSystemProvider>
    );
  }

  // Token expiration warning (check if session is still valid)
  const tokenExpired = session.expiresAt * 1000 < Date.now();
  if (tokenExpired) {
    return (
      <DesignSystemProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
          }}
        >
          <Card padding="lg" shadow="lg" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <Typography variant="h4" style={{ marginBottom: '16px' }}>
              Session Expired
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginBottom: '24px' }}>
              Your session has expired. Please sign in again.
            </Typography>
            <Button onClick={handleLoginClick} style={{ width: '100%' }}>
              Sign In
            </Button>
          </Card>
        </div>
      </DesignSystemProvider>
    );
  }

  // Authenticated fetch - uses cookies automatically (no Authorization header needed)
  const authedFetch = async (path: string, init?: RequestInit) => {
    const url = path.startsWith('http') ? path : `${path}`;
    const response = await fetch(url, {
      ...init,
      credentials: 'include', // Important: include cookies for BFF auth
    });
    return response;
  };

  // Render the appropriate page
  const renderPage = () => {
    // Dashboard
    if (route === '/') {
      return <Dashboard authedFetch={authedFetch} onNavigate={navigateTo} />;
    }

    // Usage
    if (route === '/usage') {
      return <Usage authedFetch={authedFetch} />;
    }

    // Billing
    if (route === '/billing') {
      return <Billing authedFetch={authedFetch} />;
    }

    // Lines list
    if (route === '/lines') {
      return <Lines authedFetch={authedFetch} onNavigate={navigateTo} />;
    }

    // Line detail
    if (route.startsWith('/lines/')) {
      return <LineDetail authedFetch={authedFetch} />;
    }

    // Roaming
    if (route === '/roaming') {
      return <Roaming authedFetch={authedFetch} />;
    }

    // Support
    if (route === '/support') {
      return <Support authedFetch={authedFetch} />;
    }

    // Notifications
    if (route === '/notifications') {
      return <Notifications authedFetch={authedFetch} />;
    }

    // Catalog
    if (route === '/catalog') {
      return <Catalog authedFetch={authedFetch} onNavigate={navigateTo} />;
    }

    // Orders
    if (route === '/orders') {
      return <Orders authedFetch={authedFetch} onNavigate={navigateTo} />;
    }

    // Settings
    if (route === '/settings') {
      return (
        <Settings
          authedFetch={authedFetch}
          onLogout={handleLogout}
          userName={session.subject || 'Customer'}
        />
      );
    }

    // Fallback for unknown routes
    return (
      <Card padding="lg" shadow="md">
        <Typography variant="h4" style={{ marginBottom: '16px' }}>
          Page Not Found
        </Typography>
        <Typography variant="body" color="secondary">
          The page you are looking for does not exist.
        </Typography>
      </Card>
    );
  };

  return (
    <DesignSystemProvider>
      <AppShell
        currentPath={route}
        onNavigate={navigateTo}
        userName={session.subject || 'Customer'}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppShell>
    </DesignSystemProvider>
  );
}

export default App;
