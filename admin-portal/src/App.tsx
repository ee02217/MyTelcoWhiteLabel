import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Button, Card, DesignSystemProvider, Typography } from './design-system';
import {
  beginLogin,
  completeLoginIfCallback,
  logout,
  readSession,
  refreshSession,
  type OidcSession,
} from './auth-oidc';

type OperatorSummaryResponse = {
  operatorId: string;
  name: string;
  version: number;
  updatedAt: string;
  locales: string[];
  channelCount: number;
  journeyCount: number;
  userCount: number;
};

type OperatorBranding = {
  logoLight: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
};

type OperatorProfileResponse = {
  operatorId: string;
  name: string;
  branding: OperatorBranding;
  featuresByChannel: Record<string, Record<string, boolean>>;
  locales: string[];
  journeyCount: number;
  version: number;
  updatedAt: string;
};

type OperatorUserResponse = {
  userId: string;
  displayName: string;
  email: string;
  roles: string[];
  enabled: boolean;
  updatedAt: string;
};

type OperatorAuditEntry = {
  operatorId: string;
  scope: string;
  targetId: string;
  action: string;
  actor: string;
  version: number;
  timestamp: string;
  changes: Record<string, unknown>;
};

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    padding: 'var(--spacing-8)',
    display: 'grid',
    gap: 'var(--spacing-4)',
  },
  row: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: 'var(--spacing-4)',
    alignItems: 'start',
  },
  input: {
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    minWidth: 220,
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
  },
  codeBlock: {
    background: 'var(--color-background-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px',
    whiteSpace: 'pre-wrap',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
};

function App() {
  const [session, setSession] = useState<OidcSession | null>(() => readSession());
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);

  const [operators, setOperators] = useState<OperatorSummaryResponse[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [profile, setProfile] = useState<OperatorProfileResponse | null>(null);
  const [users, setUsers] = useState<OperatorUserResponse[]>([]);
  const [audit, setAudit] = useState<OperatorAuditEntry[]>([]);

  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileLocalesDraft, setProfileLocalesDraft] = useState('');
  const [profileFeaturesDraft, setProfileFeaturesDraft] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<string, string>>({});
  const [userEnabledDrafts, setUserEnabledDrafts] = useState<Record<string, boolean>>({});

  const expiresIn = session ? Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000)) : 'n/a';
  const selectedSummary = useMemo(
    () => operators.find((item) => item.operatorId === selectedOperatorId) || null,
    [operators, selectedOperatorId]
  );

  const authedFetch = async (path: string, init: RequestInit = {}) => {
    const current = readSession();
    if (!current) throw new Error('No active admin session. Please login.');

    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${current.accessToken}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => response.statusText);
      throw new Error(`${response.status} ${msg || response.statusText}`.trim());
    }

    return response;
  };

  const loadOperators = async () => {
    const response = await authedFetch('/api/v1/admin/operators');
    const payload = (await response.json()) as OperatorSummaryResponse[];
    setOperators(payload);

    if (!selectedOperatorId && payload.length > 0) {
      setSelectedOperatorId(payload[0].operatorId);
    }
  };

  const loadOperatorDetails = async (operatorId: string) => {
    const [profileResp, usersResp, auditResp] = await Promise.all([
      authedFetch(`/api/v1/admin/operators/${operatorId}/profile`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/users`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/audit?limit=30`),
    ]);

    const profilePayload = (await profileResp.json()) as OperatorProfileResponse;
    const usersPayload = (await usersResp.json()) as OperatorUserResponse[];
    const auditPayload = (await auditResp.json()) as OperatorAuditEntry[];

    setProfile(profilePayload);
    setUsers(usersPayload);
    setAudit(auditPayload);
    setProfileNameDraft(profilePayload.name);
    setProfileLocalesDraft(profilePayload.locales.join(', '));
    setProfileFeaturesDraft(structuredClone(profilePayload.featuresByChannel));

    const nextRoleDrafts: Record<string, string> = {};
    const nextEnabledDrafts: Record<string, boolean> = {};
    for (const user of usersPayload) {
      nextRoleDrafts[user.userId] = user.roles.join(', ');
      nextEnabledDrafts[user.userId] = user.enabled;
    }
    setUserRoleDrafts(nextRoleDrafts);
    setUserEnabledDrafts(nextEnabledDrafts);
  };

  const refreshAll = async () => {
    setError(null);
    try {
      await loadOperators();
      if (selectedOperatorId) {
        await loadOperatorDetails(selectedOperatorId);
      }
      setStatus('Operator metadata refreshed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh operator metadata';
      setError(message);
      setStatus('Refresh failed');
    }
  };

  const saveProfile = async () => {
    if (!selectedOperatorId) return;

    const locales = profileLocalesDraft
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await authedFetch(`/api/v1/admin/operators/${selectedOperatorId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileNameDraft.trim(),
        locales,
        featuresByChannel: profileFeaturesDraft,
      }),
    });

    const payload = (await response.json()) as {
      profile: OperatorProfileResponse;
      version: number;
    };

    setProfile(payload.profile);
    setProfileNameDraft(payload.profile.name);
    setProfileLocalesDraft(payload.profile.locales.join(', '));
    setProfileFeaturesDraft(structuredClone(payload.profile.featuresByChannel));
    setStatus(`Profile saved (version ${payload.version})`);

    await loadOperators();
    await loadOperatorDetails(selectedOperatorId);
  };

  const saveUser = async (userId: string) => {
    if (!selectedOperatorId) return;

    const roles = (userRoleDrafts[userId] || '')
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);

    const response = await authedFetch(
      `/api/v1/admin/operators/${selectedOperatorId}/users/${userId}/roles`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles,
          enabled: userEnabledDrafts[userId],
        }),
      }
    );

    const updated = (await response.json()) as OperatorUserResponse;
    setUsers((prev) => prev.map((user) => (user.userId === userId ? updated : user)));
    setStatus(`User ${updated.displayName} updated`);

    await loadOperators();
    await loadOperatorDetails(selectedOperatorId);
  };

  const toggleFeature = (channel: string, flag: string, value: boolean) => {
    setProfileFeaturesDraft((prev) => ({
      ...prev,
      [channel]: {
        ...(prev[channel] || {}),
        [flag]: value,
      },
    }));
  };

  useEffect(() => {
    completeLoginIfCallback()
      .then((newSession) => {
        if (newSession) {
          setSession(newSession);
          setStatus('Admin login completed via OIDC');
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'OIDC callback failed';
        setError(message);
        setStatus('Login callback failed');
      });
  }, []);

  useEffect(() => {
    if (!session) {
      setOperators([]);
      setProfile(null);
      setUsers([]);
      setAudit([]);
      return;
    }

    loadOperators()
      .then(() => setStatus('Operator list loaded'))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed loading operators';
        setError(message);
      });
  }, [session]);

  useEffect(() => {
    if (!session || !selectedOperatorId) return;

    loadOperatorDetails(selectedOperatorId)
      .then(() => setStatus(`Loaded operator ${selectedOperatorId}`))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed loading operator details';
        setError(message);
        setStatus('Operator load failed');
      });
  }, [session, selectedOperatorId]);

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <Typography variant="h2">MyTelco Admin Portal</Typography>
        <Typography variant="body" color="secondary">
          Operator metadata management (backend-first): profile, channel flags, users/roles and audit.
        </Typography>

        <Card padding="md" shadow="md">
          <Typography variant="h4">Session</Typography>
          <Typography variant="small" color="secondary">
            Status: {status}
          </Typography>
          <Typography variant="small" color="secondary">
            Access token expires in: {expiresIn}
          </Typography>

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
                    refreshSession(session)
                      .then((next) => {
                        setSession(next);
                        setStatus('Session refreshed');
                      })
                      .catch((err) => setError(String(err)));
                  }}
                >
                  Refresh session
                </Button>
                <Button size="sm" variant="outline" onClick={() => refreshAll().catch(() => undefined)}>
                  Refresh data
                </Button>
                <Button size="sm" variant="ghost" onClick={() => logout(session)}>
                  Logout
                </Button>
              </>
            )}
          </div>
          {error && (
            <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
              Error: {error}
            </Typography>
          )}
        </Card>

        {session && (
          <div style={styles.twoCols}>
            <Card padding="md" shadow="md">
              <Typography variant="h4">Operators</Typography>
              {operators.length === 0 && <Typography variant="small">No operators loaded.</Typography>}
              {operators.map((operator) => (
                <div key={operator.operatorId} style={{ marginBottom: 8 }}>
                  <Button
                    size="sm"
                    variant={selectedOperatorId === operator.operatorId ? 'primary' : 'outline'}
                    onClick={() => setSelectedOperatorId(operator.operatorId)}
                  >
                    {operator.name} ({operator.operatorId})
                  </Button>
                  <Typography variant="caption" color="secondary">
                    v{operator.version} · channels {operator.channelCount} · journeys {operator.journeyCount} · users{' '}
                    {operator.userCount}
                  </Typography>
                </div>
              ))}
            </Card>

            <Card padding="md" shadow="md">
              <Typography variant="h4">Profile editor</Typography>
              {!profile && <Typography variant="small">Select an operator to load profile.</Typography>}
              {profile && (
                <>
                  <Typography variant="small" color="secondary">
                    Operator: {profile.operatorId} · version {profile.version} · updated {profile.updatedAt}
                  </Typography>

                  <div style={{ marginTop: 10 }}>
                    <Typography variant="caption">Name</Typography>
                    <input
                      style={styles.input}
                      value={profileNameDraft}
                      onChange={(event) => setProfileNameDraft(event.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Typography variant="caption">Locales (comma separated)</Typography>
                    <input
                      style={styles.input}
                      value={profileLocalesDraft}
                      onChange={(event) => setProfileLocalesDraft(event.target.value)}
                    />
                  </div>

                  <Typography variant="caption" style={{ marginTop: 10 }}>
                    Channel feature flags
                  </Typography>
                  {Object.entries(profileFeaturesDraft).map(([channel, flags]) => (
                    <div key={channel} style={{ marginTop: 6 }}>
                      <Typography variant="small">{channel}</Typography>
                      <div style={styles.row}>
                        {Object.entries(flags).map(([flag, enabled]) => (
                          <label key={`${channel}-${flag}`} style={{ display: 'flex', gap: 4 }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(event) =>
                                toggleFeature(channel, flag, event.currentTarget.checked)
                              }
                            />
                            <span style={{ fontSize: 12 }}>{flag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ ...styles.row, marginTop: 10 }}>
                    <Button size="sm" onClick={() => saveProfile().catch((err) => setError(String(err)))}>
                      Save profile
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {session && selectedSummary && (
          <Card padding="md" shadow="md">
            <Typography variant="h4">Operator users and roles</Typography>
            <Typography variant="small" color="secondary">
              Selected operator: {selectedSummary.name} ({selectedSummary.operatorId})
            </Typography>

            {users.map((user) => (
              <div key={user.userId} style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                <Typography variant="body">
                  {user.displayName} · {user.email}
                </Typography>
                <div style={styles.row}>
                  <input
                    style={styles.input}
                    value={userRoleDrafts[user.userId] || ''}
                    onChange={(event) =>
                      setUserRoleDrafts((prev) => ({ ...prev, [user.userId]: event.target.value }))
                    }
                  />
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={userEnabledDrafts[user.userId] ?? user.enabled}
                      onChange={(event) =>
                        setUserEnabledDrafts((prev) => ({
                          ...prev,
                          [user.userId]: event.currentTarget.checked,
                        }))
                      }
                    />
                    enabled
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveUser(user.userId).catch((err) => setError(String(err)))}
                  >
                    Save user
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}

        {session && selectedSummary && (
          <Card padding="md" shadow="md">
            <Typography variant="h4">Audit timeline</Typography>
            {audit.length === 0 && <Typography variant="small">No audit entries yet.</Typography>}
            {audit.map((entry) => (
              <div key={`${entry.timestamp}-${entry.action}-${entry.targetId}`} style={{ marginTop: 10 }}>
                <Typography variant="small">
                  {entry.timestamp} · v{entry.version} · {entry.action} · {entry.scope}/{entry.targetId} ·
                  actor {entry.actor}
                </Typography>
                <div style={styles.codeBlock}>{JSON.stringify(entry.changes, null, 2)}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </DesignSystemProvider>
  );
}

export default App;
