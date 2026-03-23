import { useState, useMemo } from 'react';
import { useUsageData } from '../../hooks/useUsageData';
import { BillingCycleSelector } from '../../components/usage/BillingCycleSelector';
import { UsageSummaryCards } from '../../components/usage/UsageSummaryCards';
import { UsageByLine } from '../../components/usage/UsageByLine';
import { UsageProjections } from '../../components/usage/UsageProjections';
import { ThresholdAlerts } from '../../components/usage/ThresholdAlerts';
import { QuickStats } from '../../components/usage/QuickStats';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDaysRemaining } from '../../utils/usageFormatters';

// Default limits - in production these would come from the API
const DEFAULT_LIMITS = {
  dataMb: 10 * 1024, // 10 GB
  voiceMinutes: 500,
  smsCount: 200,
};

interface UsageProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function Usage({ authedFetch }: UsageProps) {
  const [view, setView] = useState<'daily' | 'billing-cycle'>('billing-cycle');

  const { data, isLoading, error, refetch } = useUsageData({
    view,
    authedFetch,
  });

  // Calculate derived data
  const derivedData = useMemo(() => {
    if (!data) {
      return null;
    }

    const daysRemaining = getDaysRemaining(data.periodEnd);
    const totalDataMb = data.totals.dataMb;
    const dailyAverageMb = totalDataMb / Math.max(1, 30 - daysRemaining);
    const dailyAverageGb = dailyAverageMb / 1024;
    const remainingGb = (DEFAULT_LIMITS.dataMb - totalDataMb) / 1024;

    // Simple projection: days until limit
    const dataDaysRemaining = dailyAverageGb > 0 
      ? Math.floor(remainingGb / dailyAverageGb)
      : null;

    // Find peak day from lines (simplified)
    const peakLine = data.lines.reduce(
      (peak, line) => (line.usage.dataMb > peak.usage.dataMb ? line : peak),
      data.lines[0]
    );

    return {
      daysRemaining,
      dailyAverageGb,
      remainingGb,
      dataDaysRemaining,
      totalDataMb,
      peakDay: {
        date: data.periodStart, // Simplified - would need daily API for actual peak
        dataMb: peakLine?.usage.dataMb || 0,
      },
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-40" />
          <LoadingSkeleton className="h-40" />
          <LoadingSkeleton className="h-40" />
        </div>
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load usage data. Please try again." 
        onRetry={refetch} 
      />
    );
  }

  if (!data || !derivedData) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Details</h1>
        </div>
        <BillingCycleSelector
          periodStart={data.periodStart}
          periodEnd={data.periodEnd}
          daysRemaining={derivedData.daysRemaining}
          selectedView={view}
          onViewChange={setView}
        />
      </div>

      {/* Threshold Alerts */}
      <ThresholdAlerts crossings={data.thresholdCrossings} />

      {/* Usage Summary Cards */}
      <UsageSummaryCards
        data={{
          used: data.totals,
          limits: DEFAULT_LIMITS,
        }}
        thresholdCrossings={data.thresholdCrossings}
      />

      {/* Projection Banner */}
      <UsageProjections
        dataDaysRemaining={derivedData.dataDaysRemaining}
        dataLimitBreachDate={null}
        dataDailyAverageGb={derivedData.dailyAverageGb}
      />

      {/* Usage by Line */}
      <UsageByLine
        lines={data.lines}
        totalDataMb={derivedData.totalDataMb}
        limits={{ dataMb: DEFAULT_LIMITS.dataMb }}
      />

      {/* Quick Stats */}
      <QuickStats
        peakDay={derivedData.peakDay}
        dailyAverageGb={derivedData.dailyAverageGb}
        remainingGb={derivedData.remainingGb}
        totalLimitGb={DEFAULT_LIMITS.dataMb / 1024}
        activeLines={data.lines.length}
        periodEnd={data.periodEnd}
      />
    </div>
  );
}
