import { useState } from 'react';
import { UsageCard } from '../../components/usage/UsageCard';
import { DataUsageChart } from '../../components/usage/DataUsageChart';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  CircleStackIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
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
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Details</h1>
          <p className="text-gray-500 mt-1">
            {formatDate(billingCycle.start)} - {formatDate(billingCycle.end)}
            <span className="ml-2 text-blue-600">
              {billingCycle.daysRemaining} days remaining
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCycle}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current">Mar 1 - Mar 31, 2026</option>
            <option value="prev">Feb 1 - Feb 28, 2026</option>
          </select>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Data"
          icon={<CircleStackIcon className="h-5 w-5" />}
          used={data.used}
          limit={data.limit}
          unit="GB"
          color="blue"
        />
        <UsageCard
          title="Voice"
          icon={<PhoneIcon className="h-5 w-5" />}
          used={voice.used}
          limit={voice.limit}
          unit="min"
          color="green"
        />
        <UsageCard
          title="SMS"
          icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Usage Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Data Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Daily average</dt>
                <dd className="font-medium">{data.dailyAverage.toFixed(2)} GB</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Peak usage day</dt>
                <dd className="font-medium">
                  {formatDate(data.peakDay.date)} ({data.peakDay.used} GB)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Remaining</dt>
                <dd className="font-medium text-green-600">
                  {(data.limit - data.used).toFixed(1)} GB
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Voice Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">International calls</dt>
                <dd className="font-medium">{voice.international} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Domestic calls</dt>
                <dd className="font-medium">{voice.used - voice.international} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Remaining</dt>
                <dd className="font-medium text-green-600">
                  {(voice.limit - voice.used)} min
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {data.used / data.limit > 0.8 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-amber-800">You're approaching your data limit</h3>
            <p className="text-sm text-amber-700 mt-1">
              You've used {((data.used / data.limit) * 100).toFixed(0)}% of your {data.limit} GB data allowance.
              Consider upgrading to avoid out-of-cycle charges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
