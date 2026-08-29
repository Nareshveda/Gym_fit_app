import api from './api';
import type {
  MembershipPlan,
  MemberSubscription,
  Payment,
  PlanCreatePayload,
  PlanUpdatePayload,
  RecordPaymentPayload,
  SubscriptionCreatePayload,
} from '../types/fee';

/**
 * Fee Management API calls — membership plans, member subscriptions,
 * and payments. Thin wrappers over the shared `api` axios instance.
 */
export const feeService = {
  // Plans
  async listPlans(): Promise<MembershipPlan[]> {
    const { data } = await api.get<MembershipPlan[]>('/plans');
    return data;
  },

  async createPlan(payload: PlanCreatePayload): Promise<MembershipPlan> {
    const { data } = await api.post<MembershipPlan>('/plans', payload);
    return data;
  },

  async updatePlan(id: number, payload: PlanUpdatePayload): Promise<MembershipPlan> {
    const { data } = await api.put<MembershipPlan>(`/plans/${id}`, payload);
    return data;
  },

  async deletePlan(id: number): Promise<void> {
    await api.delete(`/plans/${id}`);
  },

  // Subscriptions
  async listMemberSubscriptions(memberId: number): Promise<MemberSubscription[]> {
    const { data } = await api.get<MemberSubscription[]>(`/members/${memberId}/subscriptions`);
    return data;
  },

  async createMemberSubscription(
    memberId: number,
    payload: SubscriptionCreatePayload,
  ): Promise<MemberSubscription> {
    const { data } = await api.post<MemberSubscription>(
      `/members/${memberId}/subscriptions`,
      payload,
    );
    return data;
  },

  // Payments
  async listPayments(): Promise<Payment[]> {
    const { data } = await api.get<Payment[]>('/payments');
    return data;
  },

  async recordPayment(payload: RecordPaymentPayload): Promise<Payment> {
    const { data } = await api.post<Payment>('/payments', payload);
    return data;
  },

  async listMemberPayments(memberId: number): Promise<Payment[]> {
    const { data } = await api.get<Payment[]>(`/members/${memberId}/payments`);
    return data;
  },

  /** Subscriptions that are overdue or expiring within 7 days (not raw payments). */
  async listOverdueSubscriptions(): Promise<MemberSubscription[]> {
    const { data } = await api.get<MemberSubscription[]>('/payments/overdue');
    return data;
  },
};
