import { useState } from 'react';
import { LineCard } from '../../components/lines/LineCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { PlusIcon, WifiIcon } from '@heroicons/react/24/outline';
import type { Line } from '../../types/api';

// Mock data
const mockLines: Line[] = [
  {
    lineId: 'line-001',
    msisdn: '912 345 678',
    nickname: 'Personal',
    status: 'ACTIVE',
    plan: 'Unlimited 20GB',
    simNumber: 'SIM-8934567890',
    esimStatus: 'INSTALLED',
    primaryLine: true,
  },
  {
    lineId: 'line-002',
    msisdn: '912 345 679',
    nickname: 'Work',
    status: 'ACTIVE',
    plan: 'Unlimited 10GB',
    simNumber: 'SIM-8934567891',
    esimStatus: 'AVAILABLE',
    primaryLine: false,
  },
  {
    lineId: 'line-003',
    msisdn: '912 345 680',
    status: 'SUSPENDED',
    plan: 'Basic 2GB',
    simNumber: 'SIM-8934567892',
    esimStatus: 'NOT_SUPPORTED',
    primaryLine: false,
  },
];

export function Lines() {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="space-y-4">
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => {}} />;
  }

  const lines = mockLines;
  const activeLines = lines.filter((l) => l.status === 'ACTIVE');
  const otherLines = lines.filter((l) => l.status !== 'ACTIVE');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lines</h1>
          <p className="text-gray-500 mt-1">
            {activeLines.length} active line{activeLines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5" />
          Add New Line
        </button>
      </div>

      {/* Lines List */}
      <div className="space-y-4">
        {/* Primary Line Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Primary Line
          </h2>
          <LineCard line={lines.find((l) => l.primaryLine) || lines[0]} />
        </div>

        {/* Other Lines */}
        {otherLines.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Other Lines
            </h2>
            <div className="space-y-3">
              {otherLines.map((line) => (
                <LineCard key={line.lineId} line={line} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Card — WifiIcon constrained to h-8 w-8 to prevent SVG overflow (fix #180) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <WifiIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Need help with your lines?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Contact support to add new lines, change plans, or manage your existing
              services.
            </p>
            <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
