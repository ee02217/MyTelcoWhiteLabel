import { useEffect, useState } from 'react';
import {
  beginLogin,
  completeLoginIfCallback,
  logout as oidcLogout,
  readSession,
  refreshSession,
  type OidcSession,
} from './auth-oidc';
import { AppShell } from './components/AppShell';
import { Dashboard } from './components/Dashboard';
import { Usage } from './components/Usage';
import { Billing } from './components/Billing';
import { Lines } from './components/Lines';
import { Roaming, Orders, Support, Notifications, Catalog, Settings } from './components/PlaceholderPages';

function App() {
  const [session, setSession] = useState<OidcSession | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = readSession();
    setSession(existingSession);
    setIsLoading(false);

    // Handle callback if returning from OIDC
    completeLoginIfCallback().then((newSession) => {
      if (newSession) {
        setSession(newSession);
      }
    });
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!session) return;

    const checkAndRefresh = async () => {
      const expiresIn = session.expiresAt - Math.floor(Date.now() / 1000);
      if (expiresIn < 60 && session.refreshToken) {
        try {
          const newSession = await refreshSession(session);
          if (newSession) {
            setSession(newSession);
          }
        } catch (e) {
          console.error('Failed to refresh session:', e);
          setSession(null);
        }
      }
    };

    const interval = setInterval(checkAndRefresh, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogin = async () => {
    await beginLogin();
  };

  const handleLogout = async () => {
    await oidcLogout(session);
    setSession(null);
    setActivePage('dashboard');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📱</div>
          <div style={{ color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // If not logged in, show login screen
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fa',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>📱</div>
          <h1 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 600, color: '#111827' }}>
            MyTelco
          </h1>
          <p style={{ margin: '0 0 32px', color: '#6b7280' }}>
            Sign in to manage your account
          </p>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate page
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />;
      case 'usage':
        return <Usage />;
      case 'billing':
        return <Billing />;
      case 'lines':
        return <Lines />;
      case 'roaming':
        return <Roaming />;
      case 'orders':
        return <Orders />;
      case 'support':
        return <Support />;
      case 'notifications':
        return <Notifications />;
      case 'catalog':
        return <Catalog />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  // Get user name from session (decode JWT or use default)
  const userName = session.scope || 'Customer';

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      userName={userName}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppShell>
  );
}

export default App;
