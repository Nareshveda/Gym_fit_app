import api from './api';
import type { Lead, LeadCreatePayload } from '../types/lead';

/** API calls for "Join the Crew" inquiries, `/api/v1/leads`. */
export const leadService = {
  /** Submit an inquiry from the public site. No auth required. */
  async create(payload: LeadCreatePayload): Promise<Lead> {
    const { data } = await api.post<Lead>('/leads', payload);
    return data;
  },

  /** List every submitted inquiry, most recent first (owner/admin only). */
  async list(): Promise<Lead[]> {
    const { data } = await api.get<Lead[]>('/leads');
    return data;
  },
};
