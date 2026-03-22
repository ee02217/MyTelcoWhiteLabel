import { useState, useEffect } from 'react';
import { Card, Typography, Button } from '../../design-system';

const API_BASE = '/api/v1/admin/users';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');

  const useMockData = true;

  useEffect(() => {
    if (useMockData) {
      setUsers([
        { id: '1', email: 'john.doe@example.com', name: 'John Doe', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-01-15', lastLogin: '2026-03-21' },
        { id: '2', email: 'jane.smith@example.com', name: 'Jane Smith', role: 'USER', status: 'ACTIVE', createdAt: '2026-02-01', lastLogin: '2026-03-20' },
        { id: '3', email: 'bob.wilson@example.com', name: 'Bob Wilson', role: 'OPERATOR', status: 'ACTIVE', createdAt: '2026-03-10', lastLogin: '2026-03-19' },
        { id: '4', email: 'alice@example.com', name: 'Alice Brown', role: 'USER', status: 'SUSPENDED', createdAt: '2025-12-05', lastLogin: '2026-02-15' },
        { id: '5', email: 'charlie@example.com', name: 'Charlie Davis', role: 'USER', status: 'ACTIVE', createdAt: '2026-03-01', lastLogin: '2026-03-21' },
      ]);
      setLoading(false);
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const handleInvite = async () => {
    await fetch(API_BASE + '/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    setShowInvite(false);
    setInviteEmail('');
    alert('Invitation sent!');
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} users?`)) return;
    await fetch(API_BASE + '/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: Array.from(selected) })
    });
    setSelected(new Set());
    fetchUsers();
  };

  const handleBulkUpdate = async (status: string) => {
    await fetch(API_BASE + '/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: Array.from(selected), updates: { status } })
    });
    setSelected(new Set());
    fetchUsers();
  };

  const handleExport = async (format: string) => {
    const res = await fetch(API_BASE + '/export?format=' + format);
    const data = await res.json();
    alert('Export ready: ' + data.url);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map(u => u.id)));
  };

  if (loading) return <Typography>Loading users...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">User Management</Typography>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={() => setShowInvite(true)}>Invite User</Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card style={{ marginBottom: '16px', backgroundColor: '#e8f5e9' }}>
          <Typography variant="body">{selected.size} users selected</Typography>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => handleBulkUpdate('ACTIVE')}>Activate</Button>
            <Button variant="secondary" onClick={() => handleBulkUpdate('SUSPENDED')}>Suspend</Button>
            <Button variant="danger" onClick={handleBulkDelete}>Delete</Button>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>
                <input type="checkbox" checked={selected.size === users.length} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={selected.has(user.id)} 
                    onChange={() => toggleSelect(user.id)} 
                  />
                </td>
                <td style={{ padding: '8px' }}>{user.name}</td>
                <td style={{ padding: '8px' }}>{user.email}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: user.role === 'ADMIN' ? '#e3f2fd' : '#f5f5f5'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '8px' }}>
                  <span style={{ 
                    color: user.status === 'ACTIVE' ? '#27ae60' : '#e74c3c'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '8px' }}>{user.createdAt?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Invite Modal */}
      {showInvite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Card style={{ width: '400px' }}>
            <Typography variant="h3">Invite New User</Typography>
            <div style={{ marginTop: '16px' }}>
              <Typography variant="caption">Email</Typography>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Typography variant="caption">Role</Typography>
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="OPERATOR">Operator</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button variant="primary" onClick={handleInvite}>Send Invite</Button>
              <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
