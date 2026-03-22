import { useState, useEffect, useCallback } from 'react';
import {
  SharedControlsResponse,
  SharedControlCapUpdateRequest,
  SharedControlOverrideCreateRequest,
  SharedControlOverrideDecisionRequest,
} from './types';

const API_BASE = '/api/v1/customer/family/controls';

export function useSharedControls() {
  const [controls, setControls] = useState<SharedControlsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch controls: ${res.status}`);
      const data = await res.json();
      setControls(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const updateCap = async (request: SharedControlCapUpdateRequest) => {
    const res = await fetch(`${API_BASE}/caps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to update cap: ${res.status}`);
    await fetchControls();
  };

  const createOverrideRequest = async (request: SharedControlOverrideCreateRequest) => {
    const res = await fetch(`${API_BASE}/overrides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to create override: ${res.status}`);
    await fetchControls();
  };

  const decideOverride = async (request: SharedControlOverrideDecisionRequest) => {
    const res = await fetch(`${API_BASE}/overrides/${request.requestId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to decide override: ${res.status}`);
    await fetchControls();
  };

  return {
    controls,
    loading,
    error,
    refetch: fetchControls,
    updateCap,
    createOverrideRequest,
    decideOverride,
  };
}
