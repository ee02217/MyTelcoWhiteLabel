export type TravelRecommendation = {
  destination: string;
  destinationName: string;
  packId: string;
  packName: string;
  dataMb: number;
  voiceMinutes: number;
  validityDays: number;
  priceEur: number;
  payAsYouGoEur: number;
  savingsEur: number;
  recommended: boolean;
};

export type RoamingUsage = {
  lineId: string;
  country: string;
  dataUsedMb: number;
  voiceUsedMinutes: number;
  smsUsed: number;
  dataLimitMb: number;
  voiceLimitMinutes: number;
  periodStart: string;
  periodEnd: string;
};

export type SpendCap = {
  lineId: string;
  limitEur: number;
  spentEur: number;
  alertTriggers: string[];
  updatedAt: string;
};

export type EmergencyTopupResult = {
  transactionId: string;
  status: string;
  amountEur: number;
  message: string;
  validUntil: string;
};
