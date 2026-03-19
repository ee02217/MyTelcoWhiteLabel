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

const resolveRuntimeUri = (configuredUri: string | undefined, fallbackPath: string) => {
  const origin = window.location.origin;

  if (!configuredUri) {
    return new URL(fallbackPath, origin).toString();
  }

  try {
    const parsed = new URL(configuredUri, origin);
    const routePath = `${parsed.pathname}${parsed.search}${parsed.hash}` || fallbackPath;
    return new URL(routePath, origin).toString();
  } catch {
    return new URL(fallbackPath, origin).toString();
  }
};

const cfg = {
  issuer: import.meta.env.VITE_OIDC_ISSUER,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirectUri: resolveRuntimeUri(import.meta.env.VITE_OIDC_REDIRECT_URI, '/callback'),
  postLogoutRedirectUri: resolveRuntimeUri(import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI, '/'),
  scopes: import.meta.env.VITE_OIDC_SCOPES || 'openid roles',
};

const SESSION_KEY = 'oidc_session';
const PKCE_KEY = 'oidc_pkce_verifier';
const STATE_KEY = 'oidc_state';

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

const getBrowserCrypto = () => {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Browser crypto API is unavailable. Use a modern browser.');
  }
  return cryptoApi;
};

const randomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = getBrowserCrypto().getRandomValues(new Uint8Array(length));
  return Array.from(arr)
    .map((v) => chars[v % chars.length])
    .join('');
};

const base64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const rotr = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));

const sha256Fallback = (data: Uint8Array) => {
  const bitLength = data.length * 8;
  const paddedLength = ((data.length + 9 + 63) >> 6) << 6;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(data);
  bytes[data.length] = 0x80;

  const view = new DataView(bytes.buffer);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(paddedLength - 8, highBits, false);
  view.setUint32(paddedLength - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new ArrayBuffer(32);
  const outView = new DataView(out);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
};

const resolveSubtleCrypto = () => {
  const cryptoApi = getBrowserCrypto() as Crypto & { webkitSubtle?: SubtleCrypto };
  return cryptoApi.subtle || cryptoApi.webkitSubtle;
};

const sha256 = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const subtle = resolveSubtleCrypto();
  if (subtle && typeof subtle.digest === 'function') {
    return subtle.digest('SHA-256', data);
  }
  return sha256Fallback(data);
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
