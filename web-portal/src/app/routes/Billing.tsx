import { useState } from 'react';
import { PaymentMethodCard } from '../../components/billing/PaymentMethodCard';
import { PaymentHistoryList } from '../../components/billing/PaymentHistoryList';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  BanknotesIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { PaymentMethod, PaymentRecord } from '../../types/api';

// Mock data
const mockBilling = {
  summary: {
    currentBalance: 4950, // in cents
    currency: 'EUR',
    lastPaymentAmount: 2995,
    lastPaymentDate: '2026-02-28',
    nextPaymentDueDate: '2026-03-31',
    autoPayEnabled: true,
  },
  paymentMethods: [
    {
      paymentMethodId: 'pm_1',
      token: 'tok_1',
      status: 'ACTIVE',
      type: 'CARD' as const,
      cardBrand: 'Visa',
      lastFour: '4242',
      expiryDate: '12/2028',
    },
    {
      paymentMethodId: 'pm_2',
      token: 'tok_2',
      status: 'ACTIVE',
      type: 'SEPA' as const,
      bankName: 'Millennium BCP',
      lastFour: '9876',
    },
  ] as PaymentMethod[],
  paymentHistory: [
    {
      id: 'pay_1',
      date: '2026-02-28',
      amount: 2995,
      status: 'completed' as const,
      method: 'Visa •••• 4242',
      description: 'Monthly bill - February 2026',
      receiptUrl: '#',
    },
    {
      id: 'pay_2',
      date: '2026-01-31',
      amount: 2995,
      status: 'completed' as const,
      method: 'Visa •••• 4242',
      description: 'Monthly bill - January 2026',
      receiptUrl: '#',
    },
    {
      id: 'pay_3',
      date: '2025-12-31',
      amount: 2995,
      status: 'completed' as const,
      method: 'SEPA •••• 9876',
      description: 'Monthly bill - December 2025',
      receiptUrl: '#',
    },
  ] as PaymentRecord[],
};

type Tab = 'summary' | 'methods' | 'history';

// Constrained donut chart: explicit SVG dimensions prevent viewport-filling (fix #179)
function BillingDonutChart({ currentBalance, lastPayment }: { currentBalance: number; lastPayment: number }) {
  const total = currentBalance + lastPayment || 1;
  const cx = 64, cy = 64, r = 48, sw = 16;
  const circ = 2 * Math.PI * r;
  const dueDash = (currentBalance / total) * circ;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#6366f1" strokeWidth={sw}
        strokeDasharray={`${dueDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#4ade80" strokeWidth={sw}
        strokeDasharray={`${circ - dueDash} ${circ}`}
        strokeDashoffset={-dueDash}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

export function Billing() {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const handlePayNow = async () => {
    setIsPaying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPaying(false);
    setShowPayDialog(false);
  };

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSkeleton width="200px" height="32px" />
        <LoadingSkeleton height="280px" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => {}} />;
  }

  const { summary, paymentMethods, paymentHistory } = mockBilling;
  const defaultMethod = paymentMethods[0];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'methods', label: 'Payment Methods' },
    { id: 'history', label: 'Payment History' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">Manage payments and billing information</p>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="stack-gap">
          {/* Current Balance Card */}
          <div className="card">
            <div className="row-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p className="text-sm text-secondary">Current Balance</p>
                <p className="stat-value stat-value-lg mt-1">{formatAmount(summary.currentBalance)}</p>
                <p className="text-sm text-secondary mt-1">
                  Due by {formatDate(summary.nextPaymentDueDate)}
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowPayDialog(true)}>
                Pay Now
              </button>
            </div>

            {summary.autoPayEnabled && (
              <div className="row mt-4" style={{ paddingTop: '16px', borderTop: '1px solid var(--premium-border)', gap: '8px' }}>
                <CheckCircleIcon style={{ width: 16, height: 16, color: 'var(--premium-success)' }} />
                <span className="text-sm text-secondary">
                  Auto-pay enabled on {defaultMethod.cardBrand || 'SEPA'} •••• {defaultMethod.lastFour}
                </span>
              </div>
            )}
          </div>

          {/* Billing Breakdown Chart */}
          <div className="card">
            <h2 className="text-lg text-semibold mb-4">Billing Breakdown</h2>
            <div className="row" style={{ gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <BillingDonutChart
                  currentBalance={summary.currentBalance}
                  lastPayment={summary.lastPaymentAmount}
                />
              </div>
              <div className="stack-gap">
                <div className="row" style={{ gap: '8px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 'var(--radius-full)', background: '#6366f1', flexShrink: 0 }} />
                  <span className="text-sm text-secondary">Amount Due: {formatAmount(summary.currentBalance)}</span>
                </div>
                <div className="row" style={{ gap: '8px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 'var(--radius-full)', background: '#4ade80', flexShrink: 0 }} />
                  <span className="text-sm text-secondary">Last Payment: {formatAmount(summary.lastPaymentAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid-3">
            <div className="card card-hover">
              <div className="row" style={{ gap: '12px' }}>
                <div className="bg-success-light p-2 rounded">
                  <BanknotesIcon style={{ width: 20, height: 20, color: 'var(--premium-success)' }} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Last Payment</p>
                  <p className="text-base text-semibold">{formatAmount(summary.lastPaymentAmount)}</p>
                  <p className="text-xs text-muted">{formatDate(summary.lastPaymentDate)}</p>
                </div>
              </div>
            </div>

            <div className="card card-hover">
              <div className="row" style={{ gap: '12px' }}>
                <div className="bg-info-light p-2 rounded">
                  <CreditCardIcon style={{ width: 20, height: 20, color: 'var(--premium-info)' }} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Next Due Date</p>
                  <p className="text-base text-semibold">{formatDate(summary.nextPaymentDueDate)}</p>
                  <p className="text-xs text-muted">Monthly billing cycle</p>
                </div>
              </div>
            </div>

            <div className="card card-hover">
              <div className="row" style={{ gap: '12px' }}>
                <div className="bg-purple-light p-2 rounded">
                  <ClockIcon style={{ width: 20, height: 20, color: 'var(--premium-accent)' }} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Auto-Pay</p>
                  <p className="text-base text-semibold">{summary.autoPayEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="text-xs text-muted">Never miss a payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="stack-gap">
          <div className="row-between">
            <h2 className="text-lg text-semibold">Saved Payment Methods</h2>
            <button className="btn-secondary" onClick={() => setShowAddMethodDialog(true)}>
              Add Payment Method
            </button>
          </div>

          <div className="stack-gap">
            {paymentMethods.map((method, index) => (
              <PaymentMethodCard
                key={method.paymentMethodId}
                method={method}
                isDefault={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h2 className="text-lg text-semibold mb-4">Payment History</h2>
          <PaymentHistoryList payments={paymentHistory} />
        </div>
      )}

      {/* Pay Now Dialog */}
      <ConfirmDialog
        open={showPayDialog}
        onClose={() => setShowPayDialog(false)}
        onConfirm={handlePayNow}
        title="Confirm Payment"
        confirmText={isPaying ? 'Processing...' : 'Pay Now'}
        confirmDisabled={isPaying}
        loading={isPaying}
      >
        <p className="text-sm text-secondary">
          Pay {formatAmount(summary.currentBalance)} using your default payment method{' '}
          <span className="text-semibold">
            {defaultMethod.cardBrand} •••• {defaultMethod.lastFour}
          </span>
          ?
        </p>
      </ConfirmDialog>

      {/* Add Payment Method Dialog */}
      <ConfirmDialog
        open={showAddMethodDialog}
        onClose={() => setShowAddMethodDialog(false)}
        onConfirm={() => setShowAddMethodDialog(false)}
        title="Add Payment Method"
        confirmText="Add"
        cancelText="Cancel"
      >
        <p className="text-sm text-secondary">This feature will be available soon.</p>
      </ConfirmDialog>
    </div>
  );
}
