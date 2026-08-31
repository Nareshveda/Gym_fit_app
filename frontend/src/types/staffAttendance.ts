/**
 * Types for the Staff Attendance module, mirroring
 * backend/app/schemas/staff_attendance.py and staff.py.
 */

export type StaffRole = 'owner' | 'admin' | 'staff' | 'trainer';

export interface StaffListItem {
  id: number;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
}

export interface StaffAttendanceRecord {
  id: number;
  staff_id: number;
  staff_name: string;
  check_in_time: string;
  check_out_time: string | null;
  date: string;
  created_at: string;
}

/** Payload for `POST /api/v1/staff-attendance/check-in`. */
export interface StaffCheckInPayload {
  staff_id?: number;
}
