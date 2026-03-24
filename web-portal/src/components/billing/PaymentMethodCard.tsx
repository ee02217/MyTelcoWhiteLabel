import { CreditCardIcon } from '@heroicons/react/24/outline';
import type { PaymentMethod } from '../../types/api';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isDefault: boolean;
  onSetDefault?: () => void;
  onRemove?: () => void;
}

export function PaymentMethodCard({ method, isDefault, onSetDefault, onRemove }: PaymentMethodCardProps) {
  const isCard = method.type === 'CARD';

  return (
    <div
      className="card card-hover"
      style={isDefault ? { borderColor: 'var(--premium-primary)', background: '#fafafe' } : undefined}
    >
      <div className="row-between items-start">
        <div className="row" style={{ gap: '12px' }}>
          <div className={`p-2 rounded ${isDefault ? 'bg-info-light' : 'bg-muted'}`}>
            <CreditCardIcon style={{ width: 20, height: 20, color: 'var(--premium-text-secondary)' }} />
          </div>
          <div>
            <p className="text-base text-semibold">
              {isCard ? method.cardBrand : 'Bank Account'}
            </p>
            <p className="text-sm text-secondary">
              {isCard
                ? `•••• ${method.lastFour}`
                : `${method.bankName} ••${method.lastFour}`}
            </p>
            {isCard && method.expiryDate && (
              <p className="text-xs text-muted">Expires {method.expiryDate}</p>
            )}
          </div>
        </div>
        <div className="row" style={{ gap: '8px' }}>
          {isDefault && (
            <span className="badge badge-info">Default</span>
          )}
          {!isDefault && onSetDefault && (
            <button className="btn-ghost text-sm" onClick={onSetDefault}>
              Set as default
            </button>
          )}
        </div>
      </div>
      {!isDefault && onRemove && (
        <div className="border-t mt-3" style={{ paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost text-sm text-error" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
