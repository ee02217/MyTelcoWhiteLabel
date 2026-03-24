import { useState } from 'react';
import { PaymentMethodCard } from '../../components/billing/PaymentMethodCard';
import { PaymentHistoryList } from '../../components/billing/PaymentHistoryList';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  CreditCardIcon,
  BanknotesIcon,
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
        fill="none" stroke="#3b82f6" strokeWidth={sw}
        strokeDasharray={`${dueDash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#4ade80" strokeWidth={sw}
        strokeDasharray={`${circ - dueDash} ${circ}`}
        strokeDashoffset={-dueDash}
        transform={`rotate(-90 ${cx} ${cy})`}
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
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-64" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage payments and billing information</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Current Balance Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatAmount(summary.currentBalance)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Due by {formatDate(summary.nextPaymentDueDate)}
                </p>
              </div>
              <button
                onClick={() => setShowPayDialog(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pay Now
              </button>
            </div>

            {summary.autoPayEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                Auto-pay enabled on {defaultMethod.cardBrand || 'SEPA'} ••••{' '}
                {defaultMethod.lastFour}
              </div>
            )}
          </div>

          {/* Billing Breakdown Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Breakdown</h2>
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 flex-shrink-0">
                <BillingDonutChart
                  currentBalance={summary.currentBalance}
                  lastPayment={summary.lastPaymentAmount}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">Amount Due: {formatAmount(summary.currentBalance)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-gray-600">Last Payment: {formatAmount(summary.lastPaymentAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <BanknotesIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Payment</p>
                  <p className="font-medium text-gray-900">
                    {formatAmount(summary.lastPaymentAmount)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(summary.lastPaymentDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCardIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Due Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(summary.nextPaymentDueDate)}
                  </p>
                  <p className="text-xs text-gray-400">Monthly billing cycle</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Auto-Pay</p>
                  <p className="font-medium text-gray-900">
                    {summary.autoPayEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-xs text-gray-400">Never miss a payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h2>
            <button
              onClick={() => setShowAddMethodDialog(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add Payment Method
            </button>
          </div>

          <div className="space-y-4">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
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
        <p className="text-gray-600">
          Pay {formatAmount(summary.currentBalance)} using your default payment method{' '}
          <span className="font-medium">
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
        <p className="text-gray-600">This feature will be available soon.</p>
      </ConfirmDialog>
    </div>
  );
}
