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

  const statusBadge = (status: PaymentRecord['status']) => {
    if (status === 'completed') return 'badge badge-success';
    if (status === 'pending') return 'badge badge-warning';
    return 'badge badge-error';
  };

  return (
    <div className="stack">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="row-between py-3"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <div>
            <p className="text-base text-semibold">{formatAmount(payment.amount)}</p>
            <p className="text-sm text-secondary">{formatDate(payment.date)}</p>
            {payment.description && (
              <p className="text-xs text-muted">{payment.description}</p>
            )}
          </div>
          <div className="row" style={{ gap: '12px' }}>
            <span className={statusBadge(payment.status)}>
              {payment.status}
            </span>
            {payment.receiptUrl && (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary"
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
