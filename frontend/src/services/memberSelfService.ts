import api from './api';
import type { AttendanceRecord } from '../types/attendance';
import type { Vital, VitalsDashboard } from '../types/vital';

/**
 * API calls for the member self-service portal, `/api/v1/me/*`. Scoped to
 * the logged-in member's own record via their token — no id parameter,
 * unlike the staff-facing `attendanceService`/`vitalService` equivalents.
 */
export const memberSelfService = {
  async getMyAttendance(): Promise<AttendanceRecord[]> {
    const { data } = await api.get<AttendanceRecord[]>('/me/attendance');
    return data;
  },

  async getMyVitals(): Promise<Vital[]> {
    const { data } = await api.get<Vital[]>('/me/vitals');
    return data;
  },

  async getMyVitalsDashboard(): Promise<VitalsDashboard> {
    const { data } = await api.get<VitalsDashboard>('/me/vitals/dashboard');
    return data;
  },
};
