import type { Location } from './location';

/** Domain types for the Equipment/Inventory module (admin-only). Mirrors backend/app/schemas/equipment.py. */

export interface Equipment {
  id: number;
  name: string;
  brand: string | null;
  purchase_date: string | null;
  /** Serialized as a JSON string by the backend (Decimal), not a number. */
  amount: string | null;
  warranty_details: string | null;
  service_schedule: string | null;
  notes: string | null;
  locations: Location[];
  /** Path (relative to the API origin, not `/api/v1`) the attached document is served from, or null if none. */
  document_url: string | null;
  /** Original filename of the attached document, or null if none. */
  document_filename: string | null;
  created_at: string;
  updated_at: string;
}

/** Extensions accepted by `POST /api/v1/equipment/{id}/document`. */
export const EQUIPMENT_DOCUMENT_ACCEPT = '.jpg,.jpeg,.pdf,.doc,.docx';

/** Payload for `POST /api/v1/equipment`. */
export interface EquipmentCreatePayload {
  name: string;
  brand?: string | null;
  purchase_date?: string | null;
  amount?: number | null;
  warranty_details?: string | null;
  service_schedule?: string | null;
  notes?: string | null;
  location_ids: number[];
}

/** Payload for `PUT /api/v1/equipment/{id}` — all fields optional. */
export type EquipmentUpdatePayload = Partial<EquipmentCreatePayload>;
