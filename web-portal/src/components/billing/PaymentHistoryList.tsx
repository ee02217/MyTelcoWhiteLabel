import type { PaymentRecord } from '../../types/api';

interface PaymentHistoryListProps {
  payments: PaymentRecord[];
}

export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div>
            <p className="font-medium text-gray-900">
              {formatAmount(payment.amount)}
            </p>
            <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
            {payment.description && (
              <p className="text-xs text-gray-400">{payment.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                payment.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : payment.status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {payment.status}
            </span>
            {payment.receiptUrl && (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Receipt
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
