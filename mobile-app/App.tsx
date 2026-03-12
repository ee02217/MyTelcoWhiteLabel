import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Typography } from './src/design-system';
import { rnTokens } from '../platform-config/design-system/tokens';

WebBrowser.maybeCompleteAuthSession();

type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

type AccountOverview = { plan: string; activeLineCount: number; outstandingAmount: number };

const issuer = process.env.OIDC_ISSUER || 'http://localhost:8080/realms/mytelco-white-label';
const clientId = process.env.OIDC_CLIENT_ID || 'mobile-app';
const scopes = (process.env.OIDC_SCOPES || 'openid profile email roles offline_access').split(' ');
const apiBase = process.env.CUSTOMER_BFF_BASE_URL || 'http://localhost:8081';
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mytelco', path: 'oauth/callback' });

const TOKEN_KEY = 'mobile_oidc_tokens';

export default function App() {
  const [tokens, setTokens] = useState<TokenSet | null>(null);
  const [status, setStatus] = useState('Idle');
  const [overview, setOverview] = useState<AccountOverview | null>(null);

  const discovery = useMemo(
    () => ({
      authorizationEndpoint: `${issuer}/protocol/openid-connect/auth`,
      tokenEndpoint: `${issuer}/protocol/openid-connect/token`,
      revocationEndpoint: `${issuer}/protocol/openid-connect/revoke`,
      endSessionEndpoint: `${issuer}/protocol/openid-connect/logout`,
    }),
    []
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      responseType: AuthSession.ResponseType.Code,
      scopes,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((raw) => {
      if (raw) setTokens(JSON.parse(raw) as TokenSet);
    });
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return;

    AuthSession.exchangeCodeAsync(
      {
        code: response.params.code,
        clientId,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery
    )
      .then(async (result) => {
        const session: TokenSet = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          idToken: result.idToken,
          expiresAt: Math.floor(Date.now() / 1000) + (result.expiresIn || 300),
        };
        setTokens(session);
        await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(session));
        setStatus('Mobile login completed via auth code + PKCE');
      })
      .catch(() => setStatus('Token exchange failed'));
  }, [response, request?.codeVerifier]);

  const callProtected = async () => {
    if (!tokens?.accessToken) {
      setStatus('No access token (protected call blocked)');
      return;
    }
    const res = await fetch(`${apiBase}/api/v1/customer/account-overview`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (res.status === 401) {
      setStatus('401 evidence captured');
      return;
    }
    if (res.status === 403) {
      setStatus('403 evidence captured');
      return;
    }
    if (!res.ok) {
      setStatus(`Protected API failure (${res.status})`);
      return;
    }
    const payload = (await res.json()) as AccountOverview;
    setOverview(payload);
    setStatus('Protected API success (200)');
  };

  const refresh = async () => {
    if (!tokens?.refreshToken) {
      setStatus('No refresh token available');
      return;
    }
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken: tokens.refreshToken,
      },
      discovery
    );
    const next: TokenSet = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      idToken: refreshed.idToken || tokens.idToken,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expiresIn || 300),
    };
    setTokens(next);
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(next));
    setStatus('Refresh grant succeeded');
  };

  const signOut = async () => {
    const idTokenHint = tokens?.idToken
      ? `&id_token_hint=${encodeURIComponent(tokens.idToken)}`
      : '';
    await AsyncStorage.removeItem(TOKEN_KEY);
    setTokens(null);
    setOverview(null);
    setStatus('Session cleared locally');
    await WebBrowser.openBrowserAsync(
      `${discovery.endSessionEndpoint}?client_id=${encodeURIComponent(clientId)}${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" color="primary">
          MyTelco Mobile OIDC
        </Typography>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Session</Typography>
          <Typography variant="small" color="secondary">
            {status}
          </Typography>
          <Typography variant="small" color="secondary">
            Redirect URI: {redirectUri}
          </Typography>
          <Button
            title="Login (Auth Code + PKCE)"
            onPress={() => promptAsync()}
            disabled={!request}
          />
          <Button title="Refresh token" onPress={refresh} style={styles.buttonSpacing} />
          <Button title="Logout" onPress={signOut} style={styles.buttonSpacing} />
        </Card>

        <Card padding="md" shadow="md" style={styles.card}>
          <Typography variant="h4">Protected route behavior</Typography>
          <Button title="Call customer protected endpoint" onPress={callProtected} />
          {overview && (
            <>
              <Typography variant="body">Plan: {overview.plan}</Typography>
              <Typography variant="body">Active lines: {overview.activeLineCount}</Typography>
              <Typography variant="body">
                Outstanding: €{overview.outstandingAmount.toFixed(2)}
              </Typography>
            </>
          )}
        </Card>

        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rnTokens.colors.semantic.background.primary },
  content: { padding: rnTokens.spacingPx[6] },
  card: { marginTop: rnTokens.spacingPx[4] },
  buttonSpacing: { marginTop: rnTokens.spacingPx[2] },
});
