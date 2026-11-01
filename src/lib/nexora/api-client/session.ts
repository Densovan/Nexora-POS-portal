import type { AuthResponse } from '@nexora/api-types';

const KEYS = {
  accessToken: 'nexora.access-token',
  refreshToken: 'nexora.refresh-token',
  organizationId: 'nexora.organization-id',
  branchId: 'nexora.active-branch-id',
} as const;

const memory = new Map<string, string>();

function read(key: string): string | null {
  if (typeof window === 'undefined') return memory.get(key) ?? null;
  return window.localStorage.getItem(key);
}

function write(key: string, value: string | null) {
  if (typeof window === 'undefined') {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
    return;
  }
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
}

export const session = {
  get accessToken() {
    return read(KEYS.accessToken);
  },
  get refreshToken() {
    return read(KEYS.refreshToken);
  },
  get organizationId() {
    return read(KEYS.organizationId);
  },
  get branchId() {
    return read(KEYS.branchId);
  },
  setOrganizationId(organizationId: string | null) {
    write(KEYS.organizationId, organizationId);
  },
  setBranchId(branchId: string | null) {
    write(KEYS.branchId, branchId);
  },
  setTokens(accessToken: string, refreshToken: string) {
    write(KEYS.accessToken, accessToken);
    write(KEYS.refreshToken, refreshToken);
  },
  saveAuth(auth: AuthResponse) {
    session.setTokens(auth.accessToken, auth.refreshToken);
    if (auth.organization?.id) session.setOrganizationId(auth.organization.id);
  },
  clear() {
    write(KEYS.accessToken, null);
    write(KEYS.refreshToken, null);
    write(KEYS.organizationId, null);
    write(KEYS.branchId, null);
  },
  hasSession() {
    return Boolean(read(KEYS.accessToken));
  },
};

export const SESSION_EXPIRED_EVENT = 'nexora:session-expired';

export function notifySessionExpired() {
  session.clear();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
