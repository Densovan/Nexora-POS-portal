import { describe, expect, it } from 'vitest';
import { WILDCARD, filterNav, hasAnyPermission, hasPermission, resolvePermissions } from './index';

describe('resolvePermissions', () => {
  it('grants the wildcard to owners', () => {
    expect(resolvePermissions('ORG_OWNER').has(WILDCARD)).toBe(true);
  });

  it('returns the fallback set for known roles and empty for unknown roles', () => {
    expect(resolvePermissions('cashier').has('pos.shifts.open')).toBe(true);
    expect(resolvePermissions('FREELANCER').size).toBe(0);
    expect(resolvePermissions(null).size).toBe(0);
  });
});

describe('hasPermission', () => {
  it('honours wildcards and module wildcards', () => {
    expect(hasPermission(new Set([WILDCARD]), 'sales.create')).toBe(true);
    expect(hasPermission(new Set(['pos.*']), 'pos.shifts.close')).toBe(true);
    expect(hasPermission(new Set(['sales.view']), 'sales.create')).toBe(false);
    expect(hasPermission(new Set(), undefined)).toBe(true);
  });

  it('checks any of a list', () => {
    const granted = new Set(['pos.shifts.view']);
    expect(hasAnyPermission(granted, ['sales.view', 'pos.shifts.view'])).toBe(true);
    expect(hasAnyPermission(granted, ['sales.view'])).toBe(false);
  });
});

describe('filterNav', () => {
  it('drops items and empty groups that are not permitted', () => {
    const groups = [
      {
        label: 'Operations',
        items: [
          { to: '/sales', label: 'Sales', permission: 'sales.view' },
          { to: '/users', label: 'Users', permission: 'users.view' },
        ],
      },
      {
        label: 'Admin',
        items: [{ to: '/roles', label: 'Roles', permission: 'authorization.roles.manage' }],
      },
    ];
    const filtered = filterNav(groups, (code) => code === 'sales.view');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].items.map((item) => item.to)).toEqual(['/sales']);
  });
});
