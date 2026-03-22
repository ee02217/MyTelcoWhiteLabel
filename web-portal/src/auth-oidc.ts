type OidcTokens = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

export type OidcSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  scope?: string;
};

// Resolve OIDC issuer - use configured value as-is
// This allows the app to work both locally (localhost) and remotely (IP/domain)
// The configured Keycloak URL must be reachable from the browser
const resolveIssuer = (configuredIssuer: string | undefined): string => {
  if (!configuredIssuer) {
    return window.location.origin;
  }

  // Return the configured issuer as-is - don't rewrite based on browser hostname
  // Users must ensure Keycloak is accessible at the configured URL from their network
  return configuredIssuer;
};

const cfg = {
  issuer: resolveIssuer(import.meta.env.VITE_OIDC_ISSUER),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  postLogoutRedirectUri: import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI,
  scopes: import.meta.env.VITE_OIDC_SCOPES || 'openid roles',
};

const SESSION_KEY = 'oidc_session';
const PKCE_KEY = 'oidc_pkce_verifier';
const STATE_KEY = 'oidc_state';

const randomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr)
    .map((v) => chars[v % chars.length])
    .join('');
};

const base64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const sha256 = async (input: string) => {
  const data = new TextEncoder().encode(input);
  return crypto.subtle.digest('SHA-256', data);
};

const tokenEndpoint = () => `${cfg.issuer}/protocol/openid-connect/token`;
const authEndpoint = () => `${cfg.issuer}/protocol/openid-connect/auth`;
const logoutEndpoint = () => `${cfg.issuer}/protocol/openid-connect/logout`;

const toSession = (tokens: OidcTokens): OidcSession => ({
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  idToken: tokens.id_token,
  expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
  scope: tokens.scope,
});

export const readSession = (): OidcSession | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OidcSession;
  } catch {
    return null;
  }
};

export const saveSession = (session: OidcSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const beginLogin = async () => {
  const verifier = randomString(96);
  const challenge = base64Url(await sha256(verifier));
  const state = randomString(24);
  sessionStorage.setItem(PKCE_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    redirect_uri: cfg.redirectUri,
    scope: cfg.scopes,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${authEndpoint()}?${params.toString()}`);
};

export const completeLoginIfCallback = async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return null;

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_KEY);
  if (!expectedState || expectedState !== state || !verifier) {
    throw new Error('Invalid OIDC callback state');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    code,
    code_verifier: verifier,
    redirect_uri: cfg.redirectUri,
  });

  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) throw new Error('Token exchange failed');
  const tokens = (await response.json()) as OidcTokens;
  const session = toSession(tokens);
  saveSession(session);

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  window.history.replaceState({}, '', '/');
  return session;
};

export const refreshSession = async (session: OidcSession) => {
  if (!session.refreshToken) throw new Error('Missing refresh token');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: cfg.clientId,
    refresh_token: session.refreshToken,
  });
  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error('Refresh failed');
  const tokens = (await response.json()) as OidcTokens;
  const next = toSession(tokens);
  saveSession(next);
  return next;
};

export const logout = async (session: OidcSession | null) => {
  saveSession(null);
  const params = new URLSearchParams({
    post_logout_redirect_uri: cfg.postLogoutRedirectUri,
    client_id: cfg.clientId,
  });
  if (session?.idToken) params.set('id_token_hint', session.idToken);
  window.location.assign(`${logoutEndpoint()}?${params.toString()}`);
};
