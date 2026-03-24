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
import {
  completeLoginIfCallback,
  loginWithCredentials,
  logout,
  readSession,
  type OidcSession,
} from './auth-oidc';

function App() {
  const navigate = useNavigate();
  const [route, setRoute] = useState<string>(window.location.pathname);
  const [session, setSession] = useState<OidcSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
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
      return <Usage />;
    }

    // Billing
    if (route === '/billing') {
      return <Billing />;
    }

    // Lines list
    if (route === '/lines') {
      return <Lines />;
    }

    // Line detail
    if (route.startsWith('/lines/')) {
      return <LineDetail />;
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
        userName={session.subject || 'Customer'}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppShell>
    </DesignSystemProvider>
  );
}

export default App;
