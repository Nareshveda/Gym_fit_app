import api from './api';
import type { Location, LocationCreatePayload, LocationUpdatePayload } from '../types/location';

/** API calls for gym locations/branches, `/api/v1/locations`. */
export const locationService = {
  async list(): Promise<Location[]> {
    const { data } = await api.get<Location[]>('/locations');
    return data;
  },

  async create(payload: LocationCreatePayload): Promise<Location> {
    const { data } = await api.post<Location>('/locations', payload);
    return data;
  },

  async update(id: number, payload: LocationUpdatePayload): Promise<Location> {
    const { data } = await api.put<Location>(`/locations/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/locations/${id}`);
  },
};
