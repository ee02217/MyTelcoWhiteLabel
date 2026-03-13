import { useState } from 'react';
import { Button, Card, Typography } from '../../design-system';

type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
type NotificationCategory = 'BILLING' | 'ORDERS' | 'SECURITY' | 'MARKETING' | 'SERVICE';

type NotificationChannelDelivery = {
  channel: NotificationChannel;
  status: NotificationStatus;
  updatedAt: string;
};

type NotificationInboxItem = {
  notificationId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  deliveries: NotificationChannelDelivery[];
  createdAt: string;
  readAt: string | null;
};

type NotificationChannelPreference = { channel: NotificationChannel; enabled: boolean };
type NotificationCategoryPreference = {
  category: NotificationCategory;
  channels: NotificationChannelPreference[];
};
type NotificationPreferencesResponse = {
  customerId: string;
  categories: NotificationCategoryPreference[];
};

export function NotificationCenterPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [inbox, setInbox] = useState<NotificationInboxItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationCategoryPreference[]>([]);
  const [status, setStatus] = useState('Notification center idle');

  const loadInbox = async () => {
    const response = await authedFetch('/api/v1/customer/notifications/inbox');
    setInbox((await response.json()) as NotificationInboxItem[]);
    setStatus('Inbox loaded');
  };

  const loadPreferences = async () => {
    const response = await authedFetch('/api/v1/customer/notifications/preferences');
    const payload = (await response.json()) as NotificationPreferencesResponse;
    setPreferences(payload.categories);
    setStatus('Preferences loaded');
  };

  const togglePreference = async (category: NotificationCategory, channel: NotificationChannel) => {
    const next = preferences.map((item) =>
      item.category !== category
        ? item
        : {
            ...item,
            channels: item.channels.map((entry) =>
              entry.channel === channel ? { ...entry, enabled: !entry.enabled } : entry
            ),
          }
    );

    setPreferences(next);
    const response = await authedFetch('/api/v1/customer/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: next.map((item) => ({
          category: item.category,
          channels: Object.fromEntries(
            item.channels.map((entry) => [entry.channel, entry.enabled])
          ),
        })),
      }),
    });
    const payload = (await response.json()) as NotificationPreferencesResponse;
    setPreferences(payload.categories);
    setStatus(`Preference updated for ${category}/${channel}`);
  };

  const sendTest = async () => {
    await authedFetch('/api/v1/customer/notifications/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Web portal test notification',
        message: 'Notification center MVP test send from web',
        category: 'SERVICE',
      }),
    });
    await loadInbox();
    setStatus('Test notification sent');
  };

  return (
    <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
      <Typography variant="h4">Notification center (Issue #42)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          onClick={() => loadInbox().catch(() => setStatus('Failed to load inbox'))}
        >
          Load inbox
        </Button>
        <Button
          size="sm"
          onClick={() => loadPreferences().catch(() => setStatus('Failed to load preferences'))}
        >
          Load preferences
        </Button>
        <Button size="sm" onClick={() => sendTest().catch(() => setStatus('Failed to send test'))}>
          Send test
        </Button>
      </div>

      {preferences.map((item) => (
        <div key={item.category} style={{ marginTop: 10 }}>
          <Typography variant="body">{item.category}</Typography>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {item.channels.map((entry) => (
              <Button
                key={`${item.category}-${entry.channel}`}
                size="sm"
                variant={entry.enabled ? 'primary' : 'outline'}
                onClick={() =>
                  togglePreference(item.category, entry.channel).catch(() =>
                    setStatus('Failed to update preference')
                  )
                }
              >
                {entry.channel}: {entry.enabled ? 'ON' : 'OFF'}
              </Button>
            ))}
          </div>
        </div>
      ))}

      {inbox.slice(0, 5).map((item) => (
        <div key={item.notificationId} style={{ marginTop: 10 }}>
          <Typography variant="body">
            {item.category} — {item.title}
          </Typography>
          <Typography variant="small" color="secondary">
            {item.message}
          </Typography>
          <Typography variant="small" color="secondary">
            {item.deliveries.map((d) => `${d.channel}:${d.status}`).join(' | ')}
          </Typography>
        </div>
      ))}
    </Card>
  );
}
