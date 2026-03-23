import type { ServiceUsageBreakdown } from '../../types/usage';
import { formatDataGb, formatVoiceMinutes, formatSms, calculatePercentage } from '../../utils/usageFormatters';

interface UsageSummaryCardsProps {
  data: {
    used: ServiceUsageBreakdown;
    limits: {
      dataMb: number;
      voiceMinutes: number;
      smsCount: number;
    };
  };
  thresholdCrossings: Array<{
    serviceType: 'DATA' | 'VOICE' | 'SMS';
    thresholdPercent: number;
  }>;
}

interface SummaryCardProps {
  title: string;
  icon: string;
  used: string;
  limit: string;
  percent: number;
  color: 'blue' | 'green' | 'purple';
  isNearLimit: boolean;
  isOverLimit: boolean;
}

function SummaryCard({ title, icon, used, limit, percent, color, isNearLimit, isOverLimit }: SummaryCardProps) {
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
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <span className="text-xl" role="img" aria-label={title}>{icon}</span>
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
          {used}
        </span>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : colors.bar
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-500">
        of {limit} included
      </p>
    </div>
  );
}

export function UsageSummaryCards({ data, thresholdCrossings }: UsageSummaryCardsProps) {
  const { used, limits } = data;

  const dataPercent = calculatePercentage(used.dataMb, limits.dataMb);
  const voicePercent = calculatePercentage(used.voiceMinutes, limits.voiceMinutes);
  const smsPercent = calculatePercentage(used.smsCount, limits.smsCount);

  const dataNearLimit = thresholdCrossings.some(t => t.serviceType === 'DATA' && t.thresholdPercent >= 80);
  const voiceNearLimit = thresholdCrossings.some(t => t.serviceType === 'VOICE' && t.thresholdPercent >= 80);
  const smsNearLimit = thresholdCrossings.some(t => t.serviceType === 'SMS' && t.thresholdPercent >= 80);

  const dataOverLimit = dataPercent > 100;
  const voiceOverLimit = voicePercent > 100;
  const smsOverLimit = smsPercent > 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard
        title="Data"
        icon="📊"
        used={`${formatDataGb(used.dataMb)} GB`}
        limit={`${formatDataGb(limits.dataMb, 0)} GB`}
        percent={dataPercent}
        color="blue"
        isNearLimit={dataNearLimit}
        isOverLimit={dataOverLimit}
      />
      <SummaryCard
        title="Voice"
        icon="📞"
        used={formatVoiceMinutes(used.voiceMinutes)}
        limit={formatVoiceMinutes(limits.voiceMinutes)}
        percent={voicePercent}
        color="green"
        isNearLimit={voiceNearLimit}
        isOverLimit={voiceOverLimit}
      />
      <SummaryCard
        title="SMS"
        icon="💬"
        used={formatSms(used.smsCount)}
        limit={formatSms(limits.smsCount)}
        percent={smsPercent}
        color="purple"
        isNearLimit={smsNearLimit}
        isOverLimit={smsOverLimit}
      />
    </div>
  );
}
