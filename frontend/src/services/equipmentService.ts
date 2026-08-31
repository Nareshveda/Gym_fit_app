import api from './api';
import type { Equipment, EquipmentCreatePayload, EquipmentUpdatePayload } from '../types/equipment';

/** API calls for the Equipment/Inventory module, `/api/v1/equipment` (admin-only). */
export const equipmentService = {
  async list(): Promise<Equipment[]> {
    const { data } = await api.get<Equipment[]>('/equipment');
    return data;
  },

  async create(payload: EquipmentCreatePayload): Promise<Equipment> {
    const { data } = await api.post<Equipment>('/equipment', payload);
    return data;
  },

  async update(id: number, payload: EquipmentUpdatePayload): Promise<Equipment> {
    const { data } = await api.put<Equipment>(`/equipment/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/equipment/${id}`);
  },

  /** Attach (or replace) a warranty/invoice document — .jpg/.jpeg/.pdf/.doc/.docx, up to 10 MB. */
  async uploadDocument(id: number, file: File): Promise<Equipment> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<Equipment>(`/equipment/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
