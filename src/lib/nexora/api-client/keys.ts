export const queryKeys = {
  me: ['me'] as const,
  branches: ['branches'] as const,
  branch: (id: string) => ['branches', id] as const,
  members: ['members'] as const,
  invitations: ['invitations'] as const,
  permissions: ['permissions'] as const,
  roles: (organizationId: string | null) => ['roles', organizationId] as const,
  rolesPaged: (organizationId: string | null, page: number, size: number) =>
    ['roles', organizationId, page, size] as const,
  role: (organizationId: string | null, roleId: string) =>
    ['roles', organizationId, roleId] as const,
  memberRoles: (organizationId: string | null, userId: string) =>
    ['member-roles', organizationId, userId] as const,
  auditLogs: (params?: unknown) => ['authorization-audit-logs', params ?? {}] as const,

  products: (page: number, size: number) => ['products', page, size] as const,
  product: (id: string) => ['products', id] as const,
  categories: (page: number, size: number) => ['categories', page, size] as const,
  priceLists: (page: number, size: number) => ['price-lists', page, size] as const,
  priceListPrices: (id: string, page: number, size: number) =>
    ['price-lists', id, 'prices', page, size] as const,
  barcodes: (productId: string, page: number, size: number) =>
    ['products', productId, 'barcodes', page, size] as const,

  customers: (params?: unknown) => ['customers', params ?? {}] as const,
  customer: (id: string) => ['customers', id] as const,
  customerBalance: (id: string) => ['customers', id, 'balance'] as const,

  sales: (params?: unknown) => ['sales', params ?? {}] as const,
  sale: (id: string) => ['sales', id] as const,
  receivables: (params?: unknown) => ['receivables', params ?? {}] as const,
  salePayments: (saleId: string) => ['sales', saleId, 'payments'] as const,

  suppliers: (page: number, size: number) => ['suppliers', page, size] as const,
  purchases: (params?: unknown) => ['purchases', params ?? {}] as const,
  purchase: (id: string) => ['purchases', id] as const,

  stock: (params?: unknown) => ['inventory', 'stock', params ?? {}] as const,
  movements: (params?: unknown) => ['inventory', 'movements', params ?? {}] as const,
  stockLocations: (page: number, size: number) => ['stock-locations', page, size] as const,
  adjustments: (page: number, size: number) => ['stock-adjustments', page, size] as const,
  transfers: (params?: unknown) => ['stock-transfers', params ?? {}] as const,

  registers: (params?: unknown) => ['pos', 'registers', params ?? {}] as const,
  shifts: (params?: unknown) => ['pos', 'shifts', params ?? {}] as const,
  shift: (id: string) => ['pos', 'shifts', id] as const,
  shiftCashMovements: (id: string) => ['pos', 'shifts', id, 'cash-movements'] as const,
  shiftReport: (id: string) => ['pos', 'shifts', id, 'report'] as const,
  posProduct: (barcode: string, registerId?: string | null) =>
    ['pos', 'product', barcode, registerId ?? ''] as const,
  receipt: (saleId: string) => ['sales', saleId, 'receipt'] as const,
  posDaily: (params?: unknown) => ['reports', 'pos', 'daily', params ?? {}] as const,

  salesReport: (params?: unknown) => ['reports', 'sales', params ?? {}] as const,
  consolidatedReport: (params?: unknown) =>
    ['reports', 'sales', 'consolidated', params ?? {}] as const,

  tenantBilling: ['billing', 'current'] as const,

  adminOrganizations: (params?: unknown) => ['admin', 'organizations', params ?? {}] as const,
  adminStats: ['admin', 'stats'] as const,
  adminOrganization: (id: string) => ['admin', 'organizations', id] as const,
  supportSummary: (id: string) => ['admin', 'organizations', id, 'support-summary'] as const,
  adminAuditLogs: (params?: unknown) => ['admin', 'audit-logs', params ?? {}] as const,
  plans: (page: number, size: number) => ['admin', 'plans', page, size] as const,
  plan: (id: string) => ['admin', 'plans', id] as const,
  subscription: (organizationId: string) => ['admin', 'subscription', organizationId] as const,
  subscriptions: (organizationId: string) => ['admin', 'subscriptions', organizationId] as const,
  invoices: (organizationId: string) =>
    ['admin', 'subscription', organizationId, 'invoices'] as const,
  invoicePayments: (organizationId: string, invoiceId: string) =>
    ['admin', 'subscription', organizationId, 'invoices', invoiceId, 'payments'] as const,
};
