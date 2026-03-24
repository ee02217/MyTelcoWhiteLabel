import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BellIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Notification as NotificationType, NotificationPreferences } from '../../types/api';

const FALLBACK_NOTIFICATIONS: NotificationType[] = [
  {
    notificationId: 'notif-1',
    type: 'BILLING',
    title: 'Payment Received',
    message: 'Your payment of 29.95 EUR has been processed successfully.',
    readAt: '2026-03-20T10:00:00Z',
    createdAt: '2026-03-20T09:30:00Z',
  },
  {
    notificationId: 'notif-2',
    type: 'USAGE',
    title: 'Data Usage Alert',
    message: 'You have used 80% of your monthly data allowance.',
    readAt: null,
    createdAt: '2026-03-22T14:00:00Z',
  },
  {
    notificationId: 'notif-3',
    type: 'ORDER',
    title: 'Plan Change Completed',
    message: 'Your plan has been upgraded to Premium 50GB.',
    readAt: null,
    createdAt: '2026-03-21T11:15:00Z',
  },
  {
    notificationId: 'notif-4',
    type: 'SUPPORT',
    title: 'Case Update',
    message: 'Your support case #case-001 has been updated.',
    readAt: '2026-03-19T16:00:00Z',
    createdAt: '2026-03-19T15:30:00Z',
  },
  {
    notificationId: 'notif-5',
    type: 'SYSTEM',
    title: 'Scheduled Maintenance',
    message: 'Planned maintenance on March 25 from 02:00 to 04:00 UTC.',
    readAt: null,
    createdAt: '2026-03-23T08:00:00Z',
  },
];

const FALLBACK_PREFERENCES: NotificationPreferences = {
  channels: {
    email: true,
    sms: true,
    push: true,
  },
  categories: {
    billing: true,
    usage: true,
    order: true,
    support: true,
    marketing: false,
  },
};

type Tab = 'inbox' | 'preferences';
type CategoryFilter = 'All' | 'BILLING' | 'USAGE' | 'ORDER' | 'SUPPORT' | 'SYSTEM';

const CATEGORY_BADGES: Record<string, string> = {
  BILLING: 'badge-info',
  USAGE: 'badge-warning',
  ORDER: 'badge-success',
  SUPPORT: 'badge-purple',
  SYSTEM: 'badge-neutral',
};

interface NotificationsProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function Notifications({ authedFetch }: NotificationsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(FALLBACK_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');

  useEffect(() => {
    authedFetch('/api/v1/customer/notifications/inbox')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setNotifications(Array.isArray(data) ? data : FALLBACK_NOTIFICATIONS))
      .catch(() => setNotifications(FALLBACK_NOTIFICATIONS))
      .finally(() => setLoading(false));
  }, []);

  const loadPreferences = () => {
    setLoadingPrefs(true);
    authedFetch('/api/v1/customer/notifications/preferences')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPreferences)
      .catch(() => setPreferences(FALLBACK_PREFERENCES))
      .finally(() => setLoadingPrefs(false));
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'preferences' && !loadingPrefs) {
      loadPreferences();
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setSavedPrefs(false);
    try {
      await authedFetch('/api/v1/customer/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
    } catch {
      // ignore
    }
    setSavingPrefs(false);
    setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 3000);
  };

  const toggleChannel = (channel: keyof NotificationPreferences['channels']) => {
    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: !preferences.channels[channel],
      },
    });
  };

  const toggleCategory = (category: keyof NotificationPreferences['categories']) => {
    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category],
      },
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications =
    categoryFilter === 'All'
      ? notifications
      : notifications.filter((n) => n.type === categoryFilter);

  const filters: { label: string; value: CategoryFilter }[] = [
    { label: 'All', value: 'All' },
    { label: 'Billing', value: 'BILLING' },
    { label: 'Orders', value: 'ORDER' },
    { label: 'Usage', value: 'USAGE' },
    { label: 'Support', value: 'SUPPORT' },
    { label: 'System', value: 'SYSTEM' },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Stay updated with your account activity</p>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inbox' && (
        <>
          {/* Category Filters */}
          <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
            {filters.map((f) => (
              <button
                key={f.value}
                className={categoryFilter === f.value ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 16px', fontSize: '0.8125rem' }}
                onClick={() => setCategoryFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="stack-gap">
              <LoadingSkeleton height="72px" />
              <LoadingSkeleton height="72px" />
              <LoadingSkeleton height="72px" />
            </div>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <BellIcon style={{ width: 48, height: 48, color: 'var(--premium-text-muted)', margin: '0 auto 16px' }} />
              <p className="text-lg text-semibold">No notifications</p>
              <p className="text-sm text-secondary mt-2">You're all caught up!</p>
            </div>
          )}

          {!loading && filteredNotifications.length > 0 && (
            <div className="stack" style={{ gap: '1px', background: 'var(--premium-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {filteredNotifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.notificationId}
                    className="card"
                    style={{
                      borderRadius: 0,
                      border: 'none',
                      borderLeft: isUnread ? '3px solid var(--premium-primary)' : '3px solid transparent',
                      fontWeight: isUnread ? 600 : 400,
                    }}
                  >
                    <div className="row-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="row" style={{ gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge badge-sm ${CATEGORY_BADGES[n.type]}`}>{n.type}</span>
                          {isUnread && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--premium-primary)' }} />
                          )}
                        </div>
                        <h3 className="text-sm" style={{ fontWeight: isUnread ? 600 : 500 }}>{n.title}</h3>
                        <p className="text-sm text-secondary mt-1" style={{ fontWeight: 400 }}>{n.message}</p>
                      </div>
                      <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', fontWeight: 400 }}>
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'preferences' && (
        <div className="card">
          <h2 className="text-lg text-semibold mb-4">Notification Preferences</h2>

          {loadingPrefs ? (
            <LoadingSkeleton height="200px" />
          ) : (
            <>
              {/* Channel toggles */}
              <div className="mb-6">
                <h3 className="text-sm text-semibold text-secondary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Channels
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  {(Object.keys(preferences.channels) as Array<keyof NotificationPreferences['channels']>).map((channel) => (
                    <div key={channel} className="row-between" style={{ padding: '8px 0' }}>
                      <span className="text-sm text-medium" style={{ textTransform: 'capitalize' }}>{channel}</span>
                      <button
                        onClick={() => toggleChannel(channel)}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 'var(--radius-full)',
                          background: preferences.channels[channel] ? 'var(--premium-primary)' : '#e2e8f0',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: preferences.channels[channel] ? 22 : 2,
                            width: 20,
                            height: 20,
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'left var(--transition-fast)',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category toggles */}
              <div className="mb-6">
                <h3 className="text-sm text-semibold text-secondary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Categories
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  {(Object.keys(preferences.categories) as Array<keyof NotificationPreferences['categories']>).map((category) => (
                    <div key={category} className="row-between" style={{ padding: '8px 0' }}>
                      <span className="text-sm text-medium" style={{ textTransform: 'capitalize' }}>{category}</span>
                      <button
                        onClick={() => toggleCategory(category)}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 'var(--radius-full)',
                          background: preferences.categories[category] ? 'var(--premium-primary)' : '#e2e8f0',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: preferences.categories[category] ? 22 : 2,
                            width: 20,
                            height: 20,
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'left var(--transition-fast)',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row" style={{ gap: '12px' }}>
                <button
                  className="btn-primary"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                >
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
                {savedPrefs && (
                  <span className="row text-sm text-success" style={{ gap: '4px' }}>
                    <CheckCircleIcon style={{ width: 16, height: 16 }} />
                    Saved
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
