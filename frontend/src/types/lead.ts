/** Domain types for public "Join the Crew" inquiries. Mirrors backend/app/schemas/lead.py. */

export interface Lead {
  id: number;
  full_name: string;
  phone_number: string;
  whatsapp_number: string;
  preferred_time: string;
  note: string | null;
  created_at: string;
}

/** Payload for `POST /api/v1/leads`. */
export interface LeadCreatePayload {
  full_name: string;
  phone_number: string;
  whatsapp_number: string;
  preferred_time: string;
  note?: string | null;
}
