export type DiagnosticTestType = 
  | 'SIGNAL_STRENGTH'
  | 'DATA_CONNECTIVITY'
  | 'VOICE_CALL'
  | 'SMS_DELIVERY'
  | 'APN_CONFIGURATION'
  | 'LATENCY_TEST';

export type DiagnosticSeverity = 'OK' | 'WARNING' | 'CRITICAL';

export type DeviceInfo = {
  lineId: string;
  msisdn: string;
  deviceModel: string;
  imei: string;
  esimCapable: boolean;
  esimProfileStatus: string;
  simStatus: string;
  networkStatus: string;
  lastUpdated: string;
};

export type DeviceCompatibilityCheck = {
  lineId: string;
  planCompatible: boolean;
  roamingCompatible: boolean;
  planMessage: string;
  roamingMessage: string;
};

export type DiagnosticResult = {
  testType: DiagnosticTestType;
  severity: DiagnosticSeverity;
  message: string;
  nextStepGuidance: string;
  details: Record<string, unknown>;
};

export type DiagnosticRunResponse = {
  lineId: string;
  results: DiagnosticResult[];
  overallSeverity: DiagnosticSeverity;
  escalationRecommended: boolean;
  completedAt: string;
};
