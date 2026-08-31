import api from './api';
import type { AdminStats, AdminUser, CreateStaffPayload, UpdateUserRolePayload } from '../types/admin';

/**
 * Admin API calls. Every endpoint here requires an "owner" or "admin"
 * role server-side (enforced by `require_role` in the backend) — the
 * frontend gating in AdminPage/AdminUsersPage is a UX convenience only.
 */
export const adminService = {
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await api.get<AdminUser[]>('/admin/users');
    return data;
  },

  async updateUser(id: number, payload: UpdateUserRolePayload): Promise<AdminUser> {
    const { data } = await api.put<AdminUser>(`/admin/users/${id}`, payload);
    return data;
  },

  async createStaff(payload: CreateStaffPayload): Promise<AdminUser> {
    const { data } = await api.post<AdminUser>('/admin/users', payload);
    return data;
  },

  async getStats(): Promise<AdminStats> {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },
};
