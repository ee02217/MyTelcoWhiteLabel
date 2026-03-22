// New App.tsx - Production-ready with AppShell

import { useEffect, useState } from 'react';
import { Button, Card, DesignSystemProvider, Typography } from './design-system';
import { AppShell } from './app/AppShell';
import { Dashboard } from './app/routes/Dashboard';
import {
  beginLogin,
  completeLoginIfCallback,
  logout,
  readSession,
  type OidcSession,
} from './auth-oidc';
import { setAuthFetch } from './services/api';

type AppRoute = string;

function App() {
  const [route, setRoute] = useState<AppRoute>('/');
  const [session, setSession] = useState<OidcSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for OIDC callback
    completeLoginIfCallback();
    
    // Read session
    const stored = readSession();
    setSession(stored);
    setLoading(false);
  }, []);

  // Set up API client with auth
  useEffect(() => {
    if (session?.accessToken) {
      setAuthFetch(async (path: string, init: RequestInit = {}) => {
        const url = path.startsWith('http') ? path : `http://localhost:3000${path}`;
        const response = await fetch(url, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        return response;
      });
    }
  }, [session]);

  const navigateTo = (nextRoute: string) => {
    // Update URL without reload
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = async () => {
    try {
      await beginLogin();
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  const handleLogout = async () => {
    await logout(session);
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

  // Show login if no session
  if (!session) {
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
            <Typography variant="h3" style={{ marginBottom: '8px' }}>
              MyTelco
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginBottom: '24px' }}>
              Sign in to manage your account
            </Typography>
            <Button onClick={handleLogin} style={{ width: '100%' }}>
              Sign In
            </Button>
          </Card>
        </div>
      </DesignSystemProvider>
    );
  }

  // Token expiration warning
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
            <Button onClick={handleLogin} style={{ width: '100%' }}>
              Sign In
            </Button>
          </Card>
        </div>
      </DesignSystemProvider>
    );
  }

  // Render the appropriate page
  const renderPage = () => {
    // For now, only Dashboard is implemented
    // Other pages will show a placeholder
    if (route === '/') {
      return (
        <Dashboard
          authedFetch={async (path, init) => {
            const url = path.startsWith('http') ? path : `http://localhost:3000${path}`;
            const response = await fetch(url, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${session.accessToken}`,
              },
            });
            return response;
          }}
          onNavigate={navigateTo}
        />
      );
    }

    // Placeholder for other routes
    return (
      <Card padding="lg" shadow="md">
        <Typography variant="h4" style={{ marginBottom: '16px' }}>
          {route} - Coming Soon
        </Typography>
        <Typography variant="body" color="secondary">
          This page is under construction. Check back soon!
        </Typography>
      </Card>
    );
  };

  return (
    <DesignSystemProvider>
      <AppShell
        currentPath={route}
        onNavigate={navigateTo}
        userName="Customer"
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppShell>
    </DesignSystemProvider>
  );
}

export default App;
