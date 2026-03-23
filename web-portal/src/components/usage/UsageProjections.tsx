import { formatDate } from '../../utils/usageFormatters';

interface UsageProjectionsProps {
  dataDaysRemaining: number | null;
  dataLimitBreachDate: string | null;
  dataDailyAverageGb: number;
}

export function UsageProjections({
  dataDaysRemaining,
  dataLimitBreachDate,
  dataDailyAverageGb,
}: UsageProjectionsProps) {
  // Don't show if no projection available
  if (dataDaysRemaining === null && dataLimitBreachDate === null) {
    return null;
  }

  const isNearLimit = dataDaysRemaining !== null && dataDaysRemaining <= 7;

  if (isNearLimit) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl" role="img" aria-label="warning">⏰</span>
          <div>
            <h3 className="font-medium text-amber-800">
              {dataDaysRemaining !== null && dataDaysRemaining > 0
                ? `At your current rate, you'll hit your data limit in ${dataDaysRemaining} days`
                : 'You are projected to exceed your data limit this billing cycle'}
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Daily average: {dataDailyAverageGb.toFixed(2)} GB/day
              {dataLimitBreachDate && ` • Predicted: ${formatDate(dataLimitBreachDate)}`}
            </p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors"
          onClick={() => {}}
        >
          Upgrade Plan →
        </button>
      </div>
    );
  }

  return null;
}
