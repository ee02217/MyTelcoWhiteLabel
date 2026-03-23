import { useQuery } from '@tanstack/react-query';
import type { CustomerUsageResponse } from '../types/usage';

interface UseUsageDataOptions {
  view?: 'daily' | 'billing-cycle';
  lineId?: string;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

async function fetchUsageData(
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>,
  view: string,
  lineId?: string
): Promise<CustomerUsageResponse> {
  const params = new URLSearchParams({ view });
  if (lineId) {
    params.append('lineId', lineId);
  }
  
  const response = await authedFetch(`/api/v1/customer/usage?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch usage data: ${response.status}`);
  }
  
  return response.json();
}

export function useUsageData({ view = 'billing-cycle', lineId, authedFetch }: UseUsageDataOptions) {
  return useQuery({
    queryKey: ['usage', view, lineId],
    queryFn: () => fetchUsageData(authedFetch, view, lineId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    enabled: !!authedFetch,
  });
}
