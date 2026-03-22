import { useState, useEffect, useCallback } from 'react';
import { TravelRecommendation, RoamingUsage, SpendCap, EmergencyTopupResult } from './types';

const API_BASE = '/api/v1/customer/travel';

export function useTravelRecommendations() {
  const [recommendations, setRecommendations] = useState<TravelRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (destination?: string, lineId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (destination) params.append('destination', destination);
      if (lineId) params.append('lineId', lineId);
      
      const res = await fetch(`${API_BASE}/recommendations?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setRecommendations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const purchasePack = async (packId: string) => {
    // This would integrate with the roaming purchase flow
    console.log('Purchase pack:', packId);
  };

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
    purchasePack,
  };
}

export function useInTripControls(lineId?: string) {
  const [usages, setUsages] = useState<RoamingUsage[]>([]);
  const [spendCap, setSpendCap] = useState<SpendCap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = lineId ? `?lineId=${lineId}` : '';
      const res = await fetch(`${API_BASE}/usage${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setUsages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [lineId]);

  const fetchSpendCap = useCallback(async () => {
    try {
      const params = lineId ? `?lineId=${lineId}` : '';
      const res = await fetch(`${API_BASE}/spend-cap${params}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setSpendCap(data);
    } catch {
      // Ignore
    }
  }, [lineId]);

  useEffect(() => {
    fetchUsages();
    fetchSpendCap();
  }, [fetchUsages, fetchSpendCap]);

  const updateSpendCap = async (limit: number, alertTriggers: string[]) => {
    const res = await fetch(`${API_BASE}/spend-cap${lineId ? `?lineId=${lineId}` : ''}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ limit, alertTriggers }),
    });
    if (res.ok) {
      setSpendCap(await res.json());
    }
  };

  const purchaseEmergencyTopup = async (amount: number): Promise<EmergencyTopupResult | null> => {
    try {
      const res = await fetch(`${API_BASE}/emergency-topup${lineId ? `?lineId=${lineId}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  return {
    usages,
    spendCap,
    loading,
    error,
    refetch: fetchUsages,
    updateSpendCap,
    purchaseEmergencyTopup,
  };
}
