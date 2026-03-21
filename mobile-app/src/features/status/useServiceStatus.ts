import { useState, useEffect, useCallback } from 'react';
import { RegionStatus, Incident, IncidentUpdate, IncidentNotificationPreference } from './types';

const API_BASE = '/api/v1/customer/status';

export function useServiceStatus() {
  const [regions, setRegions] = useState<RegionStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [health, setHealth] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [regionsRes, incidentsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/regions`, { credentials: 'include' }),
        fetch(`${API_BASE}/incidents`, { credentials: 'include' }),
        fetch(`${API_BASE}/health`, { credentials: 'include' }),
      ]);

      if (!regionsRes.ok || !incidentsRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch status');
      }

      const [regionsData, incidentsData, healthData] = await Promise.all([
        regionsRes.json(),
        incidentsRes.json(),
        healthRes.json(),
      ]);

      setRegions(regionsData);
      setIncidents(incidentsData);
      setHealth(healthData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getIncidentTimeline = async (incidentId: string): Promise<IncidentUpdate[]> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/timeline`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  };

  return {
    regions,
    incidents,
    health,
    loading,
    error,
    refetch: fetchAll,
    getIncidentTimeline,
  };
}

export function useIncidentNotifications() {
  const [preferences, setPreferences] = useState<IncidentNotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPreferences = useCallback(async (customerId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/preferences`, {
        credentials: 'include',
        headers: { 'X-Customer-ID': customerId },
      });
      if (res.ok) {
        setPreferences(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createPreference = async (pref: {
    lineId: string;
    regionCode: string;
    serviceType: string;
    notifyOnStart: boolean;
    notifyOnUpdate: boolean;
    notifyOnResolved: boolean;
  }) => {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pref),
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  };

  const deletePreference = async (preferenceId: string) => {
    const res = await fetch(`${API_BASE}/notifications/preferences/${preferenceId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  };

  return {
    preferences,
    loading,
    fetchPreferences,
    createPreference,
    deletePreference,
  };
}
