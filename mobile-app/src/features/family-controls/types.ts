export type SharedControlCategory = 'DATA_MB' | 'VOICE_MIN' | 'SMS_COUNT' | 'SPEND_EUR' | 'ADDON_PURCHASES';

export type SharedControlAlertLevel = 'NONE' | 'WARNING' | 'CRITICAL';

export type SharedControlOverrideStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';

export type FamilyRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export type SharedControlCap = {
  lineId: string;
  category: SharedControlCategory;
  limit: number;
  alertThreshold: number;
  alertLevel: SharedControlAlertLevel;
};

export type SharedControlUsage = {
  lineId: string;
  category: SharedControlCategory;
  used: number;
  remaining: number;
  lastUpdated: string;
};

export type SharedControlAlert = {
  id: string;
  lineId: string;
  category: SharedControlCategory;
  level: SharedControlAlertLevel;
  message: string;
  createdAt: string;
};

export type SharedControlOverrideRequest = {
  requestId: string;
  lineId: string;
  category: SharedControlCategory;
  requestedLimit: number;
  reason: string;
  status: SharedControlOverrideStatus;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
};

export type SharedControlsResponse = {
  actingLineId: string;
  actingRole: FamilyRole;
  caps: SharedControlCap[];
  usage: SharedControlUsage[];
  alerts: SharedControlAlert[];
  overrideRequests: SharedControlOverrideRequest[];
  roleByLine: Record<string, string>;
  generatedAt: string;
};

export type SharedControlCapUpdateRequest = {
  lineId: string;
  category: SharedControlCategory;
  limit: number;
  alertThreshold: number;
};

export type SharedControlOverrideCreateRequest = {
  lineId: string;
  category: SharedControlCategory;
  requestedLimit: number;
  reason: string;
};

export type SharedControlOverrideDecisionRequest = {
  requestId: string;
  decision: 'APPROVE' | 'DENY';
};
