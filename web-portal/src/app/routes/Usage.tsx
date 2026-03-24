import { useState } from 'react';
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

// Mock data - will be replaced by API call
const mockUsage = {
  billingCycle: {
    start: '2026-03-01',
    end: '2026-03-31',
    daysRemaining: 9,
  },
  data: {
    used: 18.5,
    limit: 20,
    unit: 'GB',
    dailyAverage: 0.77,
    peakDay: { date: '2026-03-15', used: 2.3 },
  },
  voice: {
    used: 342,
    limit: 500,
    unit: 'min',
    international: 45,
  },
  sms: {
    used: 127,
    limit: 200,
    unit: 'messages',
  },
  dailyData: [
    { date: '2026-03-01', used: 0.5 },
    { date: '2026-03-02', used: 0.8 },
    { date: '2026-03-03', used: 0.3 },
    { date: '2026-03-04', used: 1.2 },
    { date: '2026-03-05', used: 0.9 },
    { date: '2026-03-06', used: 0.4 },
    { date: '2026-03-07', used: 0.6 },
    { date: '2026-03-08', used: 1.5 },
    { date: '2026-03-09', used: 0.7 },
    { date: '2026-03-10', used: 0.8 },
    { date: '2026-03-11', used: 1.1 },
    { date: '2026-03-12', used: 0.5 },
    { date: '2026-03-13', used: 0.6 },
    { date: '2026-03-14', used: 0.9 },
    { date: '2026-03-15', used: 2.3 },
    { date: '2026-03-16', used: 0.8 },
    { date: '2026-03-17', used: 0.5 },
    { date: '2026-03-18', used: 0.7 },
    { date: '2026-03-19', used: 1.0 },
    { date: '2026-03-20', used: 0.6 },
    { date: '2026-03-21', used: 0.5 },
    { date: '2026-03-22', used: 0.4 },
  ],
};

export function Usage() {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedCycle] = useState('current');

  if (isLoading) {
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

  const usage = mockUsage;
  const { billingCycle, data, voice, sms } = usage;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Usage Details</h1>
            <p className="page-subtitle">
              {formatDate(billingCycle.start)} - {formatDate(billingCycle.end)}
              <span className="text-info ml-2">
                {billingCycle.daysRemaining} days remaining
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
          used={data.used}
          limit={data.limit}
          unit="GB"
          color="blue"
        />
        <UsageCard
          title="Voice"
          icon={<PhoneIcon style={{ width: 20, height: 20 }} />}
          used={voice.used}
          limit={voice.limit}
          unit="min"
          color="green"
        />
        <UsageCard
          title="SMS"
          icon={<ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} />}
          used={sms.used}
          limit={sms.limit}
          unit="msg"
          color="purple"
        />
      </div>

      {/* Usage Chart */}
      <DataUsageChart
        dataUsed={data.used}
        dataLimit={data.limit}
        dailyData={mockUsage.dailyData}
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
                <span className="detail-value">{data.dailyAverage.toFixed(2)} GB</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Peak usage day</span>
                <span className="detail-value">
                  {formatDate(data.peakDay.date)} ({data.peakDay.used} GB)
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Remaining</span>
                <span className="detail-value text-success">
                  {(data.limit - data.used).toFixed(1)} GB
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm text-medium text-secondary mb-2">Voice Details</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">International calls</span>
                <span className="detail-value">{voice.international} min</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Domestic calls</span>
                <span className="detail-value">{voice.used - voice.international} min</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Remaining</span>
                <span className="detail-value text-success">
                  {voice.limit - voice.used} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {data.used / data.limit > 0.8 && (
        <div className="banner-warning">
          <ExclamationTriangleIcon style={{ width: 20, height: 20, color: '#d97706', flexShrink: 0 }} />
          <div>
            <h3 className="text-sm text-semibold" style={{ color: '#92400e' }}>
              You're approaching your data limit
            </h3>
            <p className="text-sm mt-1" style={{ color: '#a16207' }}>
              You've used {((data.used / data.limit) * 100).toFixed(0)}% of your {data.limit} GB data allowance.
              Consider upgrading to avoid out-of-cycle charges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
