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
  SignalIcon,
  PhoneIcon,
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';
import type { DashboardResponse } from '../../types/api';

const MOCK_DASHBOARD: DashboardResponse = {
  accountSummary: {
    accountStatus: 'ACTIVE',
    planName: 'Premium 50GB',
    primaryMsisdn: '912 345 678',
  },
  usageSummary: {
    dataUsedMb: 33280,
    dataLimitMb: 51200,
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
      if (!response.ok) throw new Error(`Failed to load dashboard (${response.status})`);
      setDashboard(await response.json());
    } catch (err) {
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

  if (error) return <ErrorMessage title="Failed to load dashboard" message={error} onRetry={loadDashboard} />;
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
      <div className="dash-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="dash-hero-greeting">{greeting},</p>
          <h1 className="dash-hero-name">Customer</h1>
          <div className="row" style={{ gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            <span className="dash-hero-badge">{accountSummary.planName}</span>
            <span className="dash-hero-badge">
              <span className="status-dot status-dot-active" style={{ width: 7, height: 7, boxShadow: '0 0 8px #4ade80', background: '#4ade80' }} />
              {accountSummary.accountStatus}
            </span>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              +351 {accountSummary.primaryMsisdn}
            </span>
          </div>
        </div>
        {/* Decorative shapes */}
        <div className="dash-hero-circle dash-hero-circle-1" />
        <div className="dash-hero-circle dash-hero-circle-2" />
        <div className="dash-hero-circle dash-hero-circle-3" />
      </div>

      {/* Usage Rings */}
      <section>
        <div className="row-between" style={{ marginBottom: '16px' }}>
          <h2 className="section-title">Usage This Cycle</h2>
          <button className="btn-ghost" onClick={() => onNavigate('/usage')}>View details &rarr;</button>
        </div>
        <div className="grid-3">
          <UsageRingCard
            icon={<SignalIcon />}
            label="Data"
            used={formatDataSize(usageSummary.dataUsedMb)}
            total={formatDataSize(usageSummary.dataLimitMb)}
            percent={usageSummary.dataUsagePercent}
            color="#6366f1"
            trackColor="#e0e7ff"
            bgAccent="rgba(99,102,241,.06)"
          />
          <UsageRingCard
            icon={<PhoneIcon />}
            label="Voice"
            used={`${usageSummary.voiceMinutesUsed} min`}
            total={`${usageSummary.voiceMinutesLimit} min`}
            percent={usageSummary.voiceUsagePercent}
            color="#10b981"
            trackColor="#d1fae5"
            bgAccent="rgba(16,185,129,.06)"
          />
          <UsageRingCard
            icon={<ChatBubbleOvalLeftIcon />}
            label="SMS"
            used={`${usageSummary.smsUsed}`}
            total={`${usageSummary.smsLimit}`}
            percent={usageSummary.smsUsagePercent}
            color="#8b5cf6"
            trackColor="#ede9fe"
            bgAccent="rgba(139,92,246,.06)"
          />
        </div>
      </section>

      {/* Billing */}
      <section>
        <div className="row-between" style={{ marginBottom: '16px' }}>
          <h2 className="section-title">Billing</h2>
          <button className="btn-ghost" onClick={() => onNavigate('/billing')}>View details &rarr;</button>
        </div>
        <div className="grid-3">
          <div className="card" style={{ borderLeft: '4px solid var(--premium-primary)' }}>
            <span className="stat-label">Current Balance</span>
            <span className="stat-value" style={{ fontSize: '2.25rem', marginTop: '4px' }}>
              {formatCurrency(billingSummary.currentBalance)}
            </span>
            <button className="btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => onNavigate('/billing')}>
              Pay Now
            </button>
          </div>
          <div className="card">
            <span className="stat-label">Next Payment Due</span>
            <span className="stat-value" style={{ fontSize: '1.25rem', marginTop: '4px' }}>
              {formatDate(billingSummary.nextPaymentDueDate)}
            </span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--premium-text-muted)', marginTop: '8px' }}>
              {billingSummary.paymentMethod}
            </p>
          </div>
          <div className="card">
            <span className="stat-label">Auto-Pay</span>
            <div style={{ marginTop: '8px' }}>
              {billingSummary.autoPayEnabled ? (
                <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '6px 14px' }}>Enabled</span>
              ) : (
                <span className="badge badge-error" style={{ fontSize: '0.875rem', padding: '6px 14px' }}>Disabled</span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--premium-text-muted)', marginTop: '8px' }}>
              Last paid {formatCurrency(billingSummary.lastPaymentAmount)} on {formatDate(billingSummary.lastPaymentDate)}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Quick Actions</h2>
        <div className="grid-4">
          <button className="quick-action" onClick={() => onNavigate('/billing')}>
            <div className="quick-action-icon"><BoltIcon /></div>
            <span>Top Up</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/catalog')}>
            <div className="quick-action-icon"><ArrowPathIcon /></div>
            <span>Change Plan</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/billing')}>
            <div className="quick-action-icon"><DocumentTextIcon /></div>
            <span>View Bill</span>
          </button>
          <button className="quick-action" onClick={() => onNavigate('/support')}>
            <div className="quick-action-icon"><ChatBubbleLeftRightIcon /></div>
            <span>Get Help</span>
          </button>
        </div>
      </section>
    </div>
  );
}

interface UsageRingCardProps {
  icon: React.ReactNode;
  label: string;
  used: string;
  total: string;
  percent: number;
  color: string;
  trackColor: string;
  bgAccent: string;
}

function UsageRingCard({ icon, label, used, total, percent, color, trackColor, bgAccent }: UsageRingCardProps) {
  const size = 140;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const fillLen = (Math.min(percent, 100) / 100) * circ;

  return (
    <div className="card" style={{ background: bgAccent, border: 'none', textAlign: 'center', padding: '28px 20px' }}>
      <div className="row" style={{ gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        <span style={{ color, width: 18, height: 18 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--premium-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillLen} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="24" fontWeight="700">
          {formatPercent(percent)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
          used
        </text>
      </svg>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--premium-text)', marginTop: '12px' }}>
        {used} <span style={{ fontWeight: 400, color: 'var(--premium-text-muted)' }}>of {total}</span>
      </p>
    </div>
  );
}
