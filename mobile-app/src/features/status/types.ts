export type ServiceType = 
  | 'MOBILE_DATA'
  | 'VOICE_CALLS'
  | 'SMS'
  | 'ROAMING'
  | 'BILLING'
  | 'CUSTOMER_SUPPORT';

export type RegionStatus = {
  regionCode: string;
  regionName: string;
  serviceType: ServiceType;
  status: string;
  lastUpdated: string;
};

export type Incident = {
  incidentId: string;
  title: string;
  description: string;
  serviceType: ServiceType;
  severity: string;
  status: string;
  regionCode: string;
  startedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  currentUpdate: string;
};

export type IncidentUpdate = {
  updateId: string;
  incidentId: string;
  message: string;
  status: string;
  timestamp: string;
};

export type IncidentNotificationPreference = {
  preferenceId: string;
  customerId: string;
  lineId: string;
  regionCode: string;
  serviceType: ServiceType;
  notifyOnStart: boolean;
  notifyOnUpdate: boolean;
  notifyOnResolved: boolean;
  createdAt: string;
};
