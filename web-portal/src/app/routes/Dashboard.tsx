// Dashboard page - Premium account overview

import { useEffect, useState } from 'react';
import { SkeletonCard } from '../../components/common';
import { ErrorMessage } from '../../components/common';
import { formatCurrency, formatDataSize, formatPercent, formatDate } from '../../utils/format';
import {
  BoltIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { DashboardResponse } from '../../types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const MOCK_DASHBOARD: DashboardResponse = {
  accountSummary: {
    accountStatus: 'ACTIVE',
    planName: 'Premium 50GB',
    primaryMsisdn: '912 345 678',
  },
  usageSummary: {
    dataUsedMb: 33280, // 32.5 GB
    dataLimitMb: 51200, // 50 GB
    voiceMinutesUsed: 120,
    voiceMinutesLimit: 500,
    smsUsed: 45,
    smsLimit: 200,
    dataUsagePercent: 65,
    voiceUsagePercent: 24,
    smsUsagePercent: 22.5,
  },
  billingSummary: {
    currentBalance: 42.5,
    lastPaymentAmount: 29.95,
    lastPaymentDate: '2026-02-28',
    nextPaymentDueDate: '2026-03-31',
    paymentMethod: 'Visa •••• 4242',
    autoPayEnabled: true,
  },
  responseTime: '45ms',
};

interface DashboardProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onNavigate: (path: string) => void;
}

export function Dashboard({ authedFetch, onNavigate }: DashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(USE_MOCK ? MOCK_DASHBOARD : null);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!USE_MOCK) loadDashboard();
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
      // Fallback to mock data on error
      console.warn('Dashboard API failed, using mock data:', err);
      setDashboard(MOCK_DASHBOARD);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
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

  if (!dashboard) return null;

  const { accountSummary, usageSummary, billingSummary } = dashboard;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="page">
      {/* Hero welcome card */}
      <div className="card-gradient-blue" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{greeting},</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0 12px', letterSpacing: '-0.025em' }}>
            {accountSummary.primaryMsisdn ? `Customer` : 'Welcome'}
          </h1>
          <div className="row" style={{ gap: '16px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}>
              {accountSummary.planName}
            </span>
            <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}>
              <span className="status-dot status-dot-active" style={{ width: 6, height: 6, boxShadow: 'none', background: '#4ade80' }} />
              {accountSummary.accountStatus}
            </span>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              +351 {accountSummary.primaryMsisdn}
            </span>
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '80px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(255,255,255,.04)',
        }} />
      </div>

      {/* Usage Rings */}
      <div className="card">
        <div className="row-between mb-4">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Usage This Cycle</h2>
          <button className="btn-ghost" onClick={() => onNavigate('/usage')}>
            View details
          </button>
        </div>
        <div className="grid-3">
          <UsageRing
            label="Data"
            used={formatDataSize(usageSummary.dataUsedMb)}
            total={formatDataSize(usageSummary.dataLimitMb)}
            percent={usageSummary.dataUsagePercent}
            color="#6366f1"
            trackColor="#e0e7ff"
          />
          <UsageRing
            label="Voice"
            used={`${usageSummary.voiceMinutesUsed} min`}
            total={`${usageSummary.voiceMinutesLimit} min`}
            percent={usageSummary.voiceUsagePercent}
            color="#10b981"
            trackColor="#d1fae5"
          />
          <UsageRing
            label="SMS"
            used={`${usageSummary.smsUsed}`}
            total={`${usageSummary.smsLimit}`}
            percent={usageSummary.smsUsagePercent}
            color="#8b5cf6"
            trackColor="#ede9fe"
          />
        </div>
      </div>

      {/* Billing Card */}
      <div className="card">
        <div className="row-between mb-4">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Billing</h2>
          <button className="btn-ghost" onClick={() => onNavigate('/billing')}>
            View details
          </button>
        </div>
        <div className="grid-3">
          <div className="stat-block">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value stat-value-lg">{formatCurrency(billingSummary.currentBalance)}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Next Payment Due</span>
            <span className="stat-value" style={{ fontSize: '1.125rem' }}>{formatDate(billingSummary.nextPaymentDueDate)}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Auto-Pay</span>
            <div className="row" style={{ gap: '6px', marginTop: '4px' }}>
              {billingSummary.autoPayEnabled ? (
                <span className="badge badge-success">Enabled</span>
              ) : (
                <span className="badge badge-error">Disabled</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--premium-border)' }}>
          <button className="btn-primary" onClick={() => onNavigate('/billing')}>
            Pay Now
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px' }}>Quick Actions</h2>
        <div className="grid-4">
          <button className="quick-action" onClick={() => onNavigate('/billing')}>
            <BoltIcon />
            <span>Top Up</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/catalog')}>
            <ArrowPathIcon />
            <span>Change Plan</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/billing')}>
            <DocumentTextIcon />
            <span>View Bill</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/support')}>
            <ChatBubbleLeftRightIcon />
            <span>Get Help</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface UsageRingProps {
  label: string;
  used: string;
  total: string;
  percent: number;
  color: string;
  trackColor: string;
}

function UsageRing({ label, used, total, percent, color, trackColor }: UsageRingProps) {
  const size = 120;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const fillLen = (Math.min(percent, 100) / 100) * circ;

  return (
    <div className="usage-ring-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillLen} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="18" fontWeight="700">
          {formatPercent(percent)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="10">
          used
        </text>
      </svg>
      <span className="usage-ring-label">{label}</span>
      <span className="usage-ring-value">{used} / {total}</span>
    </div>
  );
}
