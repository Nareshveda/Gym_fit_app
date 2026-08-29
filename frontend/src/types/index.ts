/**
 * Shared domain types for the HSP gym management app.
 *
 * These are foundation-phase shapes covering the fields every module
 * needs to compile against. Module agents (Phase 2) extend these with
 * richer fields as backend schemas solidify — avoid narrowing or
 * removing fields here without checking downstream usage.
 */

export type UUID = string;

export type Role = 'admin' | 'staff' | 'trainer' | 'member';

export interface User {
  id: UUID;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface Member {
  id: UUID;
  user_id: UUID;
  full_name: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  joined_at: string;
  avatar_url: string | null;
}

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface MembershipPlan {
  id: UUID;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  duration_days: number;
  is_active: boolean;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'paused';

export interface MemberSubscription {
  id: UUID;
  member_id: UUID;
  plan_id: UUID;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'other';

export interface Payment {
  id: UUID;
  member_id: UUID;
  subscription_id: UUID | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paid_at: string | null;
  created_at: string;
}

export type AttendanceMethod = 'qr' | 'manual' | 'biometric' | 'rfid';

export interface Attendance {
  id: UUID;
  member_id: UUID;
  check_in_at: string;
  check_out_at: string | null;
  method: AttendanceMethod;
}

/** Generic paginated API list response envelope. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
