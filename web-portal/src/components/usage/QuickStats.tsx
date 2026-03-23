import { formatDate, formatDataGb, getDaysRemaining } from '../../utils/usageFormatters';

interface QuickStatsProps {
  peakDay: {
    date: string;
    dataMb: number;
  };
  dailyAverageGb: number;
  remainingGb: number;
  totalLimitGb: number;
  activeLines: number;
  periodEnd: string;
}

export function QuickStats({
  peakDay,
  dailyAverageGb,
  remainingGb,
  totalLimitGb,
  activeLines,
  periodEnd,
}: QuickStatsProps) {
  const daysRemaining = getDaysRemaining(periodEnd);

  const stats = [
    {
      label: 'Peak Usage Day',
      value: formatDate(peakDay.date),
      subValue: `${formatDataGb(peakDay.dataMb)} GB used`,
      icon: '📈',
    },
    {
      label: 'Daily Average',
      value: `${dailyAverageGb.toFixed(2)} GB`,
      subValue: 'per day',
      icon: '📊',
    },
    {
      label: 'Data Remaining',
      value: `${remainingGb.toFixed(1)} GB`,
      subValue: `of ${totalLimitGb.toFixed(0)} GB limit`,
      icon: '💾',
    },
    {
      label: 'Active Lines',
      value: activeLines.toString(),
      subValue: daysRemaining > 0 ? `${daysRemaining} days left` : 'cycle ended',
      icon: '📱',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label={stat.label}>{stat.icon}</span>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-600">{stat.subValue}</p>
        </div>
      ))}
    </div>
  );
}
