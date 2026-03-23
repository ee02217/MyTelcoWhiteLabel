import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatDate, formatDataGb } from '../../utils/usageFormatters';

interface DailyUsageData {
  date: string;
  dataMb: number;
  voiceMinutes: number;
  smsCount: number;
}

interface UsageChartProps {
  data: DailyUsageData[];
  title?: string;
}

export function UsageChart({ data, title = 'Daily Usage' }: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500 text-sm">No daily usage data available.</p>
      </div>
    );
  }

  // Find peak day
  const peakData = data.reduce((max, item) => 
    item.dataMb > max.dataMb ? item : max, data[0]);

  // Format data for chart
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    fullDate: item.date,
    'Data (GB)': parseFloat(formatDataGb(item.dataMb)),
    dataMb: item.dataMb,
    isPeak: item.date === peakData.date,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullDate}</p>
          <p className="text-sm text-gray-600">
            Data: {data['Data (GB)']} GB
          </p>
          {data.isPeak && (
            <p className="text-xs text-amber-600 font-medium mt-1">Peak day</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">Data usage for each day this billing cycle</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Peak Day</p>
          <p className="font-medium text-gray-900">{formatDate(peakData.date)}</p>
          <p className="text-sm text-amber-600">{formatDataGb(peakData.dataMb)} GB</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}GB`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="Data (GB)" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isPeak ? '#f59e0b' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">Normal day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-gray-600">Peak day</span>
        </div>
      </div>
    </div>
  );
}
