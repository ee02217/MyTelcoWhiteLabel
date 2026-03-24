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
    <div className="card">
      <div className="row-between mb-4">
        <h3 className="text-base text-semibold">Daily Usage</h3>
        <span className={`text-sm ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-muted'}`}>
          {percentage.toFixed(1)}% of limit
        </span>
      </div>

      <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
        {dailyData.map((day, i) => {
          const height = (day.used / maxUsed) * 100;
          const isToday = i === dailyData.length - 1;
          return (
            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '100%', height: '140px', background: '#f1f5f9', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    borderRadius: '4px 4px 0 0',
                    height: `${height}%`,
                    background: isToday
                      ? 'linear-gradient(180deg, #6366f1, #818cf8)'
                      : 'linear-gradient(180deg, #c7d2fe, #e0e7ff)',
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
              <span className="text-xs text-muted">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
