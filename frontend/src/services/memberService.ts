import api from './api';
import type {
  Member,
  MemberCreatePayload,
  MemberListParams,
  MemberUpdatePayload,
  PaginatedMembers,
  SetMemberCredentialsPayload,
} from '../types/member';

/**
 * Member enrollment API calls. The list endpoint's response shape isn't
 * finalized yet (plain array vs. a paginated envelope), so `list` handles
 * both defensively without resorting to `any`.
 */
export const memberService = {
  async list(params: MemberListParams = {}): Promise<Member[]> {
    const { data } = await api.get<Member[] | PaginatedMembers>('/members', {
      params,
    });
    return Array.isArray(data) ? data : data.items;
  },

  async get(id: string): Promise<Member> {
    const { data } = await api.get<Member>(`/members/${id}`);
    return data;
  },

  async create(payload: MemberCreatePayload): Promise<Member> {
    const { data } = await api.post<Member>('/members', payload);
    return data;
  },

  async update(id: string, payload: MemberUpdatePayload): Promise<Member> {
    const { data } = await api.put<Member>(`/members/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/members/${id}`);
  },

  /** Grant or reset this member's self-service login password (staff-only). */
  async setCredentials(id: string, payload: SetMemberCredentialsPayload): Promise<Member> {
    const { data } = await api.put<Member>(`/members/${id}/credentials`, payload);
    return data;
  },
};
