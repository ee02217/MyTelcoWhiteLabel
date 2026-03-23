import type { LineUsageEntry } from '../../types/usage';
import { formatDataGb, calculatePercentage } from '../../utils/usageFormatters';

interface UsageByLineProps {
  lines: LineUsageEntry[];
  totalDataMb: number;
  limits: {
    dataMb: number;
  };
}

export function UsageByLine({ lines, totalDataMb, limits }: UsageByLineProps) {
  const sortedLines = [...lines].sort((a, b) => b.usage.dataMb - a.usage.dataMb);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Usage by Line</h2>
        <p className="text-sm text-gray-500 mt-1">Individual line usage for this billing cycle</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {sortedLines.map((line) => {
          const dataPercent = calculatePercentage(line.usage.dataMb, limits.dataMb);
          const sharePercent = totalDataMb > 0 
            ? ((line.usage.dataMb / totalDataMb) * 100) 
            : 0;

          return (
            <div 
              key={line.lineId} 
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {line.msisdn.slice(-4)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{line.msisdn}</p>
                  <p className="text-sm text-gray-500">{line.nickname || 'No nickname'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDataGb(line.usage.dataMb)} GB</p>
                  <p className="text-xs text-gray-500">of {formatDataGb(limits.dataMb, 0)} GB</p>
                </div>
                
                <div className="w-32">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Share</span>
                    <span className="text-xs font-medium text-gray-700">
                      {sharePercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(dataPercent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-20 text-right">
                  <span className={`text-sm font-medium ${
                    dataPercent > 90 ? 'text-red-600' : 
                    dataPercent > 75 ? 'text-amber-600' : 
                    'text-green-600'
                  }`}>
                    {dataPercent.toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400 ml-1">of limit</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
