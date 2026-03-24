import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, Panel, Typography } from '../../design-system';
import { fetchOperators, fetchOperatorDetails, patchProfile, patchUserRoles, useMockData } from '../../services/api-client';
import { styles } from '../../shared-styles';
import type {
  OperatorSummaryResponse,
  OperatorProfileResponse,
  ContentSummaryResponse,
  OfferSummaryResponse,
} from '../../types';
import type { OperatorDetails } from '../../services/api-client';

export type OperatorContext = {
  operatorId: string;
  profile: OperatorProfileResponse | null;
  contentItems: ContentSummaryResponse[];
  offers: OfferSummaryResponse[];
};

type Props = {
  onOperatorChange: (ctx: OperatorContext) => void;
  onError: (message: string) => void;
  onStatus: (message: string) => void;
  rightColumn?: React.ReactNode;
};

const MOCK_OPERATORS: OperatorSummaryResponse[] = [
  {
    operatorId: 'telco-pt',
    name: 'Telco Portugal',
    version: 3,
    updatedAt: '2026-03-20T14:30:00Z',
    locales: ['pt-PT', 'en-GB'],
    channelCount: 3,
    journeyCount: 5,
    userCount: 12,
  },
  {
    operatorId: 'telco-es',
    name: 'Telco Spain',
    version: 1,
    updatedAt: '2026-03-18T10:00:00Z',
    locales: ['es-ES', 'en-GB'],
    channelCount: 2,
    journeyCount: 3,
    userCount: 8,
  },
];

const MOCK_DETAILS: OperatorDetails = {
  profile: {
    operatorId: 'telco-pt',
    name: 'Telco Portugal',
    branding: {
      logoLight: '/logos/telco-pt-light.svg',
      logoDark: '/logos/telco-pt-dark.svg',
      favicon: '/favicon-telco-pt.ico',
      primaryColor: '#0073e6',
      secondaryColor: '#00b386',
    },
    featuresByChannel: {
      web: { dashboard: true, billing: true, usage: true, roaming: false, support: true },
      mobile: { dashboard: true, billing: true, usage: true, roaming: true, support: false },
    },
    locales: ['pt-PT', 'en-GB'],
    journeyCount: 5,
    version: 3,
    updatedAt: '2026-03-20T14:30:00Z',
  },
  users: [
    { userId: 'u-001', displayName: 'Ana Silva', email: 'ana.silva@telco-pt.com', roles: ['ADMIN', 'SUPPORT'], enabled: true, updatedAt: '2026-03-19T09:00:00Z' },
    { userId: 'u-002', displayName: 'Carlos Mendes', email: 'carlos.m@telco-pt.com', roles: ['SUPPORT'], enabled: true, updatedAt: '2026-03-15T11:30:00Z' },
    { userId: 'u-003', displayName: 'Maria Santos', email: 'maria.s@telco-pt.com', roles: ['ADMIN'], enabled: false, updatedAt: '2026-02-28T16:00:00Z' },
  ],
  audit: [
    { operatorId: 'telco-pt', scope: 'profile', targetId: 'telco-pt', action: 'UPDATE', actor: 'ana.silva@telco-pt.com', version: 3, timestamp: '2026-03-20T14:30:00Z', changes: { name: 'Telco Portugal' } },
    { operatorId: 'telco-pt', scope: 'user', targetId: 'u-003', action: 'DISABLE', actor: 'ana.silva@telco-pt.com', version: 2, timestamp: '2026-02-28T16:00:00Z', changes: { enabled: false } },
    { operatorId: 'telco-pt', scope: 'flags', targetId: 'web/roaming', action: 'UPDATE', actor: 'carlos.m@telco-pt.com', version: 1, timestamp: '2026-02-20T10:15:00Z', changes: { roaming: false } },
  ],
  contentItems: [
    { contentId: 'welcome-banner', locales: [{ locale: 'pt-PT', version: 2, state: 'PUBLISHED', updatedAt: '2026-03-18', author: 'ana.silva', reviewer: 'carlos.m' }, { locale: 'en-GB', version: 1, state: 'DRAFT', updatedAt: '2026-03-10', author: 'ana.silva', reviewer: null }] },
    { contentId: 'faq-billing', locales: [{ locale: 'pt-PT', version: 1, state: 'REVIEW', updatedAt: '2026-03-15', author: 'carlos.m', reviewer: 'ana.silva' }] },
  ],
  offers: [
    { offerId: 'summer-unlimited', version: 2, state: 'PUBLISHED', name: 'Summer Unlimited', visibleChannels: ['web', 'mobile'], eligibilityRules: { minTenure: 6 }, author: 'ana.silva', reviewer: 'carlos.m', updatedAt: '2026-03-19T12:00:00Z' },
    { offerId: 'family-bundle', version: 1, state: 'DRAFT', name: 'Family Bundle', visibleChannels: ['web'], eligibilityRules: {}, author: 'carlos.m', reviewer: null, updatedAt: '2026-03-10T08:00:00Z' },
  ],
};

export function OperatorPanel({ onOperatorChange, onError, onStatus, rightColumn }: Props) {
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const queryClient = useQueryClient();
  const isMock = useMockData();

  // --- Queries ---

  const { data: operators = [] } = useQuery<OperatorSummaryResponse[]>({
    queryKey: ['operators'],
    queryFn: () => (isMock ? Promise.resolve(MOCK_OPERATORS) : fetchOperators()),
  });

  // Auto-select first operator
  useEffect(() => {
    if (!selectedOperatorId && operators.length > 0) {
      setSelectedOperatorId(operators[0].operatorId);
    }
  }, [operators, selectedOperatorId]);

  const { data: details } = useQuery({
    queryKey: ['operators', selectedOperatorId, 'details'],
    queryFn: () => (isMock ? Promise.resolve(MOCK_DETAILS) : fetchOperatorDetails(selectedOperatorId)),
    enabled: !!selectedOperatorId,
  });

  const profile = details?.profile ?? null;
  const users = details?.users ?? [];
  const audit = details?.audit ?? [];

  // Notify parent when details change
  useEffect(() => {
    if (details && selectedOperatorId) {
      onOperatorChange({
        operatorId: selectedOperatorId,
        profile: details.profile,
        contentItems: details.contentItems,
        offers: details.offers,
      });
    }
  }, [details, selectedOperatorId]);

  // --- Form drafts ---

  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileLocalesDraft, setProfileLocalesDraft] = useState('');
  const [profileFeaturesDraft, setProfileFeaturesDraft] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<string, string>>({});
  const [userEnabledDrafts, setUserEnabledDrafts] = useState<Record<string, boolean>>({});

  // Sync drafts when server data changes
  useEffect(() => {
    if (!profile) return;
    setProfileNameDraft(profile.name);
    setProfileLocalesDraft(profile.locales.join(', '));
    setProfileFeaturesDraft(structuredClone(profile.featuresByChannel));
  }, [profile]);

  useEffect(() => {
    const nextRoleDrafts: Record<string, string> = {};
    const nextEnabledDrafts: Record<string, boolean> = {};
    for (const user of users) {
      nextRoleDrafts[user.userId] = user.roles.join(', ');
      nextEnabledDrafts[user.userId] = user.enabled;
    }
    setUserRoleDrafts(nextRoleDrafts);
    setUserEnabledDrafts(nextEnabledDrafts);
  }, [users]);

  const selectedSummary = useMemo(
    () => operators.find((item) => item.operatorId === selectedOperatorId) || null,
    [operators, selectedOperatorId]
  );

  // --- Mutations ---

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['operators'] });
  };

  const profileMutation = useMutation({
    mutationFn: () => {
      const locales = profileLocalesDraft
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return patchProfile(selectedOperatorId, {
        name: profileNameDraft.trim(),
        locales,
        featuresByChannel: profileFeaturesDraft,
      });
    },
    onSuccess: (payload) => {
      onStatus(`Profile saved (version ${payload.version})`);
      invalidateAll();
    },
    onError: (err) => onError(String(err)),
  });

  const userMutation = useMutation({
    mutationFn: (userId: string) => {
      const roles = (userRoleDrafts[userId] || '')
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      return patchUserRoles(selectedOperatorId, userId, {
        roles,
        enabled: userEnabledDrafts[userId],
      });
    },
    onSuccess: (updated) => {
      onStatus(`User ${updated.displayName} updated`);
      invalidateAll();
    },
    onError: (err) => onError(String(err)),
  });

  const toggleFeature = (channel: string, flag: string, value: boolean) => {
    setProfileFeaturesDraft((prev) => ({
      ...prev,
      [channel]: {
        ...(prev[channel] || {}),
        [flag]: value,
      },
    }));
  };

  return (
    <>
      <div className="admin-dashboard-grid" style={styles.twoCols}>
        {/* Operators list */}
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
          <div style={{ ...styles.row, marginTop: 8 }}>
            <Button size="sm" variant="outline" onClick={() => invalidateAll()}>
              Refresh data
            </Button>
          </div>
        </Panel>

        {/* Profile editor */}
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
                <Button size="sm" onClick={() => profileMutation.mutate()}>
                  Save profile
                </Button>
              </div>
            </>
          )}
        </Panel>

        {/* Right column: content/offers passed from parent */}
        <div style={styles.rightColumn}>
          {rightColumn}
        </div>
      </div>

      {/* Users and roles panel */}
      {selectedSummary && (
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
                  onClick={() => userMutation.mutate(user.userId)}
                >
                  Save user
                </Button>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {/* Audit timeline */}
      {selectedSummary && (
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
    </>
  );
}
