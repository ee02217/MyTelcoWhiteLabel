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
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
  };

  return (
    <Link
      to={`/lines/${line.lineId}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${
            line.status === 'ACTIVE' ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <SignalIcon className={`h-6 w-6 ${
              line.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                +351 {line.msisdn}
              </h3>
              {line.primaryLine && (
                <StarIcon className="h-4 w-4 text-amber-500" title="Primary line" />
              )}
            </div>
            {line.nickname && (
              <p className="text-sm text-gray-500">{line.nickname}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[line.status] || 'bg-gray-100 text-gray-700'}`}>
                {line.status.charAt(0) + line.status.slice(1).toLowerCase()}
              </span>
              <span className="text-sm text-gray-400">{line.plan}</span>
            </div>
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  );
}
