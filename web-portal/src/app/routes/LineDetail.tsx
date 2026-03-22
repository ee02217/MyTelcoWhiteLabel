import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SIMStatusBadge } from '../../components/lines/SIMStatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  ArrowLeftIcon,
  SignalIcon,
  QrCodeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// Mock data
const mockLineDetail = {
  lineId: 'line-001',
  msisdn: '912 345 678',
  nickname: 'Personal',
  status: 'ACTIVE' as const,
  plan: 'Unlimited 20GB',
  simNumber: 'SIM-8934567890',
  esimStatus: 'INSTALLED' as const,
  primaryLine: true,
  usage: {
    dataUsedMb: 18500,
    dataLimitMb: 20480,
    voiceMinutesUsed: 342,
    voiceMinutesLimit: -1,
    smsUsed: 127,
    smsLimit: -1,
  },
  roamingEnabled: true,
};

type Tab = 'overview' | 'sim' | 'esim' | 'usage';
type EsimStatus = 'NOT_SUPPORTED' | 'AVAILABLE' | 'INSTALLED' | 'PENDING';

export function LineDetail() {
  useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const line = mockLineDetail;

  const handleBlock = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsActionLoading(false);
    setShowBlockDialog(false);
  };

  const handleUnblock = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsActionLoading(false);
    setShowUnblockDialog(false);
  };

  const handleRename = () => {
    setShowRenameDialog(false);
    // Would call API here
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (error || !line) {
    return <ErrorMessage message={error || 'Line not found'} onRetry={() => navigate('/lines')} />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sim', label: 'SIM' },
    { id: 'esim', label: 'eSIM' },
    { id: 'usage', label: 'Usage' },
  ];

  const esimStatusLabels: Record<EsimStatus, string> = {
    NOT_SUPPORTED: 'Not Supported',
    AVAILABLE: 'Available',
    INSTALLED: 'Installed',
    PENDING: 'Pending',
  };

  const dataPercent = (line.usage.dataUsedMb / line.usage.dataLimitMb) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/lines')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Lines
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-full">
            <SignalIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">+351 {line.msisdn}</h1>
              <SIMStatusBadge status={line.status} />
            </div>
            {line.nickname && (
              <p className="text-gray-500">{line.nickname}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setNewNickname(line.nickname || ''); setShowRenameDialog(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4" />
            Rename
          </button>
          {line.status === 'ACTIVE' ? (
            <button
              onClick={() => setShowBlockDialog(true)}
              className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              Block Line
            </button>
          ) : (
            <button
              onClick={() => setShowUnblockDialog(true)}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              Unblock Line
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Line Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone Number</dt>
                <dd className="font-medium">+351 {line.msisdn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Plan</dt>
                <dd className="font-medium">{line.plan}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">SIM Number</dt>
                <dd className="font-medium">{line.simNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">eSIM Status</dt>
                <dd className="font-medium">{esimStatusLabels[line.esimStatus as EsimStatus]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Roaming</dt>
                <dd className="font-medium text-green-600">
                  {line.roamingEnabled ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Data Usage</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Data Used</span>
                <span className="font-medium">
                  {(line.usage.dataUsedMb / 1024).toFixed(1)} GB / {(line.usage.dataLimitMb / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    dataPercent > 90 ? 'bg-red-500' : dataPercent > 75 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(dataPercent, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Voice</p>
                <p className="font-medium">{line.usage.voiceMinutesUsed} min</p>
              </div>
              <div>
                <p className="text-gray-500">SMS</p>
                <p className="font-medium">{line.usage.smsUsed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sim' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">SIM Card Information</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">SIM Number</dt>
              <dd className="font-mono text-sm">{line.simNumber}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Status</dt>
              <dd><SIMStatusBadge status={line.status} /></dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Type</dt>
              <dd className="text-sm">Physical SIM</dd>
            </div>
          </dl>
          
          {line.status === 'ACTIVE' && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Danger Zone</h3>
              <p className="text-sm text-gray-500 mb-3">
                Blocking this SIM will immediately disconnect all services on this line.
              </p>
              <button
                onClick={() => setShowBlockDialog(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Block SIM
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'esim' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">eSIM Management</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-full ${line.esimStatus === 'INSTALLED' as EsimStatus ? 'bg-green-50' : 'bg-gray-50'}`}>
              <QrCodeIcon className={`h-6 w-6 ${line.esimStatus === 'INSTALLED' as EsimStatus ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Status: {esimStatusLabels[line.esimStatus as EsimStatus]}</p>
              <p className="text-sm text-gray-500">
                {line.esimStatus === 'INSTALLED' as EsimStatus && 'Your eSIM is active and ready to use'}
                {line.esimStatus === 'AVAILABLE' as EsimStatus && 'You can install an eSIM on this device'}
                {line.esimStatus === 'NOT_SUPPORTED' as EsimStatus && 'This device does not support eSIM'}
              </p>
            </div>
          </div>

          {line.esimStatus === 'INSTALLED' as EsimStatus && (
            <div className="space-y-3">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Reinstall eSIM
              </button>
              <button className="w-full px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                Remove eSIM
              </button>
            </div>
          )}

          {line.esimStatus === 'AVAILABLE' as EsimStatus && (
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Install eSIM
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Current Billing Cycle Usage</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Data</span>
                <span className="font-medium">
                  {(line.usage.dataUsedMb / 1024).toFixed(2)} GB / {(line.usage.dataLimitMb / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width: `${dataPercent}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{line.usage.voiceMinutesUsed}</p>
                <p className="text-sm text-gray-500">Voice Minutes</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{line.usage.smsUsed}</p>
                <p className="text-sm text-gray-500">SMS Messages</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Dialog */}
      <ConfirmDialog
        open={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        onConfirm={handleBlock}
        title="Block Line?"
        confirmText={isActionLoading ? 'Blocking...' : 'Block Line'}
        confirmDisabled={isActionLoading}
        loading={isActionLoading}
        variant="danger"
      >
        <p className="text-gray-600">
          This will immediately disconnect all services on <strong>+351 {line.msisdn}</strong>.
          You can unblock it at any time.
        </p>
      </ConfirmDialog>

      {/* Unblock Dialog */}
      <ConfirmDialog
        open={showUnblockDialog}
        onClose={() => setShowUnblockDialog(false)}
        onConfirm={handleUnblock}
        title="Unblock Line?"
        confirmText={isActionLoading ? 'Unblocking...' : 'Unblock Line'}
        confirmDisabled={isActionLoading}
        loading={isActionLoading}
      >
        <p className="text-gray-600">
          This will restore all services on <strong>+351 {line.msisdn}</strong>.
        </p>
      </ConfirmDialog>

      {/* Rename Dialog */}
      <ConfirmDialog
        open={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        onConfirm={handleRename}
        title="Rename Line"
        confirmText="Save"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="e.g., Personal, Work"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
