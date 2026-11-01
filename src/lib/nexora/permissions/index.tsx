import type { ComponentType, ReactNode } from 'react';
import { useAuth } from '@nexora/auth';

export const WILDCARD = '*';

/**
 * Fallback permission sets for the built-in system roles. Used only when the
 * backend returns no effective permissions (older API builds); the set from
 * GET /auth/me/permissions always wins.
 */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [WILDCARD],
  ORG_OWNER: [WILDCARD],
  ORG_ADMIN: [WILDCARD],
  ADMIN: [WILDCARD],
  MANAGER: [
    'users.view',
    'organization.view',
    'organization.update',
    'products.view',
    'products.create',
    'products.update',
    'price_lists.view',
    'price_lists.create',
    'price_lists.update',
    'customers.view',
    'customers.create',
    'customers.update',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'purchases.view',
    'purchases.create',
    'purchases.update',
    'purchases.receive',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.locations.manage',
    'sales.view',
    'sales.create',
    'sales.cancel',
    'sales.discount',
    'sales.returns',
    'payments.collect',
    'payments.refund',
    'pos.registers.view',
    'pos.registers.manage',
    'pos.shifts.open',
    'pos.shifts.close',
    'pos.shifts.view',
    'reports.sales.view',
    'reports.profit.view',
    'reports.inventory.view',
    'reports.purchases.view',
    'reports.expenses.view',
    'reports.customers.view',
    'reports.suppliers.view',
    'branches.view',
    'branches.manage',
  ],
  CASHIER: [
    'organization.view',
    'products.view',
    'customers.view',
    'customers.create',
    'inventory.view',
    'pos.registers.view',
    'pos.shifts.open',
    'pos.shifts.close',
    'pos.shifts.view',
    'sales.view',
    'sales.create',
    'payments.collect',
  ],
  STAFF: ['organization.view', 'products.view', 'inventory.view', 'sales.view'],
  VIEWER: [
    'organization.view',
    'products.view',
    'inventory.view',
    'sales.view',
    'reports.sales.view',
  ],
};

export function resolvePermissions(role: string | null | undefined): Set<string> {
  if (!role) return new Set();
  const codes = SYSTEM_ROLE_PERMISSIONS[role.toUpperCase()];
  if (!codes) return new Set();
  return new Set(codes);
}

export function hasPermission(permissions: Set<string>, code?: string | null): boolean {
  if (!code) return true;
  if (permissions.has(WILDCARD)) return true;
  if (permissions.has(code)) return true;
  const [module] = code.split('.');
  return permissions.has(`${module}.*`);
}

export function hasAnyPermission(permissions: Set<string>, codes: string[]): boolean {
  return codes.some((code) => hasPermission(permissions, code));
}

export function usePermissions() {
  const { membership, permissions: granted } = useAuth();
  const role = membership?.role ?? null;
  // Prefer the effective permission set resolved by the backend. The local
  // mapping is only a fallback for older API builds.
  const fallback = resolvePermissions(role);
  const permissions = granted.size > 0 ? granted : fallback;
  return {
    role,
    permissions,
    has: (code?: string | null) => hasPermission(permissions, code),
    hasAny: (codes: string[]) => hasAnyPermission(permissions, codes),
    isOwner: permissions.has(WILDCARD),
  };
}

interface PermissionGateProps {
  permission?: string | string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  mode = 'all',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { has, hasAny } = usePermissions();
  if (!permission) return <>{children}</>;
  const codes = Array.isArray(permission) ? permission : [permission];
  const allowed = mode === 'any' ? hasAny(codes) : codes.every((code) => has(code));
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export interface NavItem {
  to: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function filterNav(groups: NavGroup[], has: (code?: string) => boolean): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}
