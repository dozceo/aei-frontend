import { backendGet, backendPost } from "@/lib/backend-client";

export type BillingPlanId = "starter" | "school_pro" | "enterprise";
export type BillingPaymentMethod = "CARD" | "UPI" | "NETBANKING";
export type BillingSessionStatus = "CREATED" | "SUCCEEDED" | "FAILED";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  monthlyAmountInr: number;
  currency: "INR";
  seatLimit: number;
  features: string[];
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingCheckoutSessionSummary {
  sessionId: string;
  status: BillingSessionStatus;
  checkoutProvider: "SIMULATED";
  plan: BillingPlan;
  billingName: string;
  billingEmail: string;
  paymentMethod: BillingPaymentMethod;
  discountCode: string | null;
  subtotalAmountInr: number;
  discountAmountInr: number;
  totalAmountInr: number;
  createdAtIso: string;
  updatedAtIso: string;
  successUrl: string;
  failureUrl: string;
}

export interface CreateBillingCheckoutInput {
  planId: BillingPlanId;
  billingName: string;
  billingEmail: string;
  paymentMethod: BillingPaymentMethod;
  discountCode?: string;
  billingAddress: BillingAddress;
}

interface BillingPlanResponse {
  plans: BillingPlan[];
}

interface CompleteBillingCheckoutInput {
  status: "SUCCEEDED" | "FAILED";
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const response = await backendGet<BillingPlanResponse>("/api/billing/plans");
  return response.plans;
}

export function createBillingCheckoutSession(payload: CreateBillingCheckoutInput): Promise<BillingCheckoutSessionSummary> {
  return backendPost<BillingCheckoutSessionSummary>("/api/billing/checkout", payload);
}

export function getBillingCheckoutSession(sessionId: string): Promise<BillingCheckoutSessionSummary> {
  return backendGet<BillingCheckoutSessionSummary>(`/api/billing/checkout/${sessionId}`);
}

export function completeBillingCheckoutSession(
  sessionId: string,
  payload: CompleteBillingCheckoutInput,
): Promise<BillingCheckoutSessionSummary> {
  return backendPost<BillingCheckoutSessionSummary>(`/api/billing/checkout/${sessionId}/complete`, payload);
}
