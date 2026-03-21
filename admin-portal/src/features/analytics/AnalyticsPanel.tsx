import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Badge } from '../../design-system';

const API_BASE = '/api/v1/admin/analytics';

interface OverviewData {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  arpu: number;
  churnRate: number;
  newUsersThisMonth: number;
  revenueGrowth: number;
  userGrowth: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  newSubscriptions: number;
  cancellations: number;
}

export function AnalyticsPanel() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'users' | 'usage'>('revenue');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    Promise.all([
      fetch(API_BASE + '/overview').then(r => r.json()),
      fetch(API_BASE + '/revenue?days=' + days).then(r => r.json()),
      fetch(API_BASE + '/users?days=' + days).then(r => r.json()),
      fetch(API_BASE + '/usage').then(r => r.json())
    ]).then(([overviewData, revenue, users, usage]) => {
      setOverview(overviewData);
      setRevenueData(revenue);
      setUserAnalytics({ ...users, usage });
      setLoading(false);
    });
  }, [dateRange, refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(k => k + 1);
  };

  const chartMax = useMemo(() => {
    if (activeMetric === 'revenue') {
      return Math.max(...revenueData.map(d => d.revenue), 1);
    }
    return Math.max(...revenueData.map(d => d.newSubscriptions + d.cancellations), 1);
  }, [revenueData, activeMetric]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return '€' + (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return '€' + (val / 1000).toFixed(1) + 'K';
    return '€' + val.toFixed(2);
  };

  const formatNumber = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  const getTrendColor = (val: number) => {
    if (val > 0) return '#27ae60';
    if (val < 0) return '#e74c3c';
    return '#666';
  };

  const handleExport = async (format: string) => {
    const res = await fetch(API_BASE + '/export?format=' + format);
    const data = await res.json();
    alert('Preparing export: ' + data.url + '\n(This would download in production)');
  };

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <Typography variant="h2">Analytics Dashboard</Typography>
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <Typography>Loading analytics data...</Typography>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Typography variant="h2">Analytics Dashboard</Typography>
          <Typography variant="caption" color="secondary">
            Real-time platform performance metrics
          </Typography>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Date Range Selector */}
          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  backgroundColor: dateRange === range ? '#3498db' : '#fff',
                  color: dateRange === range ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handleRefresh}>↻ Refresh</Button>
          <Button variant="primary" onClick={() => handleExport('csv')}>Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
          <Typography variant="caption" style={{ opacity: 0.9 }}>Total Users</Typography>
          <Typography variant="h2" style={{ color: '#fff' }}>{formatNumber(overview?.totalUsers || 0)}</Typography>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <span style={{ color: getTrendColor(overview?.userGrowth || 0) }}>
              {overview?.userGrowth > 0 ? '↑' : '↓'} {Math.abs(overview?.userGrowth || 0)}%
            </span>
            <Typography variant="caption" style={{ opacity: 0.8 }}>vs last period</Typography>
          </div>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff' }}>
          <Typography variant="caption" style={{ opacity: 0.9 }}>Active Users</Typography>
          <Typography variant="h2" style={{ color: '#fff' }}>{formatNumber(overview?.activeUsers || 0)}</Typography>
          <Typography variant="caption" style={{ opacity: 0.8 }}>
            {((overview?.activeUsers || 0) / (overview?.totalUsers || 1) * 100).toFixed(1)}% of total
          </Typography>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
          <Typography variant="caption" style={{ opacity: 0.9 }}>Total Revenue</Typography>
          <Typography variant="h2" style={{ color: '#fff' }}>{formatCurrency(overview?.totalRevenue || 0)}</Typography>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <span style={{ color: getTrendColor(overview?.revenueGrowth || 0) }}>
              {overview?.revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(overview?.revenueGrowth || 0)}%
            </span>
            <Typography variant="caption" style={{ opacity: 0.8 }}>vs last period</Typography>
          </div>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>
          <Typography variant="caption" style={{ opacity: 0.9 }}>ARPU</Typography>
          <Typography variant="h2" style={{ color: '#fff' }}>{formatCurrency(overview?.arpu || 0)}</Typography>
          <Typography variant="caption" style={{ opacity: 0.8 }}>per user/month</Typography>
        </Card>

        <Card>
          <Typography variant="caption">Churn Rate</Typography>
          <Typography variant="h2" style={{ color: overview?.churnRate && overview.churnRate > 5 ? '#e74c3c' : '#27ae60' }}>
            {overview?.churnRate}%
          </Typography>
          <Badge variant={overview?.churnRate && overview.churnRate < 3 ? 'success' : overview?.churnRate && overview.churnRate > 5 ? 'danger' : 'warning'}>
            {overview?.churnRate && overview.churnRate < 3 ? 'Excellent' : overview?.churnRate && overview.churnRate > 5 ? 'High' : 'Normal'}
          </Badge>
        </Card>

        <Card>
          <Typography variant="caption">New Users (Month)</Typography>
          <Typography variant="h2">{formatNumber(overview?.newUsersThisMonth || 0)}</Typography>
          <Typography variant="caption" color="secondary">This month</Typography>
        </Card>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Main Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="h3">Performance Trend</Typography>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['revenue', 'users', 'usage'] as const).map(metric => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: activeMetric === metric ? '#3498db' : '#f0f0f0',
                    color: activeMetric === metric ? '#fff' : '#666',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '0 8px' }}>
            {revenueData.slice(-14).map((point, i) => {
              const height = activeMetric === 'revenue' 
                ? (point.revenue / chartMax) * 100
                : ((point.newSubscriptions + point.cancellations) / chartMax) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: activeMetric === 'revenue' ? '#3498db' : '#9b59b6',
                    borderRadius: '3px 3px 0 0',
                    position: 'relative',
                    transition: 'height 0.3s ease'
                  }}
                  title={`${point.date}: ${activeMetric === 'revenue' ? formatCurrency(point.revenue) : point.newSubscriptions + ' subs'}`}
                />
              );
            })}
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 8px' }}>
            <Typography variant="caption" color="secondary">
              {revenueData[revenueData.length - 14]?.date}
            </Typography>
            <Typography variant="caption" color="secondary">
              {revenueData[revenueData.length - 1]?.date}
            </Typography>
          </div>
        </Card>

        {/* Top Stats */}
        <Card>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>Top Plans</Typography>
          {userAnalytics?.topPlans?.map((plan: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid #eee' : 'none' }}>
              <div>
                <Typography variant="body">{plan.name}</Typography>
                <Typography variant="caption" color="secondary">{plan.count.toLocaleString()} users</Typography>
              </div>
              <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#eee" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="16" fill="none"
                    stroke={['#3498db', '#9b59b6', '#e74c3c'][i]}
                    strokeWidth="3"
                    strokeDasharray={`${(plan.count / (userAnalytics?.topPlans?.[0]?.count || 1)) * 100}, 100`}
                  />
                </svg>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Secondary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Usage by Hour */}
        <Card>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>Usage by Hour</Typography>
          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
            {userAnalytics?.usage?.dataUsageByHour?.map((point: any, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${(point.mbUsed / 3000) * 100}%`,
                  backgroundColor: point.hour >= 18 || point.hour <= 9 ? '#e74c3c' : '#3498db',
                  opacity: 0.7,
                  minHeight: '2px'
                }}
                title={`${point.hour}:00 - ${point.mbUsed.toFixed(0)} MB`}
              />
            ))}
          </div>
          <Typography variant="caption" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
            Peak hours: 18:00-22:00 (red bars)
          </Typography>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>Top Countries</Typography>
          {userAnalytics?.topCountries?.map((country: any, i: number) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Typography variant="body">{country.country}</Typography>
                <Typography variant="body">{country.users.toLocaleString()}</Typography>
              </div>
              <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(country.users / (userAnalytics?.topCountries?.[0]?.users || 1)) * 100}%`,
                    backgroundColor: ['#3498db', '#9b59b6', '#e74c3c'][i] || '#666',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ marginTop: '16px' }}>
        <Typography variant="h3" style={{ marginBottom: '12px' }}>Quick Reports</Typography>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm">📊 Revenue Report</Button>
          <Button variant="outline" size="sm">👥 User Growth Report</Button>
          <Button variant="outline" size="sm">📈 Usage Analysis</Button>
          <Button variant="outline" size="sm">💰 Churn Analysis</Button>
          <Button variant="outline" size="sm">🌍 Geographic Report</Button>
        </div>
      </Card>
    </div>
  );
}
