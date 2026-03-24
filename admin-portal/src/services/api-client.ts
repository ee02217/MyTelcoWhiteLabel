import { readSession } from '../auth-oidc';
import type {
  ContentLocaleResponse,
  ContentVersionResponse,
  OfferDetailResponse,
  OfferVersionResponse,
  OperatorAuditEntry,
  OperatorProfileResponse,
  OperatorSummaryResponse,
  OperatorUserResponse,
  ContentSummaryResponse,
  OfferSummaryResponse,
} from '../types';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const authedFetch = async (path: string, init: RequestInit = {}) => {
  const current = readSession();
  if (!current && !DEV_MODE) throw new Error('No active admin session. Please login.');

  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: DEV_MODE ? '' : `Bearer ${current?.accessToken}`,
      ...(DEV_MODE ? { 'X-Dev-Auth': 'dev-mode-token' } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status} ${msg || response.statusText}`.trim());
  }

  return response;
};

export const fetchOperators = async (): Promise<OperatorSummaryResponse[]> => {
  const response = await authedFetch('/api/v1/admin/operators');
  return (await response.json()) as OperatorSummaryResponse[];
};

export type OperatorDetails = {
  profile: OperatorProfileResponse;
  users: OperatorUserResponse[];
  audit: OperatorAuditEntry[];
  contentItems: ContentSummaryResponse[];
  offers: OfferSummaryResponse[];
};

export const fetchOperatorDetails = async (operatorId: string): Promise<OperatorDetails> => {
  const [profileResp, usersResp, auditResp, contentResp, offersResp] = await Promise.all([
    authedFetch(`/api/v1/admin/operators/${operatorId}/profile`),
    authedFetch(`/api/v1/admin/operators/${operatorId}/users`),
    authedFetch(`/api/v1/admin/operators/${operatorId}/audit?limit=30`),
    authedFetch(`/api/v1/admin/operators/${operatorId}/content`),
    authedFetch(`/api/v1/admin/operators/${operatorId}/offers`),
  ]);

  return {
    profile: (await profileResp.json()) as OperatorProfileResponse,
    users: (await usersResp.json()) as OperatorUserResponse[],
    audit: (await auditResp.json()) as OperatorAuditEntry[],
    contentItems: (await contentResp.json()) as ContentSummaryResponse[],
    offers: (await offersResp.json()) as OfferSummaryResponse[],
  };
};

export const patchProfile = async (
  operatorId: string,
  payload: { name: string; locales: string[]; featuresByChannel: Record<string, Record<string, boolean>> }
): Promise<{ profile: OperatorProfileResponse; version: number }> => {
  const response = await authedFetch(`/api/v1/admin/operators/${operatorId}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as { profile: OperatorProfileResponse; version: number };
};

export const patchUserRoles = async (
  operatorId: string,
  userId: string,
  payload: { roles: string[]; enabled: boolean }
): Promise<OperatorUserResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/users/${userId}/roles`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return (await response.json()) as OperatorUserResponse;
};

export const fetchContentDetail = async (
  operatorId: string,
  contentId: string,
  locale: string
): Promise<ContentLocaleResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/content/${contentId}?locale=${encodeURIComponent(locale)}`
  );
  return (await response.json()) as ContentLocaleResponse;
};

export const patchContent = async (
  operatorId: string,
  contentId: string,
  payload: {
    locale: string;
    title: string;
    body: string;
    notes: string | null;
    state: string;
    reviewer: string | null;
  }
): Promise<ContentVersionResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/content/${contentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return (await response.json()) as ContentVersionResponse;
};

export const postContentRollback = async (
  operatorId: string,
  contentId: string,
  payload: { locale: string; version: number | null }
): Promise<ContentVersionResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/content/${contentId}/rollback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return (await response.json()) as ContentVersionResponse;
};

export const fetchOfferDetail = async (
  operatorId: string,
  offerId: string
): Promise<OfferDetailResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/offers/${offerId}`
  );
  return (await response.json()) as OfferDetailResponse;
};

export const patchOffer = async (
  operatorId: string,
  offerId: string,
  payload: {
    name: string;
    description: string;
    eligibilityRules: Record<string, unknown>;
    visibleChannels: string[];
    state: string;
    notes: string | null;
    reviewer: string | null;
  }
): Promise<OfferVersionResponse> => {
  const response = await authedFetch(
    `/api/v1/admin/operators/${operatorId}/offers/${offerId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return (await response.json()) as OfferVersionResponse;
};

export const isDevMode = () => DEV_MODE;

export const useMockData = () => import.meta.env.VITE_USE_MOCK_DATA === 'true';

// --- Analytics API ---

export const fetchAnalyticsOverview = async () => {
  const response = await authedFetch('/api/v1/admin/analytics/overview');
  return response.json();
};

export const fetchAnalyticsRevenue = async (days: number) => {
  const response = await authedFetch(`/api/v1/admin/analytics/revenue?days=${days}`);
  return response.json();
};

export const fetchAnalyticsUsers = async (days: number) => {
  const response = await authedFetch(`/api/v1/admin/analytics/users?days=${days}`);
  return response.json();
};

export const fetchAnalyticsUsage = async () => {
  const response = await authedFetch('/api/v1/admin/analytics/usage');
  return response.json();
};

// --- Users API ---

export const fetchUsers = async (params?: { search?: string; page?: number; size?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.size != null) query.set('size', String(params.size));
  const qs = query.toString();
  const response = await authedFetch(`/api/v1/admin/users${qs ? '?' + qs : ''}`);
  return response.json();
};

export const inviteUser = async (payload: { email: string; role: string }) => {
  const response = await authedFetch('/api/v1/admin/users/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const bulkUpdateUsers = async (payload: { userIds: string[]; updates: Record<string, unknown> }) => {
  const response = await authedFetch('/api/v1/admin/users/bulk-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  const response = await authedFetch('/api/v1/admin/users/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds }),
  });
  return response.json();
};

// --- Journeys API ---

export const fetchJourneys = async (status?: string) => {
  const qs = status ? `?status=${status}` : '';
  const response = await authedFetch(`/api/v1/admin/journeys${qs}`);
  return response.json();
};

export const createJourney = async (payload: { name: string; description: string; trigger: string }) => {
  const response = await authedFetch('/api/v1/admin/journeys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const publishJourney = async (id: string) => {
  const response = await authedFetch(`/api/v1/admin/journeys/${id}/publish`, { method: 'POST' });
  return response.json();
};

export const deleteJourney = async (id: string) => {
  const response = await authedFetch(`/api/v1/admin/journeys/${id}`, { method: 'DELETE' });
  return response.json();
};

// --- Audit API ---

export const fetchAuditLogs = async (params?: {
  action?: string;
  user?: string;
  page?: number;
  size?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.user) query.set('user', params.user);
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.size != null) query.set('size', String(params.size));
  const qs = query.toString();
  const response = await authedFetch(`/api/v1/admin/audit${qs ? '?' + qs : ''}`);
  return response.json();
};

export const fetchAuditActionTypes = async (): Promise<string[]> => {
  const response = await authedFetch('/api/v1/admin/audit/actions');
  return response.json() as Promise<string[]>;
};
