import { useState, useEffect, useCallback } from 'react';
import { CustomerProfile, NotificationPreferences, AccountSession } from './types';

const API_BASE = '/api/v1/customer/profile';

export function useProfile(authedFetch: (path: string, init?: RequestInit) => Promise<Response>) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authedFetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      setProfile(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<CustomerProfile>) => {
    try {
      setSaving(true);
      setError(null);
      const res = await authedFetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
      const updated = await res.json();
      setProfile(updated);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationPrefs = async (prefs: NotificationPreferences) => {
    try {
      setSaving(true);
      setError(null);
      const res = await authedFetch(`${API_BASE}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
      const updated = await res.json();
      setProfile(prev => prev ? { ...prev, notificationPrefs: updated } : null);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setError(null);
      const res = await authedFetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to revoke: ${res.status}`);
      await fetchProfile();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
      return false;
    }
  };

  const exportData = async (): Promise<Record<string, string> | null> => {
    try {
      const res = await authedFetch(`${API_BASE}/export`);
      if (!res.ok) throw new Error(`Failed to export: ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const res = await authedFetch(API_BASE, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    refetch: fetchProfile,
    updateProfile,
    updateNotificationPrefs,
    revokeSession,
    exportData,
    deleteAccount,
  };
}
