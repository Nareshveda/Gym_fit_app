/**
 * Domain types for the Member Enrollment module.
 *
 * Kept separate from `src/types/index.ts` (per FRONTEND-AGENT file
 * ownership rules) since the `/api/v1/members` contract uses a richer,
 * enrollment-specific field set than the foundation-phase `Member`
 * shape defined there.
 */

export type MemberStatus = 'active' | 'inactive' | 'expired';

export type MemberGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: MemberGender;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_url: string | null;
  join_date: string;
  status: MemberStatus;
  created_at?: string;
  updated_at?: string;
}

/** Payload for `POST /api/v1/members`. */
export interface MemberCreatePayload {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: MemberGender;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_url?: string | null;
  join_date: string;
  status?: MemberStatus;
}

/** Payload for `PUT /api/v1/members/{id}` — every field is optional. */
export type MemberUpdatePayload = Partial<MemberCreatePayload>;

/** Query params supported by `GET /api/v1/members`. */
export interface MemberListParams {
  search?: string;
  status?: MemberStatus;
}

/** Envelope shape if the backend paginates the member list. */
export interface PaginatedMembers {
  items: Member[];
  total: number;
  page: number;
  page_size: number;
}
