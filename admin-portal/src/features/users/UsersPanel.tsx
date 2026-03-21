import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Badge } from '../../design-system';

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

type UserFilter = 'all' | 'active' | 'inactive' | 'suspended';

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<UserFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastLogin'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(API_BASE + '?search=' + searchQuery);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    
    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(u => u.status === 'ACTIVE');
    } else if (statusFilter === 'inactive') {
      result = result.filter(u => u.status === 'INACTIVE');
    } else if (statusFilter === 'suspended') {
      result = result.filter(u => u.status === 'SUSPENDED');
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [users, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
    admins: users.filter(u => u.role === 'ADMIN').length
  }), [users]);

  const handleInvite = async () => {
    await fetch(API_BASE + '/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    setShowInvite(false);
    setInviteEmail('');
    alert('Invitation sent to ' + inviteEmail);
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (!selected.size) return;
    
    const endpoint = action === 'delete' 
      ? API_BASE + '/bulk-delete' 
      : API_BASE + '/bulk-update';
    const body = action === 'delete'
      ? { userIds: Array.from(selected) }
      : { userIds: Array.from(selected), updates: { status: action === 'activate' ? 'ACTIVE' : 'SUSPENDED' } };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    setSelected(new Set());
    setShowBulk(false);
    fetchUsers();
  };

  const handleExport = async (format: string) => {
    const res = await fetch(API_BASE + '/export?format=' + format);
    const data = await res.json();
    alert('Export ready: ' + data.url + '\nDownload count: ' + data.count);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredUsers.length) setSelected(new Set());
    else setSelected(new Set(filteredUsers.map(u => u.id)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'SUSPENDED': return <Badge variant="danger">Suspended</Badge>;
      default: return <Badge variant="neutral">Inactive</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: '#9b59b6',
      OPERATOR: '#3498db',
      USER: '#27ae60'
    };
    return (
      <span style={{ 
        padding: '2px 8px', 
        borderRadius: '4px',
        backgroundColor: (colors[role] || '#666') + '20',
        color: colors[role] || '#666',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {role}
      </span>
    );
  };

  if (loading) return <Typography>Loading users...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Typography variant="h2">User Management</Typography>
          <Typography variant="caption" color="secondary">
            Manage users, roles, and permissions
          </Typography>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={() => setShowInvite(true)}>+ Invite User</Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <Card style={{ textAlign: 'center', padding: '12px' }}>
          <Typography variant="h3">{stats.total}</Typography>
          <Typography variant="caption">Total Users</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '12px', borderLeft: '3px solid #27ae60' }}>
          <Typography variant="h3" style={{ color: '#27ae60' }}>{stats.active}</Typography>
          <Typography variant="caption">Active</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '12px', borderLeft: '3px solid #e74c3c' }}>
          <Typography variant="h3" style={{ color: '#e74c3c' }}>{stats.suspended}</Typography>
          <Typography variant="caption">Suspended</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '12px', borderLeft: '3px solid #9b59b6' }}>
          <Typography variant="h3" style={{ color: '#9b59b6' }}>{stats.admins}</Typography>
          <Typography variant="caption">Admins</Typography>
        </Card>
      </div>

      {/* Filters & Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
            <option value="USER">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserFilter)}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="createdAt">Sort by Created</option>
            <option value="lastLogin">Sort by Login</option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(v => v === 'table' ? 'cards' : 'table')}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
          >
            {viewMode === 'table' ? '▦ Cards' : '☰ Table'}
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: '#e8f5e9', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body">{selected.size} users selected</Typography>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="primary" onClick={() => handleBulkAction('activate')}>Activate</Button>
              <Button size="sm" variant="warning" onClick={() => handleBulkAction('suspend')}>Suspend</Button>
              <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Users Display */}
      {viewMode === 'table' ? (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selected.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Last Login</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: selected.has(user.id) ? '#f0f7ff' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={selected.has(user.id)} 
                      onChange={() => toggleSelect(user.id)} 
                    />
                  </td>
                  <td>
                    <Typography variant="body" style={{ fontWeight: 500 }}>{user.name}</Typography>
                    <Typography variant="caption" color="secondary">{user.email}</Typography>
                  </td>
                  <td style={{ padding: '12px' }}>{getRoleBadge(user.role)}</td>
                  <td style={{ padding: '12px' }}>{getStatusBadge(user.status)}</td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="caption">{user.createdAt?.split('T')[0]}</Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="caption">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Info */}
          <div style={{ padding: '12px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption">
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="outline" disabled>Previous</Button>
              <Button size="sm" variant="outline" disabled>Next</Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Card View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filteredUsers.map(user => (
            <Card 
              key={user.id}
              style={{ 
                border: selected.has(user.id) ? '2px solid #3498db' : '1px solid #eee',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Typography variant="body" style={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" color="secondary">{user.email}</Typography>
                </div>
                <input 
                  type="checkbox" 
                  checked={selected.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  style={{ marginTop: '4px' }}
                />
              </div>
              
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                <div>Joined: {user.createdAt?.split('T')[0]}</div>
                <div>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ width: '420px', padding: '24px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>Invite New User</Typography>
            
            <div style={{ marginBottom: '16px' }}>
              <Typography variant="caption">Email Address</Typography>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="caption">Role</Typography>
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="USER">User - Basic access</option>
                <option value="OPERATOR">Operator - Manage content & offers</option>
                <option value="ADMIN">Admin - Full access</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleInvite} disabled={!inviteEmail}>Send Invitation</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
