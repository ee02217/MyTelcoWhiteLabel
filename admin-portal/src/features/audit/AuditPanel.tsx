import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Table, type TableColumn } from '../../design-system';
import { fetchAuditLogs, fetchAuditActionTypes, useMockData } from '../../services/api-client';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ipAddress: string;
  details: Record<string, unknown>;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

const MOCK_ACTION_TYPES = ['USER_CREATE', 'USER_UPDATE', 'LOGIN', 'LOGIN_FAILED', 'PLAN_CHANGE', 'LINE_ADD', 'LINE_CANCEL', 'PAYMENT'];

const MOCK_LOGS: AuditLog[] = [
  { id: '1', timestamp: '2026-03-21T10:30:45Z', action: 'USER_CREATE', user: 'admin@mytelco.com', ipAddress: '192.168.1.100', details: { resource: 'user-123' } },
  { id: '2', timestamp: '2026-03-21T10:29:12Z', action: 'PLAN_CHANGE', user: 'operator@mytelco.com', ipAddress: '192.168.1.101', details: { resource: 'line-456', changes: { from: 'Basic', to: 'Premium' } } },
  { id: '3', timestamp: '2026-03-21T10:28:33Z', action: 'LOGIN', user: 'user5@example.com', ipAddress: '192.168.1.102', details: { resource: 'session-789' } },
  { id: '4', timestamp: '2026-03-21T10:27:01Z', action: 'LINE_CANCEL', user: 'admin@mytelco.com', ipAddress: '192.168.1.100', details: { resource: 'line-789' } },
  { id: '5', timestamp: '2026-03-21T10:25:22Z', action: 'PAYMENT', user: 'user2@example.com', ipAddress: '192.168.1.105', details: { resource: 'invoice-001', amount: 35.99 } },
];

const getActionColor = (action: string) => {
  if (action.includes('DELETE')) return '#e74c3c';
  if (action.includes('CREATE')) return '#27ae60';
  if (action.includes('UPDATE')) return '#f39c12';
  if (action.includes('LOGIN')) return '#3498db';
  return '#666';
};

const auditColumns: TableColumn<AuditLog>[] = [
  {
    key: 'timestamp',
    header: 'Timestamp',
    style: { whiteSpace: 'nowrap' },
    render: (log) => <>{new Date(log.timestamp).toLocaleString()}</>,
  },
  {
    key: 'action',
    header: 'Action',
    render: (log) => (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: getActionColor(log.action) + '20',
        color: getActionColor(log.action),
        fontWeight: 'bold',
        fontSize: '12px',
      }}>
        {log.action}
      </span>
    ),
  },
  { key: 'user', header: 'User' },
  { key: 'ipAddress', header: 'IP Address' },
  {
    key: 'details',
    header: 'Details',
    render: (log) => (
      <Typography variant="caption">
        {(log.details as Record<string, unknown>)?.resource as string}
      </Typography>
    ),
  },
];

export function AuditPanel() {
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(0);
  const isMock = useMockData();

  const { data: actionTypes = [] } = useQuery<string[]>({
    queryKey: ['admin', 'audit', 'actions'],
    queryFn: () => (isMock ? Promise.resolve(MOCK_ACTION_TYPES) : fetchAuditActionTypes()),
  });

  const { data: logsData, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['admin', 'audit', 'logs', actionFilter, userFilter, page],
    queryFn: () =>
      isMock
        ? Promise.resolve({ logs: MOCK_LOGS, total: 1247 })
        : fetchAuditLogs({ action: actionFilter || undefined, user: userFilter || undefined, page, size: 20 }),
  });

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;

  if (isLoading) return <Typography>Loading audit logs...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">Audit Log</Typography>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <Typography variant="caption">Action Type</Typography>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              style={{ padding: '8px', marginTop: '4px', display: 'block' }}
              aria-label="Filter by action type"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div>
            <Typography variant="caption">User</Typography>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
              placeholder="Search users..."
              style={{ padding: '8px', marginTop: '4px', display: 'block' }}
              aria-label="Filter by user"
            />
          </div>
        </div>
      </Card>

      <Table<AuditLog>
        columns={auditColumns}
        data={logs}
        rowKey={(log) => log.id}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px' }}>
          <Typography variant="caption">
            Showing {logs.length} of {total} entries
          </Typography>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Typography variant="body" style={{ padding: '8px' }}>Page {page + 1}</Typography>
            <Button variant="secondary" disabled={(page + 1) * 20 >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Table>
    </div>
  );
}
