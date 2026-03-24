import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  UserCircleIcon,
  BellAlertIcon,
  SwatchIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface AlertThresholds {
  dataPercent: number;
  voicePercent: number;
  smsPercent: number;
}

const FALLBACK_THRESHOLDS: AlertThresholds = {
  dataPercent: 80,
  voicePercent: 80,
  smsPercent: 80,
};

interface SettingsProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onLogout: () => void;
  userName: string;
}

export function Settings({ authedFetch, onLogout, userName }: SettingsProps) {
  const [thresholds, setThresholds] = useState<AlertThresholds>(FALLBACK_THRESHOLDS);
  const [loadingThresholds, setLoadingThresholds] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [savedThresholds, setSavedThresholds] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    authedFetch('/api/v1/customer/alerts/thresholds')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setThresholds)
      .catch(() => setThresholds(FALLBACK_THRESHOLDS))
      .finally(() => setLoadingThresholds(false));

    // Read current theme preference
    const stored = document.documentElement.getAttribute('data-theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    }
  }, []);

  const handleSaveThresholds = async () => {
    setSavingThresholds(true);
    setSavedThresholds(false);
    try {
      await authedFetch('/api/v1/customer/alerts/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });
    } catch {
      // ignore
    }
    setSavingThresholds(false);
    setSavedThresholds(true);
    setTimeout(() => setSavedThresholds(false), 3000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="row mb-4" style={{ gap: '12px' }}>
          <UserCircleIcon style={{ width: 24, height: 24, color: 'var(--premium-primary)' }} />
          <h2 className="text-lg text-semibold">Account Information</h2>
        </div>
        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value">{userName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">customer@mytelco.pt</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span className="detail-value">+351 912 345 678</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Account Type</span>
            <span className="badge badge-info">Customer</span>
          </div>
        </div>
      </div>

      {/* Usage Alerts */}
      <div className="card">
        <div className="row mb-4" style={{ gap: '12px' }}>
          <BellAlertIcon style={{ width: 24, height: 24, color: 'var(--premium-warning)' }} />
          <h2 className="text-lg text-semibold">Usage Alerts</h2>
        </div>
        <p className="text-sm text-secondary mb-4">
          Set thresholds to receive alerts when usage approaches your plan limits.
        </p>

        {loadingThresholds ? (
          <LoadingSkeleton height="120px" />
        ) : (
          <div className="stack" style={{ gap: '20px' }}>
            <div>
              <div className="row-between mb-2">
                <label className="text-sm text-medium">Data Alert Threshold</label>
                <span className="text-sm text-semibold text-primary">{thresholds.dataPercent}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={thresholds.dataPercent}
                onChange={(e) => setThresholds({ ...thresholds, dataPercent: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--premium-primary)' }}
              />
              <div className="row-between">
                <span className="text-xs text-muted">50%</span>
                <span className="text-xs text-muted">95%</span>
              </div>
            </div>

            <div>
              <div className="row-between mb-2">
                <label className="text-sm text-medium">Voice Alert Threshold</label>
                <span className="text-sm text-semibold text-primary">{thresholds.voicePercent}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={thresholds.voicePercent}
                onChange={(e) => setThresholds({ ...thresholds, voicePercent: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--premium-primary)' }}
              />
              <div className="row-between">
                <span className="text-xs text-muted">50%</span>
                <span className="text-xs text-muted">95%</span>
              </div>
            </div>

            <div>
              <div className="row-between mb-2">
                <label className="text-sm text-medium">SMS Alert Threshold</label>
                <span className="text-sm text-semibold text-primary">{thresholds.smsPercent}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={thresholds.smsPercent}
                onChange={(e) => setThresholds({ ...thresholds, smsPercent: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--premium-primary)' }}
              />
              <div className="row-between">
                <span className="text-xs text-muted">50%</span>
                <span className="text-xs text-muted">95%</span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px' }}>
              <button
                className="btn-primary"
                onClick={handleSaveThresholds}
                disabled={savingThresholds}
              >
                {savingThresholds ? 'Saving...' : 'Save Thresholds'}
              </button>
              {savedThresholds && (
                <span className="row text-sm text-success" style={{ gap: '4px' }}>
                  <CheckCircleIcon style={{ width: 16, height: 16 }} />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="row mb-4" style={{ gap: '12px' }}>
          <SwatchIcon style={{ width: 24, height: 24, color: 'var(--premium-accent)' }} />
          <h2 className="text-lg text-semibold">Appearance</h2>
        </div>
        <p className="text-sm text-secondary mb-4">Choose your preferred theme.</p>
        <div className="row" style={{ gap: '8px' }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              className={theme === t ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleThemeChange(t)}
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div>
        <button
          className="btn-danger"
          onClick={onLogout}
          style={{ gap: '8px' }}
        >
          <ArrowRightStartOnRectangleIcon style={{ width: 20, height: 20 }} />
          Logout
        </button>
      </div>
    </div>
  );
}
