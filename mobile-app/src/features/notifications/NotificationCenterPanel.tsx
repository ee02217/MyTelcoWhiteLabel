import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Typography } from '../../design-system';

type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
type NotificationCategory = 'BILLING' | 'ORDERS' | 'SECURITY' | 'MARKETING' | 'SERVICE';

type NotificationChannelDelivery = { channel: NotificationChannel; status: string };
type NotificationInboxItem = {
  notificationId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  deliveries: NotificationChannelDelivery[];
};
type NotificationCategoryPreference = {
  category: NotificationCategory;
  channels: { channel: NotificationChannel; enabled: boolean }[];
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
    const payload = (await response.json()) as { categories: NotificationCategoryPreference[] };
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
    const payload = (await response.json()) as { categories: NotificationCategoryPreference[] };
    setPreferences(payload.categories);
    setStatus(`Preference updated for ${category}/${channel}`);
  };

  const sendTest = async () => {
    await authedFetch('/api/v1/customer/notifications/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Mobile test notification',
        message: 'Notification center MVP test send from mobile',
        category: 'SERVICE',
      }),
    });
    await loadInbox();
    setStatus('Test notification sent');
  };

  return (
    <Card padding="md" shadow="md">
      <Typography variant="h4">Notification center (Issue #42)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>

      <Button
        title="Load inbox"
        onPress={() => loadInbox().catch(() => setStatus('Load inbox failed'))}
      />
      <Button
        title="Load preferences"
        onPress={() => loadPreferences().catch(() => setStatus('Load preferences failed'))}
        style={{ marginTop: 8 }}
      />
      <Button
        title="Send test"
        onPress={() => sendTest().catch(() => setStatus('Send failed'))}
        style={{ marginTop: 8 }}
      />

      {preferences.map((item) => (
        <View key={item.category} style={{ marginTop: 10 }}>
          <Typography variant="body">{item.category}</Typography>
          {item.channels.map((entry) => (
            <Button
              key={`${item.category}-${entry.channel}`}
              title={`${entry.channel}: ${entry.enabled ? 'ON' : 'OFF'}`}
              variant={entry.enabled ? 'primary' : 'outline'}
              onPress={() =>
                togglePreference(item.category, entry.channel).catch(() =>
                  setStatus('Update preference failed')
                )
              }
              style={{ marginTop: 6 }}
            />
          ))}
        </View>
      ))}

      {inbox.slice(0, 5).map((item) => (
        <View key={item.notificationId} style={{ marginTop: 10 }}>
          <Typography variant="body">
            {item.category} — {item.title}
          </Typography>
          <Typography variant="small" color="secondary">
            {item.message}
          </Typography>
          <Typography variant="small" color="secondary">
            {item.deliveries.map((d) => `${d.channel}:${d.status}`).join(' | ')}
          </Typography>
        </View>
      ))}
    </Card>
  );
}
