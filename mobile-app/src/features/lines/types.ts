export type Line = {
  lineId: string;
  customerId: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'PENDING' | 'PENDING_CANCEL' | 'CANCELLED' | 'SUSPENDED';
  planId: string;
  planName: string;
  planPrice: number;
  simType: 'ESIM' | 'PHYSICAL';
  esimQrCode: string | null;
  esimActivationCode: string | null;
  activationDate: string | null;
  ean13Code: string | null;
  iccid: string | null;
  deliveryStatus: string | null;
  deliveryAddress: string | null;
  estimatedDelivery: string | null;
};

export type NumberPorting = {
  status: string;
  donorOperator: string;
  requestedAt: string;
  estimatedCompletion: string;
  otp: string;
  otpVerified: boolean;
};

export type Usage = {
  period: string;
  dataUsedMb: number;
  dataLimitMb: number;
  voiceUsed: number;
  voiceLimit: number;
  smsUsed: number;
  smsLimit: number;
};

export type LineDetails = {
  lineId: string;
  phoneNumber: string;
  status: string;
  planName: string;
  planPrice: number;
  simType: string;
  esimQrCode: string | null;
  esimActivationCode: string | null;
  activationDate: string | null;
  ean13Code: string | null;
  iccid: string | null;
  deliveryStatus: string | null;
  deliveryAddress: string | null;
  estimatedDelivery: string | null;
  porting: NumberPorting | null;
  usage: Usage[];
};

export type ProrationPreview = {
  creditForRemaining: number;
  chargeForNewPlan: number;
  totalDue: number;
  effectiveDate: string;
  daysRemaining: number;
};
