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
  };

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSkeleton width="200px" height="32px" />
        <LoadingSkeleton height="280px" />
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

  const getProgressFill = () => {
    if (dataPercent > 90) return 'progress-fill-red';
    if (dataPercent > 75) return 'progress-fill-amber';
    return 'progress-fill-blue';
  };

  return (
    <div className="page">
      {/* Back Button */}
      <button
        className="btn-ghost self-start"
        onClick={() => navigate('/lines')}
        style={{ padding: '6px 12px', gap: '6px' }}
      >
        <ArrowLeftIcon style={{ width: 18, height: 18 }} />
        Back to Lines
      </button>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="row" style={{ gap: '16px' }}>
            <div className="bg-success-light p-3 rounded-full">
              <SignalIcon style={{ width: 28, height: 28, color: 'var(--premium-success)' }} />
            </div>
            <div>
              <div className="row" style={{ gap: '12px' }}>
                <h1 className="page-title">+351 {line.msisdn}</h1>
                <SIMStatusBadge status={line.status} />
              </div>
              {line.nickname && (
                <p className="page-subtitle">{line.nickname}</p>
              )}
            </div>
          </div>
          <div className="row" style={{ gap: '8px' }}>
            <button
              className="btn-secondary"
              onClick={() => { setNewNickname(line.nickname || ''); setShowRenameDialog(true); }}
            >
              <PencilIcon style={{ width: 16, height: 16 }} />
              Rename
            </button>
            {line.status === 'ACTIVE' ? (
              <button className="btn-danger" onClick={() => setShowBlockDialog(true)}>
                Block Line
              </button>
            ) : (
              <button className="btn-primary" style={{ background: 'var(--premium-success)' }} onClick={() => setShowUnblockDialog(true)}>
                Unblock Line
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="text-base text-semibold mb-4">Line Details</h2>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Phone Number</span>
                <span className="detail-value">+351 {line.msisdn}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Plan</span>
                <span className="detail-value">{line.plan}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">SIM Number</span>
                <span className="detail-value">{line.simNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">eSIM Status</span>
                <span className="detail-value">{esimStatusLabels[line.esimStatus as EsimStatus]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Roaming</span>
                <span className="detail-value text-success">
                  {line.roamingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base text-semibold mb-4">Data Usage</h2>
            <div className="mb-4">
              <div className="row-between mb-1">
                <span className="text-sm text-secondary">Data Used</span>
                <span className="text-sm text-semibold">
                  {(line.usage.dataUsedMb / 1024).toFixed(1)} GB / {(line.usage.dataLimitMb / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="progress-bar progress-bar-lg">
                <div
                  className={`progress-fill ${getProgressFill()}`}
                  style={{ width: `${Math.min(dataPercent, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <p className="text-sm text-secondary">Voice</p>
                <p className="text-base text-semibold">{line.usage.voiceMinutesUsed} min</p>
              </div>
              <div>
                <p className="text-sm text-secondary">SMS</p>
                <p className="text-base text-semibold">{line.usage.smsUsed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sim' && (
        <div className="card">
          <h2 className="text-base text-semibold mb-4">SIM Card Information</h2>
          <div className="detail-list" style={{ gap: '16px' }}>
            <div className="detail-row">
              <span className="detail-label">SIM Number</span>
              <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{line.simNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <SIMStatusBadge status={line.status} />
            </div>
            <div className="detail-row">
              <span className="detail-label">Type</span>
              <span className="detail-value">Physical SIM</span>
            </div>
          </div>

          {line.status === 'ACTIVE' && (
            <div className="mt-6" style={{ paddingTop: '24px', borderTop: '1px solid var(--premium-border)' }}>
              <h3 className="text-sm text-semibold mb-3">Danger Zone</h3>
              <p className="text-sm text-secondary mb-3">
                Blocking this SIM will immediately disconnect all services on this line.
              </p>
              <button className="btn-danger" onClick={() => setShowBlockDialog(true)}>
                Block SIM
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'esim' && (
        <div className="card">
          <h2 className="text-base text-semibold mb-4">eSIM Management</h2>

          <div className="row mb-6" style={{ gap: '16px' }}>
            <div className={`p-3 rounded-full ${(line.esimStatus as EsimStatus) === 'INSTALLED' ? 'bg-success-light' : 'bg-muted'}`}>
              <QrCodeIcon style={{ width: 24, height: 24, color: (line.esimStatus as EsimStatus) === 'INSTALLED' ? 'var(--premium-success)' : 'var(--premium-text-muted)' }} />
            </div>
            <div>
              <p className="text-base text-semibold">Status: {esimStatusLabels[line.esimStatus as EsimStatus]}</p>
              <p className="text-sm text-secondary">
                {(line.esimStatus as EsimStatus) === 'INSTALLED' && 'Your eSIM is active and ready to use'}
                {(line.esimStatus as EsimStatus) === 'AVAILABLE' && 'You can install an eSIM on this device'}
                {(line.esimStatus as EsimStatus) === 'NOT_SUPPORTED' && 'This device does not support eSIM'}
              </p>
            </div>
          </div>

          {(line.esimStatus as EsimStatus) === 'INSTALLED' && (
            <div className="stack" style={{ gap: '12px' }}>
              <button className="btn-secondary w-full">Reinstall eSIM</button>
              <button className="btn-danger w-full" style={{ background: 'transparent', color: 'var(--premium-error)', border: '1px solid var(--premium-error)' }}>
                Remove eSIM
              </button>
            </div>
          )}

          {(line.esimStatus as EsimStatus) === 'AVAILABLE' && (
            <button className="btn-primary w-full">Install eSIM</button>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="card">
          <h2 className="text-base text-semibold mb-4">Current Billing Cycle Usage</h2>
          <div className="stack-gap">
            <div>
              <div className="row-between mb-2">
                <span className="text-sm text-secondary">Data</span>
                <span className="text-sm text-semibold">
                  {(line.usage.dataUsedMb / 1024).toFixed(2)} GB / {(line.usage.dataLimitMb / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="progress-bar progress-bar-lg">
                <div
                  className="progress-fill progress-fill-blue"
                  style={{ width: `${dataPercent}%` }}
                />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="card" style={{ textAlign: 'center', background: 'var(--premium-bg)' }}>
                <p className="text-2xl text-bold">{line.usage.voiceMinutesUsed}</p>
                <p className="text-sm text-secondary">Voice Minutes</p>
              </div>
              <div className="card" style={{ textAlign: 'center', background: 'var(--premium-bg)' }}>
                <p className="text-2xl text-bold">{line.usage.smsUsed}</p>
                <p className="text-sm text-secondary">SMS Messages</p>
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
        <p className="text-sm text-secondary">
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
        <p className="text-sm text-secondary">
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
        <div className="stack" style={{ gap: '16px' }}>
          <div>
            <label className="form-label">Nickname</label>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="e.g., Personal, Work"
              className="form-input"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
