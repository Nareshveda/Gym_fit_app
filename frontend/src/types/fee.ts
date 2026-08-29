/**
 * Domain types for the Fee Management module (plans, subscriptions,
 * payments). Mirrors backend/app/schemas/plan.py, subscription.py, and
 * payment.py exactly — integer ids, no currency/billing_cycle fields
 * (reconciled post-Phase-2 against the real backend contract).
 */

export type DurationType = 'monthly' | 'quarterly' | 'yearly';

export interface MembershipPlan {
  id: number;
  name: string;
  duration_type: DurationType;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for `POST /api/v1/plans/`. */
export interface PlanCreatePayload {
  name: string;
  duration_type: DurationType;
  price: number;
  description?: string | null;
}

/** Payload for `PUT /api/v1/plans/{id}` — all fields optional (partial update). */
export type PlanUpdatePayload = Partial<PlanCreatePayload> & { is_active?: boolean };

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'overdue' | 'cancelled';

export interface MemberSubscription {
  id: number;
  member_id: number;
  plan_id: number;
  start_date: string;
  due_date: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  plan?: MembershipPlan | null;
}

/** Payload for `POST /api/v1/members/{id}/subscriptions`. */
export interface SubscriptionCreatePayload {
  plan_id: number;
  start_date?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';

export interface Payment {
  id: number;
  member_id: number;
  subscription_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  recorded_by: number;
  notes: string | null;
  created_at: string;
}

/** Payload for `POST /api/v1/payments`. */
export interface RecordPaymentPayload {
  member_id: number;
  subscription_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string | null;
}
