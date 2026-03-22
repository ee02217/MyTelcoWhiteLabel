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
    <div className={`border rounded-lg p-4 ${isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDefault ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <CreditCardIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {isCard ? method.cardBrand : 'Bank Account'}
            </p>
            <p className="text-sm text-gray-500">
              {isCard
                ? `•••• ${method.lastFour}`
                : `${method.bankName} ••${method.lastFour}`}
            </p>
            {isCard && method.expiryDate && (
              <p className="text-xs text-gray-400">Expires {method.expiryDate}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && (
            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
              Default
            </span>
          )}
          {!isDefault && onSetDefault && (
            <button
              onClick={onSetDefault}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Set as default
            </button>
          )}
        </div>
      </div>
      {!isDefault && onRemove && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
