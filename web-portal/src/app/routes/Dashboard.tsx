// Dashboard page - Account overview

import { useEffect, useState } from 'react';
import { Card } from '../../design-system/Card';
import { Typography } from '../../design-system/Typography';
import { Button } from '../../design-system/Button';
import { SkeletonCard } from '../../components/common';
import { ErrorMessage } from '../../components/common';
import { formatCurrency, formatDataSize, formatPercent, formatDate } from '../../utils/format';
import type { DashboardResponse } from '../../types/api';

interface DashboardProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onNavigate: (path: string) => void;
}

export function Dashboard({ authedFetch, onNavigate }: DashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authedFetch('/api/v1/customer/dashboard');
      if (!response.ok) {
        throw new Error(`Failed to load dashboard (${response.status})`);
      }
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load dashboard"
        message={error}
        onRetry={loadDashboard}
      />
    );
  }

  if (!dashboard) {
    return null;
  }

  const { accountSummary, usageSummary, billingSummary } = dashboard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Typography variant="h3">Welcome back</Typography>

      {/* Account Summary */}
      <Card padding="lg" shadow="md">
        <Typography variant="h4" style={{ marginBottom: '16px' }}>
          Account
        </Typography>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <Typography variant="small" color="secondary">Plan</Typography>
            <Typography variant="h4">{accountSummary.planName}</Typography>
          </div>
          <div>
            <Typography variant="small" color="secondary">Status</Typography>
            <Typography variant="h4" style={{ color: accountSummary.accountStatus === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
              {accountSummary.accountStatus}
            </Typography>
          </div>
          <div>
            <Typography variant="small" color="secondary">Primary Line</Typography>
            <Typography variant="h4">{accountSummary.primaryMsisdn}</Typography>
          </div>
        </div>
      </Card>

      {/* Usage Summary */}
      <Card padding="lg" shadow="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography variant="h4">Usage This Cycle</Typography>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('/usage')}>
            View details →
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <UsageBar
            label="Data"
            used={formatDataSize(usageSummary.dataUsedMb)}
            total={formatDataSize(usageSummary.dataLimitMb)}
            percent={usageSummary.dataUsagePercent}
          />
          <UsageBar
            label="Voice"
            used={`${usageSummary.voiceMinutesUsed} min`}
            total={`${usageSummary.voiceMinutesLimit} min`}
            percent={usageSummary.voiceUsagePercent}
          />
          <UsageBar
            label="SMS"
            used={`${usageSummary.smsUsed}`}
            total={`${usageSummary.smsLimit}`}
            percent={usageSummary.smsUsagePercent}
          />
        </div>
      </Card>

      {/* Billing Summary */}
      <Card padding="lg" shadow="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography variant="h4">Billing</Typography>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('/billing')}>
            View details →
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <Typography variant="small" color="secondary">Current Balance</Typography>
            <Typography variant="h3">{formatCurrency(billingSummary.currentBalance)}</Typography>
          </div>
          <div>
            <Typography variant="small" color="secondary">Next Payment Due</Typography>
            <Typography variant="h4">{formatDate(billingSummary.nextPaymentDueDate)}</Typography>
          </div>
          <div>
            <Typography variant="small" color="secondary">Payment Method</Typography>
            <Typography variant="body">{billingSummary.paymentMethod}</Typography>
          </div>
          <div>
            <Typography variant="small" color="secondary">Auto-Pay</Typography>
            <Typography variant="body" style={{ color: billingSummary.autoPayEnabled ? '#16a34a' : '#dc2626' }}>
              {billingSummary.autoPayEnabled ? '✓ Enabled' : '✗ Disabled'}
            </Typography>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card padding="lg" shadow="md">
        <Typography variant="h4" style={{ marginBottom: '16px' }}>
          Quick Actions
        </Typography>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={() => onNavigate('/usage')}>View Usage</Button>
          <Button variant="outline" onClick={() => onNavigate('/billing')}>Pay Bill</Button>
          <Button variant="outline" onClick={() => onNavigate('/lines')}>Manage Lines</Button>
          <Button variant="outline" onClick={() => onNavigate('/support')}>Get Support</Button>
        </div>
      </Card>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  used: string;
  total: string;
  percent: number;
}

function UsageBar({ label, used, total, percent }: UsageBarProps) {
  const getColor = () => {
    if (percent >= 90) return '#dc2626';
    if (percent >= 75) return '#f59e0b';
    return '#6366f1';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <Typography variant="body" style={{ fontWeight: 500 }}>{label}</Typography>
        <Typography variant="small" color="secondary">{used} / {total}</Typography>
      </div>
      <div
        style={{
          height: '8px',
          background: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(percent, 100)}%`,
            height: '100%',
            background: getColor(),
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <Typography variant="small" color="secondary" style={{ marginTop: '4px' }}>
        {formatPercent(percent)} used
      </Typography>
    </div>
  );
}
