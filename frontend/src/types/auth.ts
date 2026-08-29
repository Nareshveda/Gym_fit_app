/**
 * Auth-module types for the HSP frontend. Kept separate from
 * `types/index.ts` (owned by the foundation phase) so the auth module
 * can evolve its request/response shapes independently.
 */
import type { Role } from './index';

/** Authenticated user shape returned by `/api/v1/auth/me` and friends. */
export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

/** Response body from `/api/v1/auth/login` and `/api/v1/auth/refresh`. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Partial update payload accepted by `PUT /api/v1/auth/me`. */
export interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
}
