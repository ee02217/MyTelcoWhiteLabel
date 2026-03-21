import { Button, Card, Typography } from '../design-system';
import { useEffect, useMemo, useState } from 'react';

export type FamilyRolesResponse = {
  accountOwnerCustomerId: string;
  actingLineId: string;
  actingRole: FamilyRole;
  actingPermissions: string[];
  assignments: FamilyRoleEntry[];
  permissionMatrix: Record<string, string[]>;
  generatedAt: string;
};

export type FamilyRoleEntry = {
  lineId: string;
  msisdn: string;
  nickname: string;
  status: string;
  role: FamilyRole;
  permissions: string[];
};

export type FamilyRole = 'OWNER' | 'MANAGER' | 'MEMBER';

const ROLE_LABELS: Record<FamilyRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

const ROLE_OPTIONS: FamilyRole[] = ['OWNER', 'MANAGER', 'MEMBER'];

interface Props {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const mergeRow = (entry: FamilyRoleEntry) => `${entry.lineId} (${entry.msisdn})`;

export function FamilyRolesPanel({ authedFetch }: Props) {
  const [response, setResponse] = useState<FamilyRolesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [roleDrafts, setRoleDrafts] = useState<Record<string, FamilyRole>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingLine, setSavingLine] = useState<string | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch('/api/v1/customer/family/roles');
      const payload = (await res.json()) as FamilyRolesResponse;
      setResponse(payload);
      const assignments: Record<string, FamilyRole> = {};
      payload.assignments.forEach((entry) => {
        assignments[entry.lineId] = entry.role;
      });
      setRoleDrafts(assignments);
      setNoteDrafts({});
      setStatus(`Loaded ${payload.assignments.length} assignments`);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed loading family roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const updateRole = async (lineId: string) => {
    const role = roleDrafts[lineId];
    if (!role) return;

    setSavingLine(lineId);
    setStatus(null);
    try {
      await authedFetch(`/api/v1/customer/family/roles/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, note: noteDrafts[lineId] || null }),
      });
      setStatus(`Saved ${lineId} as ${ROLE_LABELS[role]}`);
      await loadRoles();
    } catch (err) {
      setError(typeof err === 'string' ? err : `Failed to save ${lineId}`);
    } finally {
      setSavingLine(null);
    }
  };

  const permissionRows = useMemo(() => {
    if (!response) return [];
    return Object.entries(response.permissionMatrix).map(([role, permissions]) => ({
      role,
      permissions,
    }));
  }, [response]);

  return (
    <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
      <Typography variant="h4">Family roles (Issue #52)</Typography>
      <Typography variant="small" color="secondary">
        Manage line assignments, view current permissions, and keep the household operational (owner
        &gt; manager &gt; member).
      </Typography>
      <div style={{ marginTop: 12 }}>
        {error && (
          <Typography variant="small" color="danger" style={{ marginBottom: 6 }}>
            {error}
          </Typography>
        )}
        {status && (
          <Typography variant="small" color="success" style={{ marginBottom: 6 }}>
            {status}
          </Typography>
        )}
        {loading && <Typography variant="small">Loading family roles…</Typography>}
        {!loading && !response && (
          <Typography variant="small">No family roles data yet.</Typography>
        )}
        {!loading && response && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {response.assignments.map((assignment) => (
              <div
                key={assignment.lineId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 4px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <div>
                  <Typography variant="body">{mergeRow(assignment)}</Typography>
                  <Typography variant="small" color="secondary">
                    {assignment.nickname || 'No nickname'} · {assignment.status}
                  </Typography>
                </div>
                <select
                  value={roleDrafts[assignment.lineId] ?? assignment.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as FamilyRole;
                    setRoleDrafts((prev) => ({ ...prev, [assignment.lineId]: nextRole }));
                  }}
                  style={{
                    width: '100%',
                    borderRadius: 4,
                    border: '1px solid #cbd5f5',
                    padding: '4px 6px',
                  }}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Note (optional)"
                  value={noteDrafts[assignment.lineId] || ''}
                  onChange={(event) =>
                    setNoteDrafts((prev) => ({ ...prev, [assignment.lineId]: event.target.value }))
                  }
                  style={{
                    width: '100%',
                    borderRadius: 4,
                    border: '1px solid #cbd5f5',
                    padding: '4px 6px',
                  }}
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => updateRole(assignment.lineId)}
                  disabled={savingLine === assignment.lineId}
                >
                  Save
                </Button>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <Typography variant="small" color="secondary">
                Permission matrix for quick reference
              </Typography>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {permissionRows.map((row) => (
                  <div
                    key={row.role}
                    style={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 6, padding: 8 }}
                  >
                    <Typography variant="body">{ROLE_LABELS[row.role as FamilyRole]}</Typography>
                    <Typography variant="small" color="secondary">
                      {row.permissions.join(', ')}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
