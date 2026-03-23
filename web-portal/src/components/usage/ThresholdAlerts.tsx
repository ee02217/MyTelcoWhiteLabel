import type { UsageThresholdCrossing } from '../../types/usage';

interface ThresholdAlertsProps {
  crossings: UsageThresholdCrossing[];
  onUpgradeClick?: () => void;
}

export function ThresholdAlerts({ crossings, onUpgradeClick }: ThresholdAlertsProps) {
  if (crossings.length === 0) {
    return null;
  }

  const sortedCrossings = [...crossings].sort((a, b) => b.thresholdPercent - a.thresholdPercent);

  return (
    <div className="space-y-3">
      {sortedCrossings.map((crossing, index) => {
        const isOverLimit = crossing.thresholdPercent >= 100;
        const isHigh = crossing.thresholdPercent >= 80;

        if (!isHigh) return null;

        return (
          <div
            key={`${crossing.serviceType}-${index}`}
            className={`rounded-lg p-4 flex items-start gap-3 ${
              isOverLimit 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <span className={`text-lg`} role="img" aria-label="warning">
                {isOverLimit ? '🚨' : '⚠️'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${
                isOverLimit ? 'text-red-800' : 'text-amber-800'
              }`}>
                {crossing.message}
              </h3>
              <p className={`text-sm mt-1 ${
                isOverLimit ? 'text-red-700' : 'text-amber-700'
              }`}>
                {isOverLimit 
                  ? 'Consider upgrading to avoid out-of-cycle charges.'
                  : 'Consider upgrading your plan to avoid running out.'}
              </p>
            </div>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isOverLimit
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                Upgrade Plan
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
