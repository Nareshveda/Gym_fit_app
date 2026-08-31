import api from './api';
import type {
  StaffAttendanceRecord,
  StaffCheckInPayload,
  StaffListItem,
} from '../types/staffAttendance';

/** API calls for the Staff Attendance module and the staff directory. */
export const staffAttendanceService = {
  async listStaff(): Promise<StaffListItem[]> {
    const { data } = await api.get<StaffListItem[]>('/staff');
    return data;
  },

  async checkIn(payload: StaffCheckInPayload = {}): Promise<StaffAttendanceRecord> {
    const { data } = await api.post<StaffAttendanceRecord>('/staff-attendance/check-in', payload);
    return data;
  },

  async checkOut(attendanceId: number): Promise<StaffAttendanceRecord> {
    const { data } = await api.put<StaffAttendanceRecord>(
      `/staff-attendance/${attendanceId}/check-out`,
      {},
    );
    return data;
  },

  /** Attendance records, optionally filtered by date and/or staff member. */
  async list(params: { date?: string; staffId?: number } = {}): Promise<StaffAttendanceRecord[]> {
    const { data } = await api.get<StaffAttendanceRecord[]>('/staff-attendance', {
      params: { date: params.date, staff_id: params.staffId },
    });
    return data;
  },
};
