import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Badge } from '../../design-system';

const API_BASE = '/api/v1/admin/audit';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ipAddress: string;
  details: any;
}

const ACTION_GROUPS = {
  'Authentication': ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE'],
  'User Management': ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_DISABLE', 'USER_ENABLE'],
  'Billing': ['PAYMENT', 'PAYMENT_FAILED', 'REFUND', 'INVOICE_VIEW'],
  'Service': ['PLAN_CHANGE', 'LINE_ADD', 'LINE_CANCEL', 'LINE_SUSPEND', 'LINE_RESUME'],
  'Settings': ['SETTINGS_CHANGE', 'PREFERENCES_UPDATE', 'NOTIFICATION_SETTINGS']
};

export function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('7d');
  const [page, setPage] = useState(0);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchActionTypes();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, userFilter, dateRange, page]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && !refreshInterval) {
      const interval = setInterval(() => {
        fetchLogs();
      }, 5000);
      setRefreshInterval(interval);
    } else if (!autoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  const fetchActionTypes = async () => {
    const res = await fetch(API_BASE + '/actions');
    const data = await res.json();
    setActionTypes(data);
  };

  const fetchLogs = async () => {
    let url = API_BASE + `?page=${page}&size=20`;
    if (actionFilter) url += `&action=${actionFilter}`;
    if (userFilter) url += `&user=${userFilter}`;
    
    const res = await fetch(url);
    const data = await res.json();
    setLogs(data.logs);
    setTotal(data.total);
    setLoading(false);
  };

  const actionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    logs.forEach(log => {
      stats[log.action] = (stats[log.action] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const userStats = useMemo(() => {
    const stats: Record<string, number> = {};
    logs.forEach(log => {
      stats[log.user] = (stats[log.user] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const handleExport = async (format: string) => {
    let url = API_BASE + '/export?format=' + format;
    if (actionFilter) url += '&action=' + actionFilter;
    if (userFilter) url += '&user=' + userFilter;
    
    const res = await fetch(url);
    const data = await res.json();
    alert(`Export ready!\nFormat: ${data.format}\nRecords: ${data.count}\nURL: ${data.url}`);
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('FAILED')) return '#e74c3c';
    if (action.includes('CREATE')) return '#27ae60';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return '#f39c12';
    if (action.includes('LOGIN')) return '#3498db';
    if (action.includes('PAYMENT') || action.includes('BILLING')) return '#9b59b6';
    return '#666';
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) return <Typography>Loading audit logs...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Typography variant="h2">Audit Log</Typography>
            {autoRefresh && (
              <Badge variant="success" style={{ animation: 'pulse 2s infinite' }}>
                🔴 Live
              </Badge>
            )}
          </div>
          <Typography variant="caption" color="secondary">
            Track all system activities and changes
          </Typography>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant={autoRefresh ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⏹ Stop Live' : '🔴 Live'}
          </Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
          <Button variant="secondary" onClick={() => handleExport('json')}>Export JSON</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card style={{ padding: '12px' }}>
          <Typography variant="caption" color="secondary">Total Events</Typography>
          <Typography variant="h3">{total.toLocaleString()}</Typography>
        </Card>
        <Card style={{ padding: '12px' }}>
          <Typography variant="caption" color="secondary">Today's Events</Typography>
          <Typography variant="h3">{logs.filter(l => formatTimestamp(l.timestamp).relative === 'Just now' || formatTimestamp(l.timestamp).relative.endsWith('m ago')).length}</Typography>
        </Card>
        <Card style={{ padding: '12px' }}>
          <Typography variant="caption" color="secondary">Unique Users</Typography>
          <Typography variant="h3">{new Set(logs.map(l => l.user)).size}</Typography>
        </Card>
        <Card style={{ padding: '12px' }}>
          <Typography variant="caption" color="secondary">Action Types</Typography>
          <Typography variant="h3">{new Set(logs.map(l => l.action)).size}</Typography>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
        {/* Main Content */}
        <div>
          {/* Filters */}
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* Action Filter */}
              <div style={{ minWidth: '180px' }}>
                <Typography variant="caption">Action Type</Typography>
                <select 
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div style={{ minWidth: '180px' }}>
                <Typography variant="caption">User</Typography>
                <input 
                  type="text" 
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
                  placeholder="Search users..."
                  style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>

              {/* Date Range */}
              <div>
                <Typography variant="caption">Time Range</Typography>
                <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', marginTop: '4px' }}>
                  {(['today', '7d', '30d'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => { setDateRange(range); setPage(0); }}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        backgroundColor: dateRange === range ? '#3498db' : '#fff',
                        color: dateRange === range ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : '30 Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(actionFilter || userFilter) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setActionFilter(''); setUserFilter(''); setPage(0); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>

          {/* Logs Table */}
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', width: '100px' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '140px' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const ts = formatTimestamp(log.timestamp);
                  const isExpanded = expandedLog === log.id;
                  return (
                    <>
                      <tr 
                        key={log.id} 
                        style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: isExpanded ? '#f8f9fa' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td style={{ padding: '12px' }}>
                          <Typography variant="caption" color="secondary">{ts.date}</Typography>
                          <Typography variant="caption">{ts.time}</Typography>
                          <Typography variant="caption" color="secondary" style={{ display: 'block', color: '#999' }}>{ts.relative}</Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '4px',
                            backgroundColor: getActionColor(log.action) + '15',
                            color: getActionColor(log.action),
                            fontWeight: 600,
                            fontSize: '12px',
                            display: 'inline-block'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="body" style={{ fontWeight: 500 }}>{log.user.split('@')[0]}</Typography>
                          <Typography variant="caption" color="secondary">{log.user}</Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="caption" style={{ fontFamily: 'monospace' }}>{log.ipAddress}</Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="caption" color="secondary">
                            {isExpanded ? 'Click to collapse' : log.details?.resource || '-'}
                          </Typography>
                          <Typography variant="caption" style={{ display: 'block' }}>
                            {isExpanded ? '▼' : '▶'}
                          </Typography>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: '16px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              <div>
                                <Typography variant="caption" color="secondary">Resource</Typography>
                                <Typography variant="body">{log.details?.resource || 'N/A'}</Typography>
                              </div>
                              <div>
                                <Typography variant="caption" color="secondary">Changes</Typography>
                                <pre style={{ 
                                  backgroundColor: '#fff', 
                                  padding: '8px', 
                                  borderRadius: '4px', 
                                  fontSize: '12px',
                                  overflow: 'auto',
                                  maxHeight: '100px'
                                }}>
                                  {JSON.stringify(log.details?.changes || {}, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #eee' }}>
              <Typography variant="caption">
                Showing {logs.length} of {total.toLocaleString()} entries
              </Typography>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </Button>
                <span style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  Page {page + 1}
                </span>
                <Button 
                  variant="secondary"
                  size="sm"
                  disabled={(page + 1) * 20 >= total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* Top Actions */}
          <Card style={{ marginBottom: '16px' }}>
            <Typography variant="h3" style={{ marginBottom: '12px' }}>Top Actions</Typography>
            {actionStats.slice(0, 5).map(([action, count]) => (
              <div 
                key={action}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer'
                }}
                onClick={() => { setActionFilter(action); setPage(0); }}
              >
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  backgroundColor: getActionColor(action) + '15',
                  color: getActionColor(action),
                  fontSize: '11px',
                  fontWeight: 500
                }}>
                  {action}
                </span>
                <Typography variant="caption">{count}</Typography>
              </div>
            ))}
          </Card>

          {/* Top Users */}
          <Card>
            <Typography variant="h3" style={{ marginBottom: '12px' }}>Most Active Users</Typography>
            {userStats.map(([user, count], i) => (
              <div 
                key={user}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer'
                }}
                onClick={() => { setUserFilter(user); setPage(0); }}
              >
                <span style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#27ae60'][i],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <Typography variant="caption">{user.split('@')[0]}</Typography>
                </div>
                <Typography variant="caption" color="secondary">{count}</Typography>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
