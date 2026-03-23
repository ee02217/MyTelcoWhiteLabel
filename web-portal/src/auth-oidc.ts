/**
 * BFF-mediated authentication for the customer portal.
 * Uses the customer-bff /api/v1/auth/* endpoints for login/logout/session.
 */

type AuthResponse = {
  authenticated: boolean;
  expiresIn?: number;
  error?: string;
};

type SessionResponse = {
  authenticated: boolean;
  subject?: string;
  username?: string;
  roles?: string[];
  expiresAt?: number;
  error?: string;
};

export type OidcSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  subject: string;
  roles: string[];
};

// BFF API base URL - call through the portal's nginx (same origin)
// This ensures cookies are sent properly (no CORS issues)
const BFF_API_BASE = '/api/v1/auth';

const SESSION_KEY = 'mytelco_session';

/**
 * Login with username/password via the BFF.
 * The BFF will authenticate with Keycloak and return cookies.
 */
export const beginLogin = async () => {
  // For BFF-mediated login, we show a login form instead of redirecting
  // This function is a no-op for the BFF flow - the login form handles the actual login
  console.log('BFF login: use the login form to authenticate');
};

/**
 * Perform the actual login with username/password.
 * Returns the session data on success.
 */
export const loginWithCredentials = async (username: string, password: string): Promise<OidcSession> => {
  const response = await fetch(`${BFF_API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // Important: include cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || 'Login failed');
  }

  const auth: AuthResponse = await response.json();
  
  if (!auth.authenticated) {
    throw new Error('Authentication failed');
  }

  // Create session from login response - we don't need to fetch session details
  // The cookies are already set by the BFF
  const expiresAt = Math.floor(Date.now() / 1000) + (auth.expiresIn || 300);
  
  // Store session info for UI (roles will be fetched on app init)
  const session: OidcSession = {
    accessToken: '', // Not accessible (HttpOnly cookie)
    refreshToken: undefined,
    expiresAt,
    subject: '', // Will be fetched on app init
    roles: ['CUSTOMER'], // Assume CUSTOMER role for now
  };
  
  saveSession(session);
  return session;
};

/**
 * Complete login if this is an OIDC callback (for backward compatibility).
 * In BFF mode, this just returns null (no OIDC callback).
 */
export const completeLoginIfCallback = async () => {
  // BFF-mediated login doesn't use OIDC callbacks
  return null;
};

/**
 * Read session from the BFF.
 * This calls /api/v1/auth/session which reads the HttpOnly cookie.
 */
export const readSession = async (): Promise<OidcSession | null> => {
  return fetchSession();
};

/**
 * Internal function to fetch session from BFF.
 */
const fetchSession = async (): Promise<OidcSession | null> => {
  try {
    const response = await fetch(`${BFF_API_BASE}/session`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    });

    if (!response.ok) {
      console.error('Session fetch failed:', response.status, response.statusText);
      return null;
    }

    const text = await response.text();
    console.log('Session response:', text);
    
    const session: SessionResponse = JSON.parse(text);
    
    if (!session.authenticated) {
      return null;
    }

    // Convert session response to OidcSession format
    return {
      accessToken: '', // We don't have direct access to the token (HttpOnly cookie)
      refreshToken: undefined,
      expiresAt: session.expiresAt || 0,
      subject: session.subject || '',
      roles: session.roles || [],
    };
  } catch (e) {
    return null;
  }
};

/**
 * Save session to localStorage (for UI state only - not the actual token).
 */
export const saveSession = (session: OidcSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  // Store minimal session info for UI display (not the actual token)
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    subject: session.subject,
    roles: session.roles,
    expiresAt: session.expiresAt,
  }));
};

/**
 * Refresh the session.
 * In BFF mode, we call the refresh endpoint which should rotate the cookies.
 */
export const refreshSession = async (): Promise<OidcSession | null> => {
  try {
    const response = await fetch(`${BFF_API_BASE}/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      // Refresh failed, try to fetch session anyway
      return fetchSession();
    }

    return fetchSession();
  } catch {
    return null;
  }
};

/**
 * Logout by calling the BFF logout endpoint.
 * This clears the HttpOnly cookies.
 */
export const logout = async () => {
  try {
    await fetch(`${BFF_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore errors - clear local state anyway
  }
  
  saveSession(null);
  
  // Redirect to home after logout
  window.location.href = '/';
};

/**
 * Check if user is authenticated.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await readSession();
  return session !== null;
};
