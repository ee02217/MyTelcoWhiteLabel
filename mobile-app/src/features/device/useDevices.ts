import { useState, useEffect, useCallback } from 'react';
import { DeviceInfo, DeviceCompatibilityCheck, DiagnosticRunResponse, DiagnosticTestType } from './types';

const API_BASE = '/api/v1/customer/devices';

export function useDevices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch devices: ${res.status}`);
      const data = await res.json();
      setDevices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const checkCompatibility = async (lineId: string): Promise<DeviceCompatibilityCheck | null> => {
    try {
      const res = await fetch(`${API_BASE}/${lineId}/compatibility`, { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const unlinkDevice = async (lineId: string) => {
    const res = await fetch(`${API_BASE}/${lineId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to unlink: ${res.status}`);
    await fetchDevices();
  };

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    checkCompatibility,
    unlinkDevice,
  };
}

export function useDiagnostics() {
  const [results, setResults] = useState<DiagnosticRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async (lineId: string, testTypes?: DiagnosticTestType[]) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/customer/diagnostics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lineId, testTypes }),
      });
      if (!res.ok) throw new Error(`Failed to run diagnostics: ${res.status}`);
      const data = await res.json();
      setResults(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const escalate = async (lineId: string, summary: string) => {
    try {
      const res = await fetch(`/api/v1/customer/diagnostics/${lineId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ diagnosticSummary: summary }),
      });
      if (!res.ok) throw new Error(`Failed to escalate: ${res.status}`);
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    }
  };

  return {
    results,
    loading,
    error,
    runDiagnostics,
    escalate,
  };
}
