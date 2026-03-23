// API Response Types matching backend CustomerUsageResponse

export interface ServiceUsageBreakdown {
  dataMb: number;
  voiceMinutes: number;
  smsCount: number;
}

export interface LineUsageEntry {
  lineId: string;
  msisdn: string;
  nickname: string;
  usage: ServiceUsageBreakdown;
}

export interface UsageThresholdCrossing {
  serviceType: 'DATA' | 'VOICE' | 'SMS';
  thresholdPercent: number;
  message: string;
}

export interface DataFreshness {
  source: 'REAL_TIME' | 'CACHED' | 'STALE';
  lastUpdated: string;
  staleness: 'FRESH' | 'STALE';
}

export interface CustomerUsageResponse {
  view: 'daily' | 'billing-cycle';
  periodStart: string;
  periodEnd: string;
  customerId: string;
  totals: ServiceUsageBreakdown;
  lines: LineUsageEntry[];
  thresholdCrossings: UsageThresholdCrossing[];
  dataFreshness: DataFreshness;
}

// Daily Usage API Response
export interface DailyUsageResponse {
  date: string;
  dataMb: number;
  voiceMinutes: number;
  smsCount: number;
}

// Projection Response
export interface UsageProjections {
  dataDaysRemaining: number | null;
  dataLimitBreachDate: string | null;
  voiceDaysRemaining: number | null;
  voiceLimitBreachDate: string | null;
  smsDaysRemaining: number | null;
  smsLimitBreachDate: string | null;
  dataDailyAverageMb: number;
  voiceDailyAverageMinutes: number;
  smsDailyAverage: number;
}

// Formatted types for UI
export interface FormattedUsage {
  dataGb: number;
  dataLimitGb: number;
  dataPercent: number;
  voiceMinutes: number;
  voiceLimit: number;
  voicePercent: number;
  smsCount: number;
  smsLimit: number;
  smsPercent: number;
}

export interface FormattedLineUsage {
  lineId: string;
  msisdn: string;
  nickname: string;
  dataGb: number;
  dataLimitGb: number;
  dataPercent: number;
  voiceMinutes: number;
  voicePercent: number;
  smsCount: number;
  smsPercent: number;
}
