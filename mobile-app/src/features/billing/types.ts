export type PaymentMethod = {
  paymentMethodId: string;
  customerId: string;
  type: string;
  cardLast4: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
};

export type BillingAddress = {
  addressId: string;
  customerId: string;
  lineId: string;
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AutoPayConfig = {
  customerId: string;
  enabled: boolean;
  paymentMethodId: string | null;
  scheduleDay: string | null;
  updatedAt: string;
};

export type Invoice = {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  lineId: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  pdfUrl: string;
};
