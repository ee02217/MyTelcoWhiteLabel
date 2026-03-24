import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Modal, Table, type TableColumn } from '../../design-system';
import {
  fetchUsers,
  inviteUser,
  bulkUpdateUsers,
  bulkDeleteUsers,
  useMockData,
} from '../../services/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

const MOCK_USERS: User[] = [
  { id: '1', email: 'john.doe@example.com', name: 'John Doe', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-01-15', lastLogin: '2026-03-21' },
  { id: '2', email: 'jane.smith@example.com', name: 'Jane Smith', role: 'USER', status: 'ACTIVE', createdAt: '2026-02-01', lastLogin: '2026-03-20' },
  { id: '3', email: 'bob.wilson@example.com', name: 'Bob Wilson', role: 'OPERATOR', status: 'ACTIVE', createdAt: '2026-03-10', lastLogin: '2026-03-19' },
  { id: '4', email: 'alice@example.com', name: 'Alice Brown', role: 'USER', status: 'SUSPENDED', createdAt: '2025-12-05', lastLogin: '2026-02-15' },
  { id: '5', email: 'charlie@example.com', name: 'Charlie Davis', role: 'USER', status: 'ACTIVE', createdAt: '2026-03-01', lastLogin: '2026-03-21' },
];

const columns: TableColumn<User>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  {
    key: 'role',
    header: 'Role',
    render: (user) => (
      <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: user.role === 'ADMIN' ? '#e3f2fd' : '#f5f5f5' }}>
        {user.role}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <span style={{ color: user.status === 'ACTIVE' ? '#27ae60' : '#e74c3c' }}>
        {user.status}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (user) => <>{user.createdAt?.split('T')[0]}</>,
  },
];

export function UsersPanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');
  const isMock = useMockData();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => (isMock ? Promise.resolve(MOCK_USERS) : fetchUsers()),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      isMock ? Promise.resolve({}) : inviteUser(payload),
    onSuccess: () => {
      setShowInvite(false);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (params: { userIds: string[]; status: string }) =>
      isMock
        ? Promise.resolve({})
        : bulkUpdateUsers({ userIds: params.userIds, updates: { status: params.status } }),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      isMock ? Promise.resolve({}) : bulkDeleteUsers(userIds),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (isLoading) return <Typography>Loading users...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">User Management</Typography>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={() => setShowInvite(true)}>Invite User</Button>
        </div>
      </div>

      {selected.size > 0 && (
        <Card style={{ marginBottom: '16px', backgroundColor: '#e8f5e9' }}>
          <Typography variant="body">{selected.size} users selected</Typography>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => bulkUpdateMutation.mutate({ userIds: Array.from(selected), status: 'ACTIVE' })}
            >
              Activate
            </Button>
            <Button
              variant="secondary"
              onClick={() => bulkUpdateMutation.mutate({ userIds: Array.from(selected), status: 'SUSPENDED' })}
            >
              Suspend
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${selected.size} users?`)) {
                  bulkDeleteMutation.mutate(Array.from(selected));
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Card>
      )}

      <Table<User>
        columns={columns}
        data={users}
        rowKey={(u) => u.id}
        selectable
        selected={selected}
        onSelectChange={setSelected}
      />

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite New User">
        <Typography variant="h3">Invite New User</Typography>
        <div style={{ marginTop: '16px' }}>
          <Typography variant="caption">Email</Typography>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            aria-label="Email address"
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <Typography variant="caption">Role</Typography>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            aria-label="User role"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <Button variant="primary" onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}>
            Send Invite
          </Button>
          <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
