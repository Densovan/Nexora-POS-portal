import { describe, expect, it } from 'vitest';
import { canRefreshSession } from './client';

describe('canRefreshSession', () => {
  it('retries authenticated calls with an existing session', () => {
    expect(canRefreshSession('/auth/me')).toBe(true);
    expect(canRefreshSession('/auth/me/permissions')).toBe(true);
    expect(canRefreshSession('/sales?page=0&size=20')).toBe(true);
  });

  it('never refreshes the calls that create or renew a session', () => {
    expect(canRefreshSession('/auth/login')).toBe(false);
    expect(canRefreshSession('/auth/register')).toBe(false);
    expect(canRefreshSession('/auth/invitations/accept')).toBe(false);
    expect(canRefreshSession('/auth/refresh')).toBe(false);
  });
});
