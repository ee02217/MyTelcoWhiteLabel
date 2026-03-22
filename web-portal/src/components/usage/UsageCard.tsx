import React from 'react';

interface UsageCardProps {
  title: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
  unit: string;
  color: 'blue' | 'green' | 'purple';
}

export function UsageCard({ title, icon, used, limit, unit, color }: UsageCardProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isOverLimit = used > limit;

  const colorClasses = {
    blue: {
      bar: 'bg-blue-600',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    green: {
      bar: 'bg-green-600',
      text: 'text-green-600',
      bg: 'bg-green-50',
    },
    purple: {
      bar: 'bg-purple-600',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="mb-2">
        <span className={`text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
          {used.toLocaleString()}
        </span>
        <span className="text-gray-500 ml-1">/ {limit.toLocaleString()} {unit}</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : colors.bar
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isNearLimit && !isOverLimit && (
        <p className="text-xs text-amber-600 mt-2">
          Approaching limit - consider upgrading
        </p>
      )}

      {isOverLimit && (
        <p className="text-xs text-red-600 mt-2">
          Over limit - out-of-cycle charges may apply
        </p>
      )}
    </div>
  );
}
