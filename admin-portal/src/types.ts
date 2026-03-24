export type OperatorSummaryResponse = {
  operatorId: string;
  name: string;
  version: number;
  updatedAt: string;
  locales: string[];
  channelCount: number;
  journeyCount: number;
  userCount: number;
};

export type OperatorBranding = {
  logoLight: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
};

export type OperatorProfileResponse = {
  operatorId: string;
  name: string;
  branding: OperatorBranding;
  featuresByChannel: Record<string, Record<string, boolean>>;
  locales: string[];
  journeyCount: number;
  version: number;
  updatedAt: string;
};

export type OperatorUserResponse = {
  userId: string;
  displayName: string;
  email: string;
  roles: string[];
  enabled: boolean;
  updatedAt: string;
};

export type OperatorAuditEntry = {
  operatorId: string;
  scope: string;
  targetId: string;
  action: string;
  actor: string;
  version: number;
  timestamp: string;
  changes: Record<string, unknown>;
};

export type ContentState = 'DRAFT' | 'REVIEW' | 'PUBLISHED';

export type ContentLocaleSummary = {
  locale: string;
  version: number;
  state: ContentState;
  updatedAt: string;
  author: string;
  reviewer: string | null;
};

export type ContentSummaryResponse = {
  contentId: string;
  locales: ContentLocaleSummary[];
};

export type ContentVersionResponse = {
  contentId: string;
  locale: string;
  version: number;
  state: ContentState;
  title: string;
  body: string;
  notes: string | null;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

export type ContentLocaleResponse = {
  contentId: string;
  locale: string;
  current: ContentVersionResponse;
  history: ContentVersionResponse[];
};

export type OfferState = 'DRAFT' | 'APPROVAL' | 'PUBLISHED' | 'RETIRED';

export type OfferSummaryResponse = {
  offerId: string;
  version: number;
  state: OfferState;
  name: string;
  visibleChannels: string[];
  eligibilityRules: Record<string, unknown>;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

export type OfferVersionResponse = {
  offerId: string;
  version: number;
  state: OfferState;
  name: string;
  description: string;
  eligibilityRules: Record<string, unknown>;
  visibleChannels: string[];
  notes: string | null;
  author: string;
  reviewer: string | null;
  updatedAt: string;
};

export type OfferDetailResponse = {
  offerId: string;
  current: OfferVersionResponse;
  history: OfferVersionResponse[];
};
