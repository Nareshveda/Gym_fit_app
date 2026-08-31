/** Domain types for gym locations/branches. Mirrors backend/app/schemas/location.py. */

export interface Location {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for `POST /api/v1/locations`. */
export interface LocationCreatePayload {
  name: string;
  address?: string | null;
  phone?: string | null;
}

/** Payload for `PUT /api/v1/locations/{id}` — all fields optional. */
export type LocationUpdatePayload = Partial<LocationCreatePayload> & { is_active?: boolean };
