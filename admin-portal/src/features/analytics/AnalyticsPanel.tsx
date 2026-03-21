import { useState, useEffect } from 'react';
import { Card, Typography, Button } from '../../design-system';

const API_BASE = '/api/v1/admin/analytics';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  arpu: number;
  churnRate: number;
  newUsersThisMonth: number;
}

export function AnalyticsPanel() {
  const [overview, setOverview] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API_BASE + '/overview').then(r => r.json()),
      fetch(API_BASE + '/revenue?days=30').then(r => r.json())
    ]).then(([overviewData, revenue]) => {
      setOverview(overviewData);
      setRevenueData(revenue);
      setLoading(false);
    });
  }, []);

  const handleExport = async (format: string) => {
    const res = await fetch(API_BASE + '/export?format=' + format);
    const data = await res.json();
    alert('Export ready: ' + data.url);
  };

  if (loading) return <Typography>Loading analytics...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">Analytics Dashboard</Typography>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => handleExport('json')}>Export JSON</Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <Card>
          <Typography variant="caption">Total Users</Typography>
          <Typography variant="h2">{overview?.totalUsers?.toLocaleString()}</Typography>
        </Card>
        <Card>
          <Typography variant="caption">Active Users</Typography>
          <Typography variant="h2">{overview?.activeUsers?.toLocaleString()}</Typography>
        </Card>
        <Card>
          <Typography variant="caption">Total Revenue</Typography>
          <Typography variant="h2">€{overview?.totalRevenue?.toLocaleString()}</Typography>
        </Card>
        <Card>
          <Typography variant="caption">ARPU</Typography>
          <Typography variant="h2">€{overview?.arpu}</Typography>
        </Card>
        <Card>
          <Typography variant="caption">Churn Rate</Typography>
          <Typography variant="h2">{overview?.churnRate}%</Typography>
        </Card>
        <Card>
          <Typography variant="caption">New Users (Month)</Typography>
          <Typography variant="h2">{overview?.newUsersThisMonth}</Typography>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <Typography variant="h3">Revenue Trend (Last 30 Days)</Typography>
        <div style={{ height: '200px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'flex-end', padding: '16px', gap: '2px' }}>
          {revenueData.slice(-14).map((point: any, i: number) => (
            <div 
              key={i}
              style={{
                flex: 1,
                height: `${(point.revenue / 20000) * 100}%`,
                backgroundColor: '#3498db',
                minHeight: '4px'
              }}
              title={`€${point.revenue.toFixed(0)}`}
            />
          ))}
        </div>
        <Typography variant="caption" style={{ marginTop: '8px', display: 'block' }}>
          Daily revenue over the last 2 weeks
        </Typography>
      </Card>
    </div>
  );
}
