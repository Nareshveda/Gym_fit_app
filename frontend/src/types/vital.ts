/**
 * Types for member vitals (progress tracking), mirroring
 * backend/app/schemas/member_vital.py.
 */

export interface Vital {
  id: number;
  member_id: number;
  recorded_at: string;
  height_cm: string | null;
  weight_kg: string;
  bmi: string | null;
  notes: string | null;
  recorded_by: number;
  created_at: string;
}

/** Payload for `POST /api/v1/members/{id}/vitals`. */
export interface VitalCreatePayload {
  recorded_at?: string;
  height_cm?: number | null;
  weight_kg: number;
  notes?: string | null;
}

/** Response envelope for `GET /api/v1/members/{id}/vitals/dashboard`. */
export interface VitalsDashboard {
  member_id: number;
  history: Vital[];
  latest: Vital | null;
  baseline: Vital | null;
  weight_change_kg: string | null;
  bmi_change: string | null;
}
