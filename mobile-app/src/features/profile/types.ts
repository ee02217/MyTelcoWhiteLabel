export type NotificationPreferences = {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  marketingEmails: boolean;
};

export type AccountSession = {
  sessionId: string;
  deviceType: string;
  deviceName: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  currentSession: boolean;
};

export type CustomerProfile = {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  notificationPrefs: NotificationPreferences;
  sessions: AccountSession[];
  createdAt: string;
  updatedAt: string;
};
