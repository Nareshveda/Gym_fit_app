/**
 * Admin module types.
 *
 * `AdminRole` intentionally includes `'owner'`, unlike the shared `Role`
 * type in `types/index.ts` (which the admin module does not own and must
 * not edit) — the backend `UserRole` enum has owner/admin/staff/trainer,
 * and the admin panel needs to display and assign all four.
 */

export type AdminRole = 'owner' | 'admin' | 'staff' | 'trainer';

/** A staff account as returned by GET /api/v1/admin/users. */
export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: AdminRole;
  is_active: boolean;
}

/** Payload for PUT /api/v1/admin/users/{id}. Both fields are optional. */
export interface UpdateUserRolePayload {
  role?: AdminRole;
  is_active?: boolean;
}

/** Payload for POST /api/v1/admin/users (owner/admin only). */
export interface CreateStaffPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: AdminRole;
}

/** Staff count for a single role, part of the admin stats response. */
export interface AdminRoleCount {
  role: AdminRole;
  count: number;
}

/** Response shape for GET /api/v1/admin/stats. */
export interface AdminStats {
  total_staff: number;
  by_role: AdminRoleCount[];
}
