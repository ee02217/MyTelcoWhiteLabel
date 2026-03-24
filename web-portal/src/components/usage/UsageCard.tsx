import React from 'react';

interface UsageCardProps {
  title: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
  unit: string;
  color: 'blue' | 'green' | 'purple';
}

const colorMap = {
  blue: {
    fill: 'progress-fill-blue',
    bg: 'bg-info-light',
    text: 'text-info',
  },
  green: {
    fill: 'progress-fill-green',
    bg: 'bg-success-light',
    text: 'text-success',
  },
  purple: {
    fill: 'progress-fill-purple',
    bg: 'bg-purple-light',
    text: 'text-primary',
  },
};

export function UsageCard({ title, icon, used, limit, unit, color }: UsageCardProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isOverLimit = used > limit;

  const colors = colorMap[color];
  const fillClass = isOverLimit
    ? 'progress-fill-red'
    : isNearLimit
    ? 'progress-fill-amber'
    : colors.fill;

  return (
    <div className="card card-hover">
      <div className="row mb-4" style={{ gap: '10px' }}>
        <div className={`${colors.bg} p-2 rounded`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <h3 className="text-base text-semibold">{title}</h3>
      </div>

      <div className="mb-2">
        <span className={`text-2xl text-bold ${isOverLimit ? 'text-error' : ''}`}>
          {used.toLocaleString()}
        </span>
        <span className="text-sm text-muted ml-2">/ {limit.toLocaleString()} {unit}</span>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-fill ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isNearLimit && !isOverLimit && (
        <p className="text-xs text-warning mt-2">
          Approaching limit — consider upgrading
        </p>
      )}

      {isOverLimit && (
        <p className="text-xs text-error mt-2">
          Over limit — out-of-cycle charges may apply
        </p>
      )}
    </div>
  );
}
