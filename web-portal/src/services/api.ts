// Typed API client for customer portal

import type {
  AccountOverview,
  ActiveLine,
  DashboardResponse,
  BillingSummary,
  PaymentMethod,
  PaymentHistoryResponse,
  Line,
  LineDetail,
  RoamingStatus,
  RoamingPack,
  SupportCase,
  SupportCaseDetail,
  CreateCaseRequest,
  Notification,
  NotificationPreferences,
  CatalogItem,
  CheckoutRequest,
  CheckoutResponse,
  Order,
  UsageDetails,
  SIMActionResult,
} from '../types/api';

const API_BASE = '/api/v1/customer';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Global auth fetch function - will be set by App
let authedFetch: ((path: string, init?: RequestInit) => Promise<Response>) | null = null;

export function setAuthFetch(fn: (path: string, init?: RequestInit) => Promise<Response>) {
  authedFetch = fn;
}

function getAuthFetch(): (path: string, init?: RequestInit) => Promise<Response> {
  if (!authedFetch) {
    throw new Error('API not initialized - call setAuthFetch first');
  }
  return authedFetch;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 404) {
    throw new NotFoundError();
  }
  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new ApiError(response.status, text);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// ============ Account API ============

export async function getAccountOverview(): Promise<AccountOverview> {
  const response = await getAuthFetch()(`${API_BASE}/account-overview`);
  return handleResponse<AccountOverview>(response);
}

export async function getActiveLines(): Promise<ActiveLine[]> {
  const response = await getAuthFetch()(`${API_BASE}/lines`);
  return handleResponse<ActiveLine[]>(response);
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await getAuthFetch()(`${API_BASE}/dashboard`);
  return handleResponse<DashboardResponse>(response);
}

// ============ Usage API ============

export async function getUsageDetails(): Promise<UsageDetails> {
  const response = await getAuthFetch()(`${API_BASE}/usage`);
  return handleResponse<UsageDetails>(response);
}

// ============ Billing API ============

export async function getBillingSummary(): Promise<BillingSummary> {
  const response = await getAuthFetch()(`${API_BASE}/billing/summary`);
  return handleResponse<BillingSummary>(response);
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await getAuthFetch()(`${API_BASE}/payment-methods`);
  return handleResponse<PaymentMethod[]>(response);
}

export async function getPaymentHistory(months = 12): Promise<PaymentHistoryResponse> {
  const response = await getAuthFetch()(`${API_BASE}/payment-history?months=${months}`);
  return handleResponse<PaymentHistoryResponse>(response);
}

export async function registerPaymentMethod(token: string): Promise<PaymentMethod> {
  const response = await getAuthFetch()(`${API_BASE}/payment-methods`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });
  return handleResponse<PaymentMethod>(response);
}

export async function checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await getAuthFetch()(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<CheckoutResponse>(response);
}

export async function downloadReceipt(paymentId: string): Promise<Blob> {
  const response = await getAuthFetch()(`${API_BASE}/payments/${paymentId}/receipt`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to download receipt');
  }
  return response.blob();
}

export async function retryFailedPayment(paymentId: string): Promise<CheckoutResponse> {
  const response = await getAuthFetch()(`${API_BASE}/payments/${paymentId}/retry`, {
    method: 'POST',
  });
  return handleResponse<CheckoutResponse>(response);
}

// ============ Lines API ============

export async function getLines(): Promise<Line[]> {
  const response = await getAuthFetch()(`${API_BASE}/lines`);
  return handleResponse<Line[]>(response);
}

export async function getLine(lineId: string): Promise<LineDetail> {
  const response = await getAuthFetch()(`${API_BASE}/lines/${lineId}`);
  return handleResponse<LineDetail>(response);
}

export async function updateLineNickname(lineId: string, nickname: string): Promise<Line> {
  const response = await getAuthFetch()(`${API_BASE}/lines/${lineId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ nickname }),
  });
  return handleResponse<Line>(response);
}

export async function performSIMAction(lineId: string, action: string, reason?: string): Promise<SIMActionResult> {
  const response = await getAuthFetch()(`${API_BASE}/lines/${lineId}/sim`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action, reason }),
  });
  return handleResponse<SIMActionResult>(response);
}

// ============ Roaming API ============

export async function getRoamingStatus(): Promise<RoamingStatus> {
  const response = await getAuthFetch()(`${API_BASE}/roaming/status`);
  return handleResponse<RoamingStatus>(response);
}

export async function getRoamingPacks(): Promise<RoamingPack[]> {
  const response = await getAuthFetch()(`${API_BASE}/roaming/packs`);
  return handleResponse<RoamingPack[]>(response);
}

export async function purchaseRoamingPack(packId: string): Promise<Order> {
  const response = await getAuthFetch()(`${API_BASE}/roaming/packs/${packId}/purchase`, {
    method: 'POST',
  });
  return handleResponse<Order>(response);
}

// ============ Support API ============

export async function getSupportCases(): Promise<SupportCase[]> {
  const response = await getAuthFetch()(`${API_BASE}/support/cases`);
  return handleResponse<SupportCase[]>(response);
}

export async function getSupportCase(caseId: string): Promise<SupportCaseDetail> {
  const response = await getAuthFetch()(`${API_BASE}/support/cases/${caseId}`);
  return handleResponse<SupportCaseDetail>(response);
}

export async function createSupportCase(request: CreateCaseRequest): Promise<SupportCase> {
  const response = await getAuthFetch()(`${API_BASE}/support/cases`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<SupportCase>(response);
}

export async function addTimelineMessage(caseId: string, message: string): Promise<void> {
  const response = await getAuthFetch()(`${API_BASE}/support/cases/${caseId}/timeline`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  return handleResponse<void>(response);
}

// ============ Notifications API ============

export async function getNotifications(): Promise<Notification[]> {
  const response = await getAuthFetch()(`${API_BASE}/notifications/inbox`);
  return handleResponse<Notification[]>(response);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const response = await getAuthFetch()(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'POST',
  });
  return handleResponse<void>(response);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await getAuthFetch()(`${API_BASE}/notifications/preferences`);
  return handleResponse<NotificationPreferences>(response);
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  const response = await getAuthFetch()(`${API_BASE}/notifications/preferences`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(prefs),
  });
  return handleResponse<void>(response);
}

// ============ Catalog API ============

export async function getCatalog(): Promise<CatalogItem[]> {
  const response = await getAuthFetch()(`${API_BASE}/catalog`);
  return handleResponse<CatalogItem[]>(response);
}

export async function getCatalogByOperator(operatorId: string): Promise<CatalogItem[]> {
  const response = await getAuthFetch()(`${API_BASE}/catalog?operatorId=${operatorId}`);
  return handleResponse<CatalogItem[]>(response);
}

// ============ Orders API ============

export async function getOrders(): Promise<Order[]> {
  const response = await getAuthFetch()(`${API_BASE}/orders`);
  return handleResponse<Order[]>(response);
}

export async function getOrder(orderId: string): Promise<Order> {
  const response = await getAuthFetch()(`${API_BASE}/orders/${orderId}`);
  return handleResponse<Order>(response);
}

// ============ Error Classes ============

export { ApiError, AuthError, NotFoundError };
