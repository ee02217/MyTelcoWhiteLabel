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
      <div className="page">
        <LoadingSkeleton width="200px" height="32px" />
        <div className="stack-gap">
          <LoadingSkeleton height="96px" />
          <LoadingSkeleton height="96px" />
          <LoadingSkeleton height="96px" />
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
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">My Lines</h1>
            <p className="page-subtitle">
              {activeLines.length} active line{activeLines.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary">
            <PlusIcon style={{ width: 20, height: 20 }} />
            Add New Line
          </button>
        </div>
      </div>

      {/* Lines List */}
      <div className="stack-gap">
        {/* Primary Line Section */}
        <div>
          <h2 className="text-xs text-semibold text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Primary Line
          </h2>
          <LineCard line={lines.find((l) => l.primaryLine) || lines[0]} />
        </div>

        {/* Other Lines */}
        {otherLines.length > 0 && (
          <div>
            <h2 className="text-xs text-semibold text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Other Lines
            </h2>
            <div className="stack" style={{ gap: '12px' }}>
              {otherLines.map((line) => (
                <LineCard key={line.lineId} line={line} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="banner-info">
        <WifiIcon style={{ width: 24, height: 24, color: 'var(--premium-info)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 className="text-sm text-semibold" style={{ color: '#1e3a5f' }}>Need help with your lines?</h3>
          <p className="text-sm mt-1" style={{ color: '#1d4ed8' }}>
            Contact support to add new lines, change plans, or manage your existing services.
          </p>
          <button className="btn-ghost mt-3 text-sm" style={{ padding: 0 }}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
