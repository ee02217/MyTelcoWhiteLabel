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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.bg} flex items-center justify-center usage-icon-container`} style={{ width: '32px', height: '32px' }}>
            <div style={{ width: '20px', height: '20px' }}>{icon}</div>
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {isNearLimit && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isOverLimit ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isOverLimit ? 'Over limit' : 'Near limit'}
          </span>
        )}
      </div>

      <div className="mb-3">
        <span className={`text-3xl font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
          {used.toFixed(2)}
        </span>
        <span className="text-gray-500 ml-1 text-lg">{unit}</span>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : colors.bar
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-500">
        of {limit.toFixed(0)} {unit} included
      </p>
    </div>
  );
}
