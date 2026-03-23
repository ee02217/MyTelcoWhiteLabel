import { formatDateLong } from '../../utils/usageFormatters';

interface BillingCycleSelectorProps {
  periodStart: string;
  periodEnd: string;
  daysRemaining: number;
  selectedView: 'daily' | 'billing-cycle';
  onViewChange: (view: 'daily' | 'billing-cycle') => void;
}

export function BillingCycleSelector({
  periodStart,
  periodEnd,
  daysRemaining,
  selectedView,
  onViewChange,
}: BillingCycleSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="text-sm text-gray-500">
        {formatDateLong(periodStart)} - {formatDateLong(periodEnd)}
        <span className="ml-2 text-blue-600 font-medium">
          {daysRemaining} days remaining
        </span>
      </div>
      <select
        value={selectedView}
        onChange={(e) => onViewChange(e.target.value as 'daily' | 'billing-cycle')}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="billing-cycle">Billing Cycle</option>
        <option value="daily">Daily View</option>
      </select>
    </div>
  );
}
