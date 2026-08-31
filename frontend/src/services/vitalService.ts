import api from './api';
import type { Vital, VitalCreatePayload, VitalsDashboard } from '../types/vital';

/** API calls for member vitals (progress tracking), `/api/v1/members/{id}/vitals*`. */
export const vitalService = {
  async record(memberId: number, payload: VitalCreatePayload): Promise<Vital> {
    const { data } = await api.post<Vital>(`/members/${memberId}/vitals`, payload);
    return data;
  },

  async list(memberId: number): Promise<Vital[]> {
    const { data } = await api.get<Vital[]>(`/members/${memberId}/vitals`);
    return data;
  },

  async getDashboard(memberId: number): Promise<VitalsDashboard> {
    const { data } = await api.get<VitalsDashboard>(`/members/${memberId}/vitals/dashboard`);
    return data;
  },
};
