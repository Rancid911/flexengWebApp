export type PaymentPlan = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  badge: string | null;
  yookassaProductLabel: string;
  sortOrder: number;
};

export type StudentPaymentTransaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
  paidAt: string | null;
  rawStatus: string | null;
  confirmationUrl: string | null;
  confirmationExpiresAt: string | null;
  isConfirmationExpired: boolean;
  providerPaymentId: string | null;
  planId: string | null;
  planTitle: string | null;
};

export type PaymentStatusContext = {
  transactionId: string;
  status: string;
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
  description: string;
  confirmationExpiresAt: string | null;
  isConfirmationExpired: boolean;
};
