import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Badge, Button, DesignSystemProvider, Field, Panel, Typography } from './design-system';
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

type ContentState = 'DRAFT' | 'REVIEW' | 'PUBLISHED';

type ContentLocaleSummary = {
  locale: string;
  version: number;
  state: ContentState;
  updatedAt: string;
  author: string;
  reviewer: string | null;
};

type ContentSummaryResponse = {
  contentId: string;
  locales: ContentLocaleSummary[];
};

type ContentVersionResponse = {
  contentId: string;
  locale: string;
  version: number;
  state: ContentState;
  title: string;
  body: string;
  notes: string | null;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

type ContentLocaleResponse = {
  contentId: string;
  locale: string;
  current: ContentVersionResponse;
  history: ContentVersionResponse[];
};

type OfferState = 'DRAFT' | 'APPROVAL' | 'PUBLISHED' | 'RETIRED';

type OfferSummaryResponse = {
  offerId: string;
  version: number;
  state: OfferState;
  name: string;
  visibleChannels: string[];
  eligibilityRules: Record<string, unknown>;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

type OfferVersionResponse = {
  offerId: string;
  version: number;
  state: OfferState;
  name: string;
  description: string;
  eligibilityRules: Record<string, unknown>;
  visibleChannels: string[];
  notes: string | null;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

type OfferDetailResponse = {
  offerId: string;
  current: OfferVersionResponse;
  history: OfferVersionResponse[];
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
    gridTemplateColumns: '1fr 1.6fr 1.4fr',
    gap: 'var(--spacing-4)',
    alignItems: 'start',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'users' | 'journeys' | 'audit' | 'cms'>('dashboard');

  const [operators, setOperators] = useState<OperatorSummaryResponse[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [profile, setProfile] = useState<OperatorProfileResponse | null>(null);
  const [users, setUsers] = useState<OperatorUserResponse[]>([]);
  const [audit, setAudit] = useState<OperatorAuditEntry[]>([]);

  const [contentItems, setContentItems] = useState<ContentSummaryResponse[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedContentLocale, setSelectedContentLocale] = useState('');
  const [contentDetail, setContentDetail] = useState<ContentLocaleResponse | null>(null);

  const [contentTitleDraft, setContentTitleDraft] = useState('');
  const [contentBodyDraft, setContentBodyDraft] = useState('');
  const [contentNotesDraft, setContentNotesDraft] = useState('');
  const [contentStateDraft, setContentStateDraft] = useState<ContentState>('DRAFT');
  const [contentReviewerDraft, setContentReviewerDraft] = useState('');

  const [offers, setOffers] = useState<OfferSummaryResponse[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [newOfferIdDraft, setNewOfferIdDraft] = useState('');
  const [offerDetail, setOfferDetail] = useState<OfferDetailResponse | null>(null);

  const [offerNameDraft, setOfferNameDraft] = useState('');
  const [offerDescriptionDraft, setOfferDescriptionDraft] = useState('');
  const [offerChannelsDraft, setOfferChannelsDraft] = useState('');
  const [offerEligibilityDraft, setOfferEligibilityDraft] = useState('{}');
  const [offerStateDraft, setOfferStateDraft] = useState<OfferState>('DRAFT');
  const [offerNotesDraft, setOfferNotesDraft] = useState('');
  const [offerReviewerDraft, setOfferReviewerDraft] = useState('');

  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileLocalesDraft, setProfileLocalesDraft] = useState('');
  const [profileFeaturesDraft, setProfileFeaturesDraft] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<string, string>>({});
  const [userEnabledDrafts, setUserEnabledDrafts] = useState<Record<string, boolean>>({});

  const expiresIn = session
    ? Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))
    : 'n/a';
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
    const [profileResp, usersResp, auditResp, contentResp, offersResp] = await Promise.all([
      authedFetch(`/api/v1/admin/operators/${operatorId}/profile`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/users`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/audit?limit=30`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/content`),
      authedFetch(`/api/v1/admin/operators/${operatorId}/offers`),
    ]);

    const profilePayload = (await profileResp.json()) as OperatorProfileResponse;
    const usersPayload = (await usersResp.json()) as OperatorUserResponse[];
    const auditPayload = (await auditResp.json()) as OperatorAuditEntry[];
    const contentPayload = (await contentResp.json()) as ContentSummaryResponse[];
    const offersPayload = (await offersResp.json()) as OfferSummaryResponse[];

    setProfile(profilePayload);
    setUsers(usersPayload);
    setAudit(auditPayload);
    setContentItems(contentPayload);
    setOffers(offersPayload);
    setNewOfferIdDraft('');
    setContentDetail(null);
    setOfferDetail(null);

    const hasSelectedContent =
      selectedContentId && contentPayload.some((item) => item.contentId === selectedContentId);
    const nextSelectedContentId = hasSelectedContent
      ? selectedContentId
      : contentPayload[0]?.contentId || '';
    setSelectedContentId(nextSelectedContentId);

    if (nextSelectedContentId) {
      const selectedItem = contentPayload.find((item) => item.contentId === nextSelectedContentId);
      const locales = selectedItem?.locales?.map((entry) => entry.locale) || [];
      const preferred = profilePayload.locales.find((locale) => locales.includes(locale));
      setSelectedContentLocale(preferred || locales[0] || '');
    } else {
      setSelectedContentLocale('');
    }

    const hasSelectedOffer =
      selectedOfferId && offersPayload.some((item) => item.offerId === selectedOfferId);
    const nextOfferId = hasSelectedOffer ? selectedOfferId : offersPayload[0]?.offerId || '';
    setSelectedOfferId(nextOfferId);

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

  const contentStateBadgeVariant = (state: ContentState) => {
    switch (state) {
      case 'PUBLISHED':
        return 'success';
      case 'REVIEW':
        return 'info';
      case 'DRAFT':
      default:
        return 'warning';
    }
  };

  const offerStateBadgeVariant = (state: OfferState) => {
    switch (state) {
      case 'PUBLISHED':
        return 'success';
      case 'APPROVAL':
        return 'info';
      case 'RETIRED':
        return 'neutral';
      case 'DRAFT':
      default:
        return 'warning';
    }
  };

  const startNewOffer = () => {
    const candidate = newOfferIdDraft.trim().toLowerCase();
    if (!candidate) {
      setError('Offer ID is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(candidate)) {
      setError('Offer ID must be kebab-case (lowercase, numbers, hyphen)');
      return;
    }
    setError(null);
    setSelectedOfferId(candidate);
    setOfferDetail(null);
    setOfferNameDraft('');
    setOfferDescriptionDraft('');
    setOfferChannelsDraft('');
    setOfferEligibilityDraft('{}');
    setOfferStateDraft('DRAFT');
    setOfferNotesDraft('');
    setOfferReviewerDraft('');
    setNewOfferIdDraft('');
    setStatus(`Preparing new offer ${candidate}`);
  };

  const loadContentDetail = async (operatorId: string, contentId: string, locale: string) => {
    const response = await authedFetch(
      `/api/v1/admin/operators/${operatorId}/content/${contentId}?locale=${encodeURIComponent(locale)}`
    );
    const payload = (await response.json()) as ContentLocaleResponse;

    setContentDetail(payload);
    setContentTitleDraft(payload.current.title);
    setContentBodyDraft(payload.current.body);
    setContentNotesDraft(payload.current.notes || '');
    setContentStateDraft(payload.current.state);
    setContentReviewerDraft(payload.current.reviewer || '');
  };

  const loadOfferDetail = async (operatorId: string, offerId: string) => {
    const response = await authedFetch(`/api/v1/admin/operators/${operatorId}/offers/${offerId}`);
    const payload = (await response.json()) as OfferDetailResponse;

    setOfferDetail(payload);
    setOfferNameDraft(payload.current.name);
    setOfferDescriptionDraft(payload.current.description);
    setOfferChannelsDraft(payload.current.visibleChannels.join(', '));
    setOfferEligibilityDraft(JSON.stringify(payload.current.eligibilityRules || {}, null, 2));
    setOfferStateDraft(payload.current.state);
    setOfferNotesDraft(payload.current.notes || '');
    setOfferReviewerDraft(payload.current.reviewer || '');
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

  const saveContent = async () => {
    if (!selectedOperatorId || !selectedContentId || !selectedContentLocale) return;

    const response = await authedFetch(
      `/api/v1/admin/operators/${selectedOperatorId}/content/${selectedContentId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: selectedContentLocale,
          title: contentTitleDraft.trim(),
          body: contentBodyDraft.trim(),
          notes: contentNotesDraft.trim() ? contentNotesDraft.trim() : null,
          state: contentStateDraft,
          reviewer: contentReviewerDraft.trim() ? contentReviewerDraft.trim() : null,
        }),
      }
    );

    const payload = (await response.json()) as ContentVersionResponse;
    setStatus(
      `Content ${payload.contentId}/${payload.locale} saved (v${payload.version} ${payload.state})`
    );

    await loadOperatorDetails(selectedOperatorId);
    await loadContentDetail(selectedOperatorId, payload.contentId, payload.locale);
  };

  const saveOffer = async () => {
    if (!selectedOperatorId || !selectedOfferId) return;

    const channels = offerChannelsDraft
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    let eligibilityRules: Record<string, unknown>;
    try {
      eligibilityRules = JSON.parse(offerEligibilityDraft || '{}') as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Eligibility rules must be valid JSON: ${String(err)}`);
    }

    const response = await authedFetch(
      `/api/v1/admin/operators/${selectedOperatorId}/offers/${selectedOfferId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: offerNameDraft.trim(),
          description: offerDescriptionDraft.trim(),
          eligibilityRules,
          visibleChannels: channels,
          state: offerStateDraft,
          notes: offerNotesDraft.trim() ? offerNotesDraft.trim() : null,
          reviewer: offerReviewerDraft.trim() ? offerReviewerDraft.trim() : null,
        }),
      }
    );

    const payload = (await response.json()) as OfferVersionResponse;
    setStatus(`Offer ${payload.offerId} saved (v${payload.version} ${payload.state})`);

    await loadOperatorDetails(selectedOperatorId);
    await loadOfferDetail(selectedOperatorId, payload.offerId);
  };

  const rollbackContent = async (targetVersion: number | null) => {
    if (!selectedOperatorId || !selectedContentId || !selectedContentLocale) return;

    const response = await authedFetch(
      `/api/v1/admin/operators/${selectedOperatorId}/content/${selectedContentId}/rollback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: selectedContentLocale,
          version: targetVersion,
        }),
      }
    );

    const payload = (await response.json()) as ContentVersionResponse;
    setStatus(`Rolled back ${payload.contentId}/${payload.locale} (new v${payload.version})`);

    await loadOperatorDetails(selectedOperatorId);
    await loadContentDetail(selectedOperatorId, payload.contentId, payload.locale);
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
      setContentItems([]);
      setSelectedContentId('');
      setSelectedContentLocale('');
      setContentDetail(null);
      setOffers([]);
      setSelectedOfferId('');
      setNewOfferIdDraft('');
      setOfferDetail(null);
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

  useEffect(() => {
    if (!session || !selectedOperatorId || !selectedContentId || !selectedContentLocale) {
      setContentDetail(null);
      return;
    }

    loadContentDetail(selectedOperatorId, selectedContentId, selectedContentLocale).catch((err) => {
      const message = err instanceof Error ? err.message : 'Failed loading content details';
      setError(message);
    });
  }, [session, selectedOperatorId, selectedContentId, selectedContentLocale]);

  useEffect(() => {
    if (!session || !selectedOperatorId || !selectedOfferId) {
      setOfferDetail(null);
      return;
    }

    loadOfferDetail(selectedOperatorId, selectedOfferId).catch((err) => {
      const message = err instanceof Error ? err.message : 'Failed loading offer details';
      if (typeof message === 'string' && message.startsWith('404')) {
        setOfferDetail(null);
        return;
      }
      setError(message);
    });
  }, [session, selectedOperatorId, selectedOfferId]);

  return (
    <DesignSystemProvider>
      <div style={styles.container}>
        <Typography variant="h2">MyTelco Admin Portal</Typography>
        
        {/* Tab Navigation */}
        {session && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              ['dashboard', 'Dashboard'],
              ['analytics', 'Analytics'],
              ['users', 'Users'],
              ['journeys', 'Journeys'],
              ['audit', 'Audit Log'],
              ['cms', 'CMS Content']
            ].map(([key, label]) => (
              <Button
                key={key}
                variant={activeTab === key ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        <Typography variant="body" color="secondary">
          Operator metadata management (backend-first): profile, channel flags, users/roles and
          audit.
        </Typography>

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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshAll().catch(() => undefined)}
                >
                  Refresh data
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

        {/* Dashboard Tab */}
        {session && activeTab === 'dashboard' && (
          <div style={styles.twoCols}>
            <Panel
              title="Operators"
              subtitle="Select an operator to manage profile, users and audit metadata"
            >
              {operators.length === 0 && (
                <Typography variant="small">No operators loaded.</Typography>
              )}
              {operators.map((operator) => (
                <div key={operator.operatorId} style={{ marginBottom: 8 }}>
                  <div style={styles.row}>
                    <Button
                      size="sm"
                      variant={selectedOperatorId === operator.operatorId ? 'primary' : 'outline'}
                      onClick={() => setSelectedOperatorId(operator.operatorId)}
                    >
                      {operator.name} ({operator.operatorId})
                    </Button>
                    <Badge variant="neutral">v{operator.version}</Badge>
                    <Badge variant="info">channels {operator.channelCount}</Badge>
                    <Badge variant="info">journeys {operator.journeyCount}</Badge>
                    <Badge variant="info">users {operator.userCount}</Badge>
                  </div>
                  <Typography variant="caption" color="secondary">
                    Locales: {operator.locales.join(', ') || 'n/a'} · Updated {operator.updatedAt}
                  </Typography>
                </div>
              ))}
            </Panel>

            <Panel
              title="Profile editor"
              subtitle="Edit operator metadata and feature matrix. Changes create a new version."
            >
              {!profile && (
                <Typography variant="small">Select an operator to load profile.</Typography>
              )}
              {profile && (
                <>
                  <div style={styles.row}>
                    <Badge variant="neutral">Operator: {profile.operatorId}</Badge>
                    <Badge variant="info">Version: {profile.version}</Badge>
                    <Badge variant="neutral">Updated: {profile.updatedAt}</Badge>
                  </div>

                  <Field label="Name">
                    <input
                      style={styles.input}
                      value={profileNameDraft}
                      onChange={(event) => setProfileNameDraft(event.target.value)}
                    />
                  </Field>

                  <Field
                    label="Locales"
                    helper="Comma-separated locale list. Example: en-GB, pt-PT, es-ES"
                  >
                    <input
                      style={styles.input}
                      value={profileLocalesDraft}
                      onChange={(event) => setProfileLocalesDraft(event.target.value)}
                    />
                  </Field>

                  <Field
                    label="Branding preview"
                    helper="Read-only branding metadata from operator config."
                  >
                    <div style={styles.row}>
                      <Badge variant="neutral">primary {profile.branding.primaryColor}</Badge>
                      <Badge variant="neutral">secondary {profile.branding.secondaryColor}</Badge>
                      <Badge variant="neutral">logo(light) {profile.branding.logoLight}</Badge>
                    </div>
                  </Field>

                  <Field label="Channel feature flags">
                    {Object.entries(profileFeaturesDraft).map(([channel, flags]) => (
                      <div key={channel} style={{ marginTop: 6 }}>
                        <Typography variant="small">{channel}</Typography>
                        <div style={styles.row}>
                          {Object.entries(flags).map(([flag, enabled]) => (
                            <label
                              key={`${channel}-${flag}`}
                              style={{
                                display: 'inline-flex',
                                gap: 6,
                                alignItems: 'center',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: 999,
                                padding: '4px 10px',
                                background: enabled
                                  ? 'rgba(22, 163, 74, 0.10)'
                                  : 'var(--color-background-secondary)',
                              }}
                            >
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
                  </Field>

                  <div style={styles.row}>
                    <Button
                      size="sm"
                      onClick={() => saveProfile().catch((err) => setError(String(err)))}
                    >
                      Save profile
                    </Button>
                  </div>
                </>
              )}
            </Panel>

            <div style={styles.rightColumn}>
              <Panel
                title="Content (CMS)"
                subtitle="Manage localized content versions and rollback"
              >
                {contentItems.length === 0 && (
                  <Typography variant="small">No content items yet.</Typography>
                )}
                {contentItems.map((item) => (
                  <div key={item.contentId} style={{ marginBottom: 6 }}>
                    <Button
                      size="sm"
                      variant={selectedContentId === item.contentId ? 'primary' : 'outline'}
                      onClick={() => {
                        setSelectedContentId(item.contentId);
                        const locales = item.locales.map((e) => e.locale);
                        const preferred = profile?.locales.find((l) => locales.includes(l));
                        setSelectedContentLocale(preferred || locales[0] || '');
                      }}
                    >
                      {item.contentId}
                    </Button>
                    <span style={{ marginLeft: 6, fontSize: 12 }}>
                      {item.locales.map((l) => (
                        <Badge key={l.locale} variant="neutral" style={{ marginRight: 4 }}>
                          {l.locale}:v{l.version} {l.state}
                        </Badge>
                      ))}
                    </span>
                  </div>
                ))}

                {contentDetail && selectedContentLocale && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                    <div style={styles.row}>
                      <Field label="Locale">
                        <select
                          style={styles.input}
                          value={selectedContentLocale}
                          onChange={(e) => setSelectedContentLocale(e.target.value)}
                        >
                          {contentDetail.history
                            .map((v) => v.locale)
                            .filter((v, i, arr) => arr.indexOf(v) === i)
                            .map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Badge variant={contentStateBadgeVariant(contentDetail.current.state)}>
                        {contentDetail.current.state}
                      </Badge>
                      <Typography variant="caption" color="secondary">
                        v{contentDetail.current.version} by {contentDetail.current.author}
                      </Typography>
                    </div>

                    <Field label="Title">
                      <input
                        style={{ ...styles.input, width: '100%' }}
                        value={contentTitleDraft}
                        onChange={(e) => setContentTitleDraft(e.target.value)}
                      />
                    </Field>

                    <Field label="Body (markdown)">
                      <textarea
                        style={{
                          ...styles.input,
                          width: '100%',
                          minHeight: 120,
                          fontFamily: 'monospace',
                          resize: 'vertical',
                        }}
                        value={contentBodyDraft}
                        onChange={(e) => setContentBodyDraft(e.target.value)}
                      />
                    </Field>

                    <Field label="Notes (optional)">
                      <input
                        style={{ ...styles.input, width: '100%' }}
                        value={contentNotesDraft}
                        onChange={(e) => setContentNotesDraft(e.target.value)}
                      />
                    </Field>

                    <Field label="State">
                      <div style={styles.row}>
                        {(['DRAFT', 'REVIEW', 'PUBLISHED'] as ContentState[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={contentStateDraft === st ? 'primary' : 'outline'}
                            onClick={() => setContentStateDraft(st)}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Reviewer (optional)">
                      <input
                        style={styles.input}
                        value={contentReviewerDraft}
                        onChange={(e) => setContentReviewerDraft(e.target.value)}
                      />
                    </Field>

                    <div style={styles.row}>
                      <Button
                        size="sm"
                        onClick={() => saveContent().catch((err) => setError(String(err)))}
                      >
                        Save content
                      </Button>
                      {contentDetail.history.length > 1 && (
                        <select
                          style={styles.input}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) rollbackContent(Number(v));
                          }}
                        >
                          <option value="">Rollback to...</option>
                          {contentDetail.history
                            .filter((h) => h.version !== contentDetail.current.version)
                            .map((h) => (
                              <option key={h.version} value={h.version}>
                                v{h.version} ({h.state})
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
              <Panel title="Offers" subtitle="Offer lifecycle: draft, approval, publish, retire">
                {offers.length === 0 && (
                  <Typography variant="small">No offers configured for this operator.</Typography>
                )}
                {offers.map((offer) => (
                  <div key={offer.offerId} style={{ marginBottom: 6 }}>
                    <div style={styles.row}>
                      <Button
                        size="sm"
                        variant={selectedOfferId === offer.offerId ? 'primary' : 'outline'}
                        onClick={() => {
                          setSelectedOfferId(offer.offerId);
                          setNewOfferIdDraft('');
                        }}
                      >
                        {offer.name} ({offer.offerId})
                      </Button>
                      <Badge variant={offerStateBadgeVariant(offer.state)}>{offer.state}</Badge>
                      <Badge variant="neutral">v{offer.version}</Badge>
                    </div>
                    <Typography variant="caption" color="secondary">
                      Channels: {offer.visibleChannels.join(', ') || 'n/a'} · Updated{' '}
                      {offer.updatedAt}
                    </Typography>
                  </div>
                ))}
                <Field label="Start new offer (kebab-case)">
                  <div style={styles.row}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="plan-new-catalog-offer"
                      value={newOfferIdDraft}
                      onChange={(event) => setNewOfferIdDraft(event.target.value)}
                    />
                    <Button size="sm" variant="outline" onClick={startNewOffer}>
                      Start new offer
                    </Button>
                  </div>
                </Field>
                {offerDetail ? (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                    <div style={styles.row}>
                      <Badge variant={offerStateBadgeVariant(offerDetail.current.state)}>
                        {offerDetail.current.state}
                      </Badge>
                      <Badge variant="neutral">v{offerDetail.current.version}</Badge>
                      <Typography variant="caption" color="secondary">
                        {offerDetail.current.author} · Updated {offerDetail.current.updatedAt}
                      </Typography>
                    </div>
                    <Field label="Name">
                      <input
                        style={{ ...styles.input, width: '100%' }}
                        value={offerNameDraft}
                        onChange={(event) => setOfferNameDraft(event.target.value)}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        style={{
                          ...styles.input,
                          width: '100%',
                          minHeight: 80,
                          resize: 'vertical',
                        }}
                        value={offerDescriptionDraft}
                        onChange={(event) => setOfferDescriptionDraft(event.target.value)}
                      />
                    </Field>
                    <Field label="Visible channels (comma separated)">
                      <input
                        style={styles.input}
                        value={offerChannelsDraft}
                        onChange={(event) => setOfferChannelsDraft(event.target.value)}
                      />
                    </Field>
                    <Field label="Eligibility rules (JSON)">
                      <textarea
                        style={{
                          ...styles.input,
                          width: '100%',
                          minHeight: 120,
                          fontFamily: 'monospace',
                          resize: 'vertical',
                        }}
                        value={offerEligibilityDraft}
                        onChange={(event) => setOfferEligibilityDraft(event.target.value)}
                      />
                    </Field>
                    <Field label="State">
                      <div style={styles.row}>
                        {(['DRAFT', 'APPROVAL', 'PUBLISHED', 'RETIRED'] as OfferState[]).map(
                          (state) => (
                            <Button
                              key={state}
                              size="sm"
                              variant={offerStateDraft === state ? 'primary' : 'outline'}
                              onClick={() => setOfferStateDraft(state)}
                            >
                              {state}
                            </Button>
                          )
                        )}
                      </div>
                    </Field>
                    <Field label="Notes (optional)">
                      <input
                        style={styles.input}
                        value={offerNotesDraft}
                        onChange={(event) => setOfferNotesDraft(event.target.value)}
                      />
                    </Field>
                    <Field label="Reviewer (optional)">
                      <input
                        style={styles.input}
                        value={offerReviewerDraft}
                        onChange={(event) => setOfferReviewerDraft(event.target.value)}
                      />
                    </Field>
                    <div style={styles.row}>
                      <Button
                        size="sm"
                        onClick={() => saveOffer().catch((err) => setError(String(err)))}
                      >
                        Save offer
                      </Button>
                    </div>
                    {offerDetail.history.length > 1 && (
                      <div style={{ marginTop: 12 }}>
                        <Typography variant="small">History</Typography>
                        {offerDetail.history.map((entry) => (
                          <div key={`${entry.offerId}-${entry.version}`} style={styles.row}>
                            <Badge variant={offerStateBadgeVariant(entry.state)}>
                              {entry.state}
                            </Badge>
                            <Badge variant="neutral">v{entry.version}</Badge>
                            <Typography variant="caption" color="secondary">
                              {entry.updatedAt} · {entry.author}
                            </Typography>
                            <Typography variant="caption" color="secondary">
                              {entry.notes || entry.description}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Typography variant="small">
                    Select or start an offer to edit its lifecycle.
                  </Typography>
                )}
              </Panel>
            </div>
          </div>
        )}

        {session && selectedSummary && (
          <Panel
            title="Operator users and roles"
            subtitle={`Selected operator: ${selectedSummary.name} (${selectedSummary.operatorId})`}
          >
            {users.map((user) => (
              <div
                key={user.userId}
                style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}
              >
                <div style={styles.row}>
                  <Typography variant="body">
                    {user.displayName} · {user.email}
                  </Typography>
                  <Badge variant={user.enabled ? 'success' : 'warning'}>
                    {user.enabled ? 'enabled' : 'disabled'}
                  </Badge>
                </div>

                <Field label="Roles (comma separated)">
                  <input
                    style={styles.input}
                    value={userRoleDrafts[user.userId] || ''}
                    onChange={(event) =>
                      setUserRoleDrafts((prev) => ({ ...prev, [user.userId]: event.target.value }))
                    }
                  />
                </Field>

                <div style={styles.row}>
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
          </Panel>
        )}

        {session && selectedSummary && (
          <Panel
            title="Audit timeline"
            subtitle="Versioned audit trail for profile and user changes"
          >
            {audit.length === 0 && <Typography variant="small">No audit entries yet.</Typography>}
            {audit.map((entry) => (
              <div
                key={`${entry.timestamp}-${entry.action}-${entry.targetId}`}
                style={{ marginTop: 10 }}
              >
                <div style={styles.row}>
                  <Badge variant="neutral">{entry.timestamp}</Badge>
                  <Badge variant="info">v{entry.version}</Badge>
                  <Badge variant="neutral">{entry.action}</Badge>
                  <Badge variant="neutral">
                    {entry.scope}/{entry.targetId}
                  </Badge>
                  <Badge variant="neutral">actor {entry.actor}</Badge>
                </div>
                <div style={styles.codeBlock}>{JSON.stringify(entry.changes, null, 2)}</div>
              </div>
            ))}
          </Panel>
        )}
        )}

        {/* Analytics Tab */}
        {session && activeTab === 'analytics' && <AnalyticsPanel />}

        {/* Users Tab */}
        {session && activeTab === 'users' && <UsersPanel />}

        {/* Journeys Tab */}
        {session && activeTab === 'journeys' && <JourneysPanel />}

        {/* Audit Tab */}
        {session && activeTab === 'audit' && <AuditPanel />}

        {/* CMS Tab */}
        {session && activeTab === 'cms' && (
          <>
            {/* CMS content is rendered in the dashboard view when cms is selected */}
          </>
        )}
      </div>
    </DesignSystemProvider>
  );
}

export default App;
