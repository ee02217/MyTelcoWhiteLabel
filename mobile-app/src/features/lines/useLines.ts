import { useState, useEffect, useCallback } from 'react';
import { Line, LineDetails, ProrationPreview } from './types';

const API_BASE = '/api/v1/customer/lines';

export function useLines(authedFetch: (path: string, init?: RequestInit) => Promise<Response>) {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authedFetch(API_BASE);
      setLines(res.ok ? await res.json() : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  const getLineDetails = async (lineId: string): Promise<LineDetails | null> => {
    try {
      const res = await authedFetch(`${API_BASE}/${lineId}/details`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  const addLine = async (data: {
    phoneNumber?: string;
    planId?: string;
    simType?: string;
    deliveryAddress?: string;
  }) => {
    try {
      setSaving(true);
      const res = await authedFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add line');
      const line = await res.json();
      setLines(prev => [...prev, line]);
      return line;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cancelLine = async (lineId: string, keepNumber: boolean, reason?: string) => {
    try {
      setSaving(true);
      const res = await authedFetch(`${API_BASE}/${lineId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, keepNumber, feedback: '' }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      await fetchLines();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getProrationPreview = async (lineId: string, newPlanId: string): Promise<ProrationPreview | null> => {
    try {
      const res = await authedFetch(`${API_BASE}/${lineId}/proration?newPlanId=${newPlanId}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  const changePlan = async (lineId: string, planId: string) => {
    try {
      setSaving(true);
      const res = await authedFetch(`${API_BASE}/${lineId}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error('Failed to change plan');
      await fetchLines();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startPorting = async (lineId: string, data: { phoneNumber: string; donorOperator: string; accountNumber: string }) => {
    try {
      const res = await authedFetch(`${API_BASE}/${lineId}/porting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  const verifyPortingOtp = async (lineId: string, otp: string): Promise<boolean> => {
    try {
      const res = await authedFetch(`${API_BASE}/${lineId}/porting/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.verified;
    } catch {
      return false;
    }
  };

  return {
    lines,
    loading,
    saving,
    error,
    refetch: fetchLines,
    getLineDetails,
    addLine,
    cancelLine,
    getProrationPreview,
    changePlan,
    startPorting,
    verifyPortingOtp,
  };
}
