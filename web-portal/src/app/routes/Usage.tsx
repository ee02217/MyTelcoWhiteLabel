import { useState, useMemo } from 'react';
import { useUsageData } from '../../hooks/useUsageData';
import { BillingCycleSelector } from '../../components/usage/BillingCycleSelector';
import { UsageSummaryCards } from '../../components/usage/UsageSummaryCards';
import { UsageByLine } from '../../components/usage/UsageByLine';
import { UsageProjections } from '../../components/usage/UsageProjections';
import { ThresholdAlerts } from '../../components/usage/ThresholdAlerts';
import { QuickStats } from '../../components/usage/QuickStats';
import { UsageChart } from '../../components/usage/UsageChart';
import { UsageDetailsTable } from '../../components/usage/UsageDetailsTable';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDaysRemaining } from '../../utils/usageFormatters';

// Default limits - in production these would come from the API
const DEFAULT_LIMITS = {
  dataMb: 10 * 1024, // 10 GB
  voiceMinutes: 500,
  smsCount: 200,
};

// Mock daily data - in production this would come from a separate API
const MOCK_DAILY_DATA = [
  { date: '2026-03-01', dataMb: 512, voiceMinutes: 15, smsCount: 3 },
  { date: '2026-03-02', dataMb: 820, voiceMinutes: 8, smsCount: 5 },
  { date: '2026-03-03', dataMb: 307, voiceMinutes: 22, smsCount: 2 },
  { date: '2026-03-04', dataMb: 1228, voiceMinutes: 5, smsCount: 8 },
  { date: '2026-03-05', dataMb: 922, voiceMinutes: 18, smsCount: 4 },
  { date: '2026-03-06', dataMb: 410, voiceMinutes: 12, smsCount: 6 },
  { date: '2026-03-07', dataMb: 615, voiceMinutes: 25, smsCount: 3 },
  { date: '2026-03-08', dataMb: 1536, voiceMinutes: 10, smsCount: 9 },
  { date: '2026-03-09', dataMb: 717, voiceMinutes: 15, smsCount: 4 },
  { date: '2026-03-10', dataMb: 820, voiceMinutes: 8, smsCount: 5 },
  { date: '2026-03-11', dataMb: 1126, voiceMinutes: 20, smsCount: 7 },
  { date: '2026-03-12', dataMb: 512, voiceMinutes: 12, smsCount: 3 },
  { date: '2026-03-13', dataMb: 615, voiceMinutes: 18, smsCount: 4 },
  { date: '2026-03-14', dataMb: 922, voiceMinutes: 14, smsCount: 6 },
  { date: '2026-03-15', dataMb: 2355, voiceMinutes: 25, smsCount: 10 },
  { date: '2026-03-16', dataMb: 820, voiceMinutes: 8, smsCount: 5 },
  { date: '2026-03-17', dataMb: 512, voiceMinutes: 15, smsCount: 3 },
  { date: '2026-03-18', dataMb: 717, voiceMinutes: 10, smsCount: 4 },
  { date: '2026-03-19', dataMb: 1024, voiceMinutes: 22, smsCount: 6 },
  { date: '2026-03-20', dataMb: 615, voiceMinutes: 12, smsCount: 3 },
  { date: '2026-03-21', dataMb: 512, voiceMinutes: 18, smsCount: 4 },
  { date: '2026-03-22', dataMb: 410, voiceMinutes: 8, smsCount: 2 },
];

// Mock detailed records for the table
function generateMockRecords(): Array<{ date: string; type: 'DATA' | 'VOICE' | 'SMS'; amount: number; runningTotal: number }> {
  const records: Array<{ date: string; type: 'DATA' | 'VOICE' | 'SMS'; amount: number; runningTotal: number }> = [];
  let dataTotal = 0;
  let voiceTotal = 0;
  let smsTotal = 0;

  for (const day of MOCK_DAILY_DATA) {
    dataTotal += day.dataMb;
    voiceTotal += day.voiceMinutes;
    smsTotal += day.smsCount;
    
    records.push(
      { date: day.date, type: 'DATA', amount: day.dataMb, runningTotal: dataTotal },
      { date: day.date, type: 'VOICE', amount: day.voiceMinutes, runningTotal: voiceTotal },
      { date: day.date, type: 'SMS', amount: day.smsCount, runningTotal: smsTotal }
    );
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

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

      {/* Daily Usage Chart */}
      <UsageChart data={MOCK_DAILY_DATA} />

      {/* Usage Details Table */}
      <UsageDetailsTable data={generateMockRecords()} />
    </div>
  );
}
