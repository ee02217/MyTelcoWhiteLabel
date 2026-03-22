import { useMemo } from 'react';

interface DataUsageChartProps {
  dataUsed: number;
  dataLimit: number;
  dailyData: { date: string; used: number }[];
}

export function DataUsageChart({ dataUsed, dataLimit, dailyData }: DataUsageChartProps) {
  const { maxUsed, percentage, isNearLimit, isOverLimit } = useMemo(() => {
    const max = Math.max(...dailyData.map(d => d.used), 1);
    const pct = (dataUsed / dataLimit) * 100;
    return {
      maxUsed: max,
      percentage: pct,
      isNearLimit: pct > 80,
      isOverLimit: pct > 100,
    };
  }, [dataUsed, dataLimit, dailyData]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Daily Usage</h3>
        <span className={`text-sm ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
          {percentage.toFixed(1)}% of limit
        </span>
      </div>
      
      <div className="h-40 flex items-end gap-1">
        {dailyData.map((day, i) => {
          const height = (day.used / maxUsed) * 100;
          const isToday = i === dailyData.length - 1;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '140px' }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t transition-all ${
                    isToday ? 'bg-blue-600' : 'bg-blue-300'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
