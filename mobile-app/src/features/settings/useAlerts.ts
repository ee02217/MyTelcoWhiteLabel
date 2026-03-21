import { useState, useEffect, useCallback } from 'react';

export type AlertThresholdConfig = {
  customerId: string;
  thresholds: number[];
  updatedAt: string;
};

const API_BASE = '/api/v1/customer/alerts';

export function useAlertThresholds(authedFetch: (path: string, init?: RequestInit) => Promise<Response>) {
  const [config, setConfig] = useState<AlertThresholdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authedFetch(`${API_BASE}/thresholds`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setConfig(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateThresholds = async (thresholds: number[]) => {
    try {
      setSaving(true);
      setError(null);
      const res = await authedFetch(`${API_BASE}/thresholds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const updated = await res.json();
      setConfig(updated);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    error,
    refetch: fetchConfig,
    updateThresholds,
  };
}

export function usePushConsent() {
  const [consent, setConsent] = useState<{
    granted: boolean;
    asked: boolean;
  }>(() => {
    const saved = localStorage.getItem('push_consent');
    return saved ? JSON.parse(saved) : { granted: false, asked: false };
  });

  const requestConsent = useCallback(async (): Promise<boolean> => {
    // In a real app, this would use expo-notifications or react-native-push-notification
    // For now, simulate the permission request
    try {
      // Simulate requesting push permission
      const granted = true; // In production: await Notifications.requestPermissionsAsync()
      const newConsent = { granted, asked: true };
      setConsent(newConsent);
      localStorage.setItem('push_consent', JSON.stringify(newConsent));
      return granted;
    } catch {
      return false;
    }
  }, []);

  const revokeConsent = useCallback(() => {
    const newConsent = { granted: false, asked: true };
    setConsent(newConsent);
    localStorage.setItem('push_consent', JSON.stringify(newConsent));
  }, []);

  return {
    ...consent,
    requestConsent,
    revokeConsent,
  };
}
