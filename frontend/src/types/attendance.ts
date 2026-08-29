/**
 * Types for the Attendance & Membership Tracking module.
 *
 * Defined here (not in `src/types/index.ts`, which owns a foundation-phase
 * `Attendance`/`Member` shape keyed by UUID) because the real backend —
 * see `backend/app/schemas/member.py` and `backend/app/routers/members.py`,
 * built in parallel by BACKEND-AGENT — keys members and attendance records
 * by integer id and returns a `{ items, total, page, limit, pages }`
 * pagination envelope, not the `UUID`/`page_size` shapes in `index.ts`.
 * Keeping these local avoids touching the shared foundation types while
 * staying accurate to the API this module actually talks to.
 */

export type AttendanceMethod = 'qr' | 'manual' | 'biometric' | 'rfid';

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/** Lightweight member shape used by member search when picking who to check in. */
export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  photo_url: string | null;
  status: MemberStatus;
}

/** Response envelope for `GET /api/v1/members?search=`. */
export interface MemberSearchResponse {
  items: MemberSearchResult[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** A single attendance record as returned by the attendance endpoints. */
export interface AttendanceRecord {
  id: number;
  member_id: number;
  member_name: string;
  member_photo_url: string | null;
  check_in_at: string;
  check_out_at: string | null;
  method: AttendanceMethod;
}

/** Response envelope for `GET /api/v1/attendance` and the member-scoped history endpoint. */
export interface AttendanceListResponse {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Payload for `POST /api/v1/attendance/check-in`. */
export interface CheckInPayload {
  member_id: number;
  method?: AttendanceMethod;
}
