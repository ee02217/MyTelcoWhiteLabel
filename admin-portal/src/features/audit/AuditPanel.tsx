import { useState, useEffect } from 'react';
import { Card, Typography, Button } from '../../design-system';

const API_BASE = '/api/v1/admin/audit';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ipAddress: string;
  details: any;
}

export function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(0);
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchActionTypes();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, userFilter, page]);

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

  const handleExport = async (format: string) => {
    let url = API_BASE + '/export?format=' + format;
    if (actionFilter) url += '&action=' + actionFilter;
    if (userFilter) url += '&user=' + userFilter;
    
    const res = await fetch(url);
    const data = await res.json();
    alert('Export ready: ' + data.url);
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return '#e74c3c';
    if (action.includes('CREATE')) return '#27ae60';
    if (action.includes('UPDATE')) return '#f39c12';
    if (action.includes('LOGIN')) return '#3498db';
    return '#666';
  };

  if (loading) return <Typography>Loading audit logs...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">Audit Log</Typography>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => handleExport('json')}>Export JSON</Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <Typography variant="caption">Action Type</Typography>
            <select 
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              style={{ padding: '8px', marginTop: '4px' }}
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
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
              style={{ padding: '8px', marginTop: '4px' }}
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Timestamp</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: getActionColor(log.action) + '20',
                    color: getActionColor(log.action),
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{log.user}</td>
                <td style={{ padding: '12px' }}>{log.ipAddress}</td>
                <td style={{ padding: '12px' }}>
                  <Typography variant="caption">
                    {log.details?.resource}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <Typography variant="caption">
            Showing {logs.length} of {total} entries
          </Typography>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Typography variant="body" style={{ padding: '8px' }}>Page {page + 1}</Typography>
            <Button 
              variant="secondary"
              disabled={(page + 1) * 20 >= total}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
