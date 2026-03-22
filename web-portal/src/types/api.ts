// Shared API types for the customer portal

// ============ Account Types ============

export interface AccountOverview {
  plan: string;
  activeLineCount: number;
  outstandingAmount: number;
  nextBillDate?: string;
  accountType?: string;
  accountStatus?: string;
  lineStructure?: string;
}

export interface ActiveLine {
  lineId: string;
  msisdn: string;
  nickname?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

// ============ Usage Types ============

export interface UsageSummary {
  dataUsedMb: number;
  dataLimitMb: number;
  voiceMinutesUsed: number;
  voiceMinutesLimit: number;
  smsUsed: number;
  smsLimit: number;
  dataUsagePercent: number;
  voiceUsagePercent: number;
  smsUsagePercent: number;
}

export interface UsageDetails {
  billingCycleStart: string;
  billingCycleEnd: string;
  dataUsedMb: number;
  dataLimitMb: number;
  voiceMinutesUsed: number;
  voiceMinutesLimit: number;
  smsUsed: number;
  smsLimit: number;
  dailyUsage: DailyUsage[];
}

export interface DailyUsage {
  date: string;
  dataUsedMb: number;
  voiceMinutesUsed: number;
  smsUsed: number;
}

// ============ Billing Types ============

export interface BillingSummary {
  currentBalance: number;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  nextPaymentDueDate: string;
  paymentMethod: string;
  autoPayEnabled: boolean;
}

export interface PaymentMethod {
  paymentMethodId: string;
  token: string;
  status: string;
  type: 'CARD' | 'SEPA';
  // For cards
  cardBrand?: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  expiryDate?: string;
  // For SEPA
  bankName?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  currency?: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
  description?: string;
  receiptUrl?: string;
}

export interface PaymentHistoryItem {
  paymentId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  methodSummary: string;
  status: 'SUCCESS' | 'FAILED';
  referenceId: string;
}

export interface PaymentHistoryResponse {
  months: number;
  payments: PaymentHistoryItem[];
}

// ============ Lines Types ============

export interface Line {
  lineId: string;
  msisdn: string;
  nickname?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  plan: string;
  simNumber?: string;
  esimStatus?: 'NOT_SUPPORTED' | 'AVAILABLE' | 'INSTALLED' | 'PENDING';
  primaryLine: boolean;
}

export interface LineDetail extends Line {
  usage: UsageSummary;
  roamingEnabled: boolean;
  roamingPacks: RoamingPack[];
}

export interface SIMAction {
  action: 'BLOCK' | 'UNBLOCK' | 'ACTIVATE_ESIM' | 'DEACTIVATE_ESIM';
  lineId: string;
  reason?: string;
}

export interface SIMActionResult {
  success: boolean;
  newStatus: string;
  message: string;
}

// ============ Roaming Types ============

export interface RoamingStatus {
  enabled: boolean;
  countryCode: string;
  countryName: string;
}

export interface RoamingPack {
  packId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  dataMb: number;
  durationDays: number;
  active: boolean;
}

// ============ Support Types ============

export interface SupportCase {
  caseId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportCaseDetail extends SupportCase {
  description: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  eventId: string;
  timestamp: string;
  type: 'UPDATE' | 'MESSAGE' | 'STATUS_CHANGE' | 'RESOLUTION';
  message: string;
  author: string;
}

export interface CreateCaseRequest {
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// ============ Notifications Types ============

export interface Notification {
  notificationId: string;
  type: 'BILLING' | 'USAGE' | 'ORDER' | 'SUPPORT' | 'SYSTEM';
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  categories: {
    billing: boolean;
    usage: boolean;
    order: boolean;
    support: boolean;
    marketing: boolean;
  };
}

// ============ Catalog Types ============

export interface CatalogItem {
  itemId: string;
  code: string;
  name: string;
  description: string;
  category: 'ADDON' | 'DEVICE' | 'ROAMING';
  price: number;
  currency: string;
  durationDays?: number;
  dataMb?: number;
}

export interface CartItem {
  itemId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CartItem[];
  paymentMethodId: string;
  idempotencyKey: string;
}

export interface CheckoutResponse {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  idempotencyKey: string;
}

// ============ Order Types ============

export interface Order {
  orderId: string;
  itemCode: string;
  itemName: string;
  state: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
  rollbackApplied: boolean;
}

// ============ Dashboard Types ============

export interface DashboardResponse {
  accountSummary: {
    accountStatus: string;
    planName: string;
    primaryMsisdn: string;
  };
  usageSummary: UsageSummary;
  billingSummary: BillingSummary;
  responseTime: string;
}
