import { Link } from 'react-router-dom';
import {
  SignalIcon,
  StarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { Line } from '../../types/api';

interface LineCardProps {
  line: Line;
}

export function LineCard({ line }: LineCardProps) {
  const statusBadge = (status: string) => {
    if (status === 'ACTIVE') return 'badge badge-success';
    if (status === 'SUSPENDED') return 'badge badge-warning';
    return 'badge badge-neutral';
  };

  return (
    <Link
      to={`/lines/${line.lineId}`}
      className="card card-hover"
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <div className="row-between items-start">
        <div className="row" style={{ gap: '16px' }}>
          <div className={`p-3 rounded-full ${line.status === 'ACTIVE' ? 'bg-success-light' : 'bg-muted'}`}>
            <SignalIcon style={{
              width: 24,
              height: 24,
              color: line.status === 'ACTIVE' ? 'var(--premium-success)' : 'var(--premium-text-muted)'
            }} />
          </div>
          <div>
            <div className="row" style={{ gap: '8px' }}>
              <h3 className="text-base text-semibold">+351 {line.msisdn}</h3>
              {line.primaryLine && (
                <StarIcon style={{ width: 16, height: 16, color: '#f59e0b' }} title="Primary line" />
              )}
            </div>
            {line.nickname && (
              <p className="text-sm text-secondary">{line.nickname}</p>
            )}
            <div className="row mt-1" style={{ gap: '12px' }}>
              <span className={statusBadge(line.status)}>
                {line.status.charAt(0) + line.status.slice(1).toLowerCase()}
              </span>
              <span className="text-sm text-muted">{line.plan}</span>
            </div>
          </div>
        </div>
        <ChevronRightIcon style={{ width: 20, height: 20, color: 'var(--premium-text-muted)' }} />
      </div>
    </Link>
  );
}
