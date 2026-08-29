import api from './api';
import type {
  AttendanceListResponse,
  AttendanceRecord,
  CheckInPayload,
} from '../types/attendance';

/**
 * Axios calls for the Attendance module: `/api/v1/attendance/*` plus the
 * member-scoped attendance history endpoint under `/api/v1/members/*`.
 * Member search (used to pick who to check in) lives in `MemberSearchBox`
 * instead, since it calls `/api/v1/members` — a different module's endpoint.
 */
export const attendanceService = {
  async checkIn(payload: CheckInPayload): Promise<AttendanceRecord> {
    const { data } = await api.post<AttendanceRecord>('/attendance/check-in', payload);
    return data;
  },

  async checkOut(attendanceId: number): Promise<AttendanceRecord> {
    const { data } = await api.put<AttendanceRecord>(`/attendance/${attendanceId}/check-out`, {});
    return data;
  },

  /** Attendance records for a given day (defaults to today when omitted). */
  async list(date?: string): Promise<AttendanceRecord[]> {
    const { data } = await api.get<AttendanceListResponse>('/attendance', {
      params: date ? { date } : undefined,
    });
    return data.items;
  },

  async getMemberAttendance(memberId: number): Promise<AttendanceRecord[]> {
    const { data } = await api.get<AttendanceListResponse>(`/members/${memberId}/attendance`);
    return data.items;
  },
};
