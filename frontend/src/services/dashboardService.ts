import api from './api';
import type { DashboardStats } from '../types/dashboard';

/**
 * Dashboard API calls. Thin wrapper over the shared `api` axios instance,
 * matching the pattern used by `feeService`/`memberService`.
 */
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};
