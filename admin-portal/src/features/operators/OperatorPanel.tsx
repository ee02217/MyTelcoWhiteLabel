import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, Panel, Typography } from '../../design-system';
import { fetchOperators, fetchOperatorDetails, patchProfile, patchUserRoles } from '../../services/api-client';
import { styles } from '../../shared-styles';
import type {
  OperatorSummaryResponse,
  OperatorProfileResponse,
  ContentSummaryResponse,
  OfferSummaryResponse,
} from '../../types';

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

export function OperatorPanel({ onOperatorChange, onError, onStatus, rightColumn }: Props) {
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const queryClient = useQueryClient();

  // --- Queries ---

  const { data: operators = [] } = useQuery<OperatorSummaryResponse[]>({
    queryKey: ['operators'],
    queryFn: fetchOperators,
  });

  // Auto-select first operator
  useEffect(() => {
    if (!selectedOperatorId && operators.length > 0) {
      setSelectedOperatorId(operators[0].operatorId);
    }
  }, [operators, selectedOperatorId]);

  const { data: details } = useQuery({
    queryKey: ['operators', selectedOperatorId, 'details'],
    queryFn: () => fetchOperatorDetails(selectedOperatorId),
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
