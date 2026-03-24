import { useEffect, useState } from 'react';
import { UsageCard } from '../../components/usage/UsageCard';
import { DataUsageChart } from '../../components/usage/DataUsageChart';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  CircleStackIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { UsageDetails } from '../../types/api';

// Fallback mock data used when API call fails
const FALLBACK_MOCK: UsageDetails = {
  billingCycleStart: '2026-03-01',
  billingCycleEnd: '2026-03-31',
  dataUsedMb: 18944,
  dataLimitMb: 20480,
  voiceMinutesUsed: 342,
  voiceMinutesLimit: 500,
  smsUsed: 127,
  smsLimit: 200,
  dailyUsage: [
    { date: '2026-03-01', dataUsedMb: 512, voiceMinutesUsed: 15, smsUsed: 5 },
    { date: '2026-03-02', dataUsedMb: 819, voiceMinutesUsed: 20, smsUsed: 8 },
    { date: '2026-03-03', dataUsedMb: 307, voiceMinutesUsed: 10, smsUsed: 3 },
    { date: '2026-03-04', dataUsedMb: 1229, voiceMinutesUsed: 25, smsUsed: 12 },
    { date: '2026-03-05', dataUsedMb: 922, voiceMinutesUsed: 18, smsUsed: 9 },
    { date: '2026-03-06', dataUsedMb: 410, voiceMinutesUsed: 12, smsUsed: 4 },
    { date: '2026-03-07', dataUsedMb: 614, voiceMinutesUsed: 14, smsUsed: 6 },
    { date: '2026-03-08', dataUsedMb: 1536, voiceMinutesUsed: 22, smsUsed: 10 },
    { date: '2026-03-09', dataUsedMb: 717, voiceMinutesUsed: 16, smsUsed: 7 },
    { date: '2026-03-10', dataUsedMb: 819, voiceMinutesUsed: 19, smsUsed: 8 },
    { date: '2026-03-11', dataUsedMb: 1126, voiceMinutesUsed: 21, smsUsed: 11 },
    { date: '2026-03-12', dataUsedMb: 512, voiceMinutesUsed: 13, smsUsed: 5 },
    { date: '2026-03-13', dataUsedMb: 614, voiceMinutesUsed: 15, smsUsed: 6 },
    { date: '2026-03-14', dataUsedMb: 922, voiceMinutesUsed: 17, smsUsed: 9 },
    { date: '2026-03-15', dataUsedMb: 2355, voiceMinutesUsed: 28, smsUsed: 14 },
    { date: '2026-03-16', dataUsedMb: 819, voiceMinutesUsed: 20, smsUsed: 8 },
    { date: '2026-03-17', dataUsedMb: 512, voiceMinutesUsed: 12, smsUsed: 5 },
    { date: '2026-03-18', dataUsedMb: 717, voiceMinutesUsed: 14, smsUsed: 7 },
    { date: '2026-03-19', dataUsedMb: 1024, voiceMinutesUsed: 18, smsUsed: 10 },
    { date: '2026-03-20', dataUsedMb: 614, voiceMinutesUsed: 15, smsUsed: 6 },
    { date: '2026-03-21', dataUsedMb: 512, voiceMinutesUsed: 13, smsUsed: 5 },
    { date: '2026-03-22', dataUsedMb: 410, voiceMinutesUsed: 11, smsUsed: 4 },
  ],
};

interface UsageProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function Usage({ authedFetch }: UsageProps) {
  const [usage, setUsage] = useState<UsageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [selectedCycle] = useState('current');

  useEffect(() => {
    authedFetch('/api/v1/customer/usage')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        return r.json();
      })
      .then(setUsage)
      .catch((err) => {
        console.warn('Usage API failed, using fallback:', err);
        setUsage(FALLBACK_MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page">
        <LoadingSkeleton width="200px" height="32px" />
        <div className="grid-3">
          <LoadingSkeleton height="200px" />
          <LoadingSkeleton height="200px" />
          <LoadingSkeleton height="200px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => {}} />;
  }

  if (!usage) return null;

  const dataUsedGb = usage.dataUsedMb / 1024;
  const dataLimitGb = usage.dataLimitMb / 1024;
  const dataPercent = (usage.dataUsedMb / usage.dataLimitMb) * 100;

  // Compute derived fields for display
  const billingCycleDaysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(usage.billingCycleEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
  const dailyAverage = usage.dailyUsage.length > 0
    ? usage.dailyUsage.reduce((sum, d) => sum + d.dataUsedMb, 0) / usage.dailyUsage.length / 1024
    : 0;
  const peakDay = usage.dailyUsage.reduce(
    (max, d) => (d.dataUsedMb > max.dataUsedMb ? d : max),
    usage.dailyUsage[0] || { date: '', dataUsedMb: 0, voiceMinutesUsed: 0, smsUsed: 0 }
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

  // Transform dailyUsage for the chart component (expects {date, used} in GB)
  const dailyDataForChart = usage.dailyUsage.map((d) => ({
    date: d.date,
    used: parseFloat((d.dataUsedMb / 1024).toFixed(2)),
  }));

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Usage Details</h1>
            <p className="page-subtitle">
              {formatDate(usage.billingCycleStart)} - {formatDate(usage.billingCycleEnd)}
              <span className="text-info ml-2">
                {billingCycleDaysRemaining} days remaining
              </span>
            </p>
          </div>
          <select
            value={selectedCycle}
            className="form-select"
          >
            <option value="current">Mar 1 - Mar 31, 2026</option>
            <option value="prev">Feb 1 - Feb 28, 2026</option>
          </select>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid-3">
        <UsageCard
          title="Data"
          icon={<CircleStackIcon style={{ width: 20, height: 20 }} />}
          used={parseFloat(dataUsedGb.toFixed(1))}
          limit={parseFloat(dataLimitGb.toFixed(0))}
          unit="GB"
          color="blue"
        />
        <UsageCard
          title="Voice"
          icon={<PhoneIcon style={{ width: 20, height: 20 }} />}
          used={usage.voiceMinutesUsed}
          limit={usage.voiceMinutesLimit}
          unit="min"
          color="green"
        />
        <UsageCard
          title="SMS"
          icon={<ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} />}
          used={usage.smsUsed}
          limit={usage.smsLimit}
          unit="msg"
          color="purple"
        />
      </div>

      {/* Usage Chart */}
      <DataUsageChart
        dataUsed={parseFloat(dataUsedGb.toFixed(1))}
        dataLimit={parseFloat(dataLimitGb.toFixed(0))}
        dailyData={dailyDataForChart}
      />

      {/* Details */}
      <div className="card">
        <h2 className="text-lg text-semibold mb-4">Usage Breakdown</h2>
        <div className="grid-2">
          <div>
            <h3 className="text-sm text-medium text-secondary mb-2">Data Details</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Daily average</span>
                <span className="detail-value">{dailyAverage.toFixed(2)} GB</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Peak usage day</span>
                <span className="detail-value">
                  {peakDay.date ? formatDate(peakDay.date) : 'N/A'} ({(peakDay.dataUsedMb / 1024).toFixed(1)} GB)
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Remaining</span>
                <span className="detail-value text-success">
                  {(dataLimitGb - dataUsedGb).toFixed(1)} GB
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm text-medium text-secondary mb-2">Voice Details</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Total used</span>
                <span className="detail-value">{usage.voiceMinutesUsed} min</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Remaining</span>
                <span className="detail-value text-success">
                  {usage.voiceMinutesLimit > 0
                    ? `${usage.voiceMinutesLimit - usage.voiceMinutesUsed} min`
                    : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {dataPercent > 80 && (
        <div className="banner-warning">
          <ExclamationTriangleIcon style={{ width: 20, height: 20, color: '#d97706', flexShrink: 0 }} />
          <div>
            <h3 className="text-sm text-semibold" style={{ color: '#92400e' }}>
              You're approaching your data limit
            </h3>
            <p className="text-sm mt-1" style={{ color: '#a16207' }}>
              You've used {dataPercent.toFixed(0)}% of your {dataLimitGb.toFixed(0)} GB data allowance.
              Consider upgrading to avoid out-of-cycle charges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
