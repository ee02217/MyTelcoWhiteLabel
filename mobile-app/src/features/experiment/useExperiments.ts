import { useState, useEffect, useCallback } from 'react';
import { Experiment, ExperimentAssignment } from './types';

const API_BASE = '/api/v1/customer/experiments';

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [assignments, setAssignments] = useState<ExperimentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE, { credentials: 'include' });
      if (res.ok) {
        setExperiments(await res.json());
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/assignment`, { credentials: 'include' });
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
    fetchAssignments();
  }, [fetchExperiments, fetchAssignments]);

  const getVariant = useCallback((experimentId: string): string | null => {
    const assignment = assignments.find(a => a.experimentId === experimentId);
    return assignment?.variant || null;
  }, [assignments]);

  const getConfig = useCallback((experimentId: string): Record<string, unknown> | null => {
    const assignment = assignments.find(a => a.experimentId === experimentId);
    return assignment?.config || null;
  }, [assignments]);

  const isFeatureEnabled = useCallback(async (featureFlag: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/feature/${featureFlag}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return data.enabled;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const recordExposure = useCallback(async (experimentId: string, variant: string) => {
    try {
      await fetch(`${API_BASE}/${experimentId}/exposure?variant=${variant}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore
    }
  }, []);

  return {
    experiments,
    assignments,
    loading,
    getVariant,
    getConfig,
    isFeatureEnabled,
    recordExposure,
    refetch: fetchAssignments,
  };
}
