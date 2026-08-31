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

export type TrainingCategory = 'personal_training' | 'group_training';

export interface Member {
  id: string;
  /** Permanent, human-readable code like "PT-0001" / "GT-0001" — generated server-side, never regenerated. */
  member_code: string;
  full_name: string;
  email: string | null;
  phone: string;
  whatsapp_number: string | null;
  birth_month: number;
  birth_year: number;
  /** Computed server-side from `birth_month`/`birth_year` — read-only. */
  age: number;
  gender: MemberGender;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  photo_url: string | null;
  training_category: TrainingCategory;
  medical_history: string | null;
  goal: string | null;
  location_id: number | null;
  referred_by_name: string | null;
  referred_by_member_id: number | null;
  join_date: string;
  status: MemberStatus;
  /** Name of the member's most recently assigned plan (the actual admin-created Plan), or null if none. */
  current_plan_name: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Payload for `POST /api/v1/members`. */
export interface MemberCreatePayload {
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number?: string | null;
  birth_month: number;
  birth_year: number;
  gender: MemberGender;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_url?: string | null;
  training_category: TrainingCategory;
  medical_history?: string | null;
  goal?: string | null;
  location_id?: number | null;
  referred_by_name?: string | null;
  referred_by_member_id?: number | null;
  join_date: string;
  status?: MemberStatus;
}

/** Payload for `PUT /api/v1/members/{id}` — every field is optional. */
export type MemberUpdatePayload = Partial<MemberCreatePayload>;

/** Payload for `PUT /api/v1/members/{id}/credentials` — grants/resets self-service login. */
export interface SetMemberCredentialsPayload {
  password: string;
}

/** Query params supported by `GET /api/v1/members`. */
export interface MemberListParams {
  search?: string;
  status?: MemberStatus;
  location_id?: number;
}

/** Envelope shape if the backend paginates the member list. */
export interface PaginatedMembers {
  items: Member[];
  total: number;
  page: number;
  page_size: number;
}
