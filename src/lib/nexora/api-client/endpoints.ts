import type {
  AcceptInvitationRequest,
  AssignRoleRequest,
  AuthResponse,
  AuthorizationAuditLog,
  Barcode,
  Branch,
  Category,
  ChangePasswordRequest,
  CloseShiftRequest,
  CreateBranchRequest,
  CreateCustomerRequest,
  CreateProductRequest,
  CreatePurchaseRequest,
  CreateRoleRequest,
  CreateSaleRequest,
  CreateSupplierRequest,
  Customer,
  CustomerBalance,
  CustomerReceivable,
  InventoryMovement,
  LoginRequest,
  MeResponse,
  Member,
  OpenShiftRequest,
  PageResponse,
  Payment,
  Permission,
  Plan,
  PlanEntitlementsRequest,
  PlanRequest,
  PlatformStats,
  PosCheckoutRequest,
  PosDailyReport,
  PosProduct,
  PosReceipt,
  PosRegister,
  PosShift,
  PriceList,
  Product,
  ProductPrice,
  Purchase,
  RecordPaymentRequest,
  RecordSubscriptionPaymentRequest,
  RegisterRequest,
  Role,
  RoleAssignment,
  Sale,
  SalesReport,
  ShiftReport,
  StockLocation,
  StockReportRow,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPayment,
  Supplier,
  SupportSummary,
  TenantBilling,
  TenderRequest,
  UpdateBranchRequest,
  UpdateCustomerRequest,
  UpdateOrganizationRequest,
  UpdateProductRequest,
  UpdateRoleRequest,
  UUID,
} from '@nexora/api-types';
import { api } from './client';

type ListParams = Record<string, string | number | boolean | undefined | null>;

export const authApi = {
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  register: (body: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  acceptInvitation: (body: AcceptInvitationRequest) =>
    api.post<AuthResponse>('/auth/invitations/accept', body).then((r) => r.data),
  me: () => api.get<MeResponse>('/auth/me').then((r) => r.data),
  permissions: () => api.get<string[]>('/auth/me/permissions').then((r) => r.data),
  logout: () => api.post<void>('/auth/logout').then((r) => r.data),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<void>('/auth/password', body).then((r) => r.data),
};

export const organizationApi = {
  current: () => api.get('/organizations/current').then((r) => r.data),
  updateCurrent: (body: UpdateOrganizationRequest) =>
    api.patch('/organizations/current', body).then((r) => r.data),
  members: () => api.get<Member[]>('/organizations/current/members').then((r) => r.data),
  invite: (email: string) =>
    api.post<Member>('/organizations/current/invitations', { email }).then((r) => r.data),
  revokeMember: (userId: UUID) =>
    api.delete<void>(`/organizations/current/members/${userId}`).then((r) => r.data),
};

export const branchApi = {
  list: (page = 0, size = 100) =>
    api.get<PageResponse<Branch>>('/branches', { params: { page, size } }).then((r) => r.data),
  get: (id: UUID) => api.get<Branch>(`/branches/${id}`).then((r) => r.data),
  create: (body: CreateBranchRequest) => api.post<Branch>('/branches', body).then((r) => r.data),
  update: (id: UUID, body: UpdateBranchRequest) =>
    api.patch<Branch>(`/branches/${id}`, body).then((r) => r.data),
};

export const roleApi = {
  permissions: () => api.get<Permission[]>('/permissions').then((r) => r.data),
  list: (organizationId: UUID, page = 0, size = 100) =>
    api
      .get<PageResponse<Role>>(`/organizations/${organizationId}/roles`, { params: { page, size } })
      .then((r) => r.data),
  get: (organizationId: UUID, roleId: UUID) =>
    api.get<Role>(`/organizations/${organizationId}/roles/${roleId}`).then((r) => r.data),
  create: (organizationId: UUID, body: CreateRoleRequest) =>
    api.post<Role>(`/organizations/${organizationId}/roles`, body).then((r) => r.data),
  update: (organizationId: UUID, roleId: UUID, body: UpdateRoleRequest) =>
    api.put<Role>(`/organizations/${organizationId}/roles/${roleId}`, body).then((r) => r.data),
  remove: (organizationId: UUID, roleId: UUID) =>
    api.delete<void>(`/organizations/${organizationId}/roles/${roleId}`).then((r) => r.data),
  memberRoles: (organizationId: UUID, userId: UUID) =>
    api
      .get<RoleAssignment[]>(`/organizations/${organizationId}/members/${userId}/roles`)
      .then((r) => r.data),
  assign: (organizationId: UUID, userId: UUID, body: AssignRoleRequest) =>
    api
      .post<RoleAssignment>(`/organizations/${organizationId}/members/${userId}/roles`, body)
      .then((r) => r.data),
  unassign: (organizationId: UUID, userId: UUID, assignmentId: UUID) =>
    api
      .delete<void>(`/organizations/${organizationId}/members/${userId}/roles/${assignmentId}`)
      .then((r) => r.data),
  auditLogs: (params: ListParams = {}) =>
    api
      .get<PageResponse<AuthorizationAuditLog>>('/authorization/audit-logs', { params })
      .then((r) => r.data),
};

export const catalogApi = {
  products: (page = 0, size = 20) =>
    api.get<PageResponse<Product>>('/products', { params: { page, size } }).then((r) => r.data),
  product: (id: UUID) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  createProduct: (body: CreateProductRequest) =>
    api.post<Product>('/products', body).then((r) => r.data),
  updateProduct: (id: UUID, body: UpdateProductRequest) =>
    api.patch<Product>(`/products/${id}`, body).then((r) => r.data),
  barcodes: (productId: UUID, page = 0, size = 50) =>
    api
      .get<PageResponse<Barcode>>(`/products/${productId}/barcodes`, { params: { page, size } })
      .then((r) => r.data),
  addBarcode: (productId: UUID, body: { barcode: string; barcodeType?: string }) =>
    api.post<Barcode>(`/products/${productId}/barcodes`, body).then((r) => r.data),
  categories: (page = 0, size = 100) =>
    api
      .get<PageResponse<Category>>('/product-categories', { params: { page, size } })
      .then((r) => r.data),
  createCategory: (body: { name: string; parentId?: UUID | null }) =>
    api.post<Category>('/product-categories', body).then((r) => r.data),
  updateCategory: (id: UUID, body: { name?: string; parentId?: UUID | null; active?: boolean }) =>
    api.patch<Category>(`/product-categories/${id}`, body).then((r) => r.data),
  priceLists: (page = 0, size = 100) =>
    api
      .get<PageResponse<PriceList>>('/price-lists', { params: { page, size } })
      .then((r) => r.data),
  createPriceList: (body: { name: string; code: string; currency: string; priceType?: string }) =>
    api.post<PriceList>('/price-lists', body).then((r) => r.data),
  updatePriceList: (
    id: UUID,
    body: { name?: string; currency?: string; priceType?: string; active?: boolean },
  ) => api.patch<PriceList>(`/price-lists/${id}`, body).then((r) => r.data),
  prices: (priceListId: UUID, page = 0, size = 100) =>
    api
      .get<PageResponse<ProductPrice>>(`/price-lists/${priceListId}/prices`, {
        params: { page, size },
      })
      .then((r) => r.data),
  addPrice: (
    priceListId: UUID,
    body: {
      productId: UUID;
      unitPrice: number;
      minQuantity?: number;
      validFrom?: string;
      validTo?: string;
    },
  ) => api.post<ProductPrice>(`/price-lists/${priceListId}/prices`, body).then((r) => r.data),
};

export const customerApi = {
  list: (params: { search?: string; active?: boolean; page?: number; size?: number } = {}) =>
    api.get<PageResponse<Customer>>('/customers', { params }).then((r) => r.data),
  get: (id: UUID) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (body: CreateCustomerRequest) =>
    api.post<Customer>('/customers', body).then((r) => r.data),
  update: (id: UUID, body: UpdateCustomerRequest) =>
    api.patch<Customer>(`/customers/${id}`, body).then((r) => r.data),
  balance: (id: UUID) => api.get<CustomerBalance>(`/customers/${id}/balance`).then((r) => r.data),
};

export const salesApi = {
  list: (
    params: {
      status?: string;
      channel?: string;
      customerId?: UUID;
      branchId?: UUID;
      from?: string;
      to?: string;
      page?: number;
      size?: number;
    } = {},
  ) => api.get<PageResponse<Sale>>('/sales', { params }).then((r) => r.data),
  get: (id: UUID) => api.get<Sale>(`/sales/${id}`).then((r) => r.data),
  create: (body: CreateSaleRequest) => api.post<Sale>('/sales', body).then((r) => r.data),
  post: (id: UUID) => api.post<Sale>(`/sales/${id}/post`).then((r) => r.data),
  void: (id: UUID) => api.post<Sale>(`/sales/${id}/void`).then((r) => r.data),
  invoicePdf: (id: UUID) =>
    api.get<Blob>(`/sales/${id}/invoice.pdf`, { responseType: 'blob' }).then((r) => r.data),
  recordPayment: (saleId: UUID, body: { amount: number; tenders: TenderRequest[] }) =>
    api.post<Payment>(`/sales/${saleId}/payments`, body).then((r) => r.data),
};

export const supplierApi = {
  list: (page = 0, size = 100) =>
    api.get<PageResponse<Supplier>>('/suppliers', { params: { page, size } }).then((r) => r.data),
  get: (id: UUID) => api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data),
  create: (body: CreateSupplierRequest) =>
    api.post<Supplier>('/suppliers', body).then((r) => r.data),
  update: (id: UUID, body: Partial<CreateSupplierRequest> & { active?: boolean }) =>
    api.patch<Supplier>(`/suppliers/${id}`, body).then((r) => r.data),
};

export const purchaseApi = {
  list: (params: { supplierId?: UUID; status?: string; page?: number; size?: number } = {}) =>
    api.get<PageResponse<Purchase>>('/purchases', { params }).then((r) => r.data),
  get: (id: UUID) => api.get<Purchase>(`/purchases/${id}`).then((r) => r.data),
  create: (body: CreatePurchaseRequest) =>
    api.post<Purchase>('/purchases', body).then((r) => r.data),
  order: (id: UUID) => api.post<Purchase>(`/purchases/${id}/order`).then((r) => r.data),
  receive: (
    id: UUID,
    body: { stockLocationId: UUID; lines: { purchaseItemId: UUID; receivedQuantity: number }[] },
  ) => api.post<Purchase>(`/purchases/${id}/receive`, body).then((r) => r.data),
  cancel: (id: UUID) => api.post<Purchase>(`/purchases/${id}/cancel`).then((r) => r.data),
};

export const inventoryApi = {
  stock: (
    params: {
      locationId?: UUID;
      productId?: UUID;
      maxQuantity?: number;
      page?: number;
      size?: number;
    } = {},
  ) => api.get<PageResponse<StockReportRow>>('/inventory/stock', { params }).then((r) => r.data),
  movements: (
    params: {
      locationId?: UUID;
      productId?: UUID;
      movementType?: string;
      page?: number;
      size?: number;
    } = {},
  ) =>
    api
      .get<PageResponse<InventoryMovement>>('/inventory/movements', { params })
      .then((r) => r.data),
  locations: (page = 0, size = 100) =>
    api
      .get<PageResponse<StockLocation>>('/inventory/locations', { params: { page, size } })
      .then((r) => r.data),
  createLocation: (body: { branchId?: UUID; code: string; name: string; locationType?: string }) =>
    api.post<StockLocation>('/inventory/locations', body).then((r) => r.data),
  updateLocation: (
    id: UUID,
    body: { name?: string; branchId?: UUID; locationType?: string; status?: string },
  ) => api.patch<StockLocation>(`/inventory/locations/${id}`, body).then((r) => r.data),
  adjustments: (page = 0, size = 20) =>
    api
      .get<PageResponse<Record<string, unknown>>>('/inventory/adjustments', {
        params: { page, size },
      })
      .then((r) => r.data),
  createAdjustment: (body: {
    stockLocationId: UUID;
    reason?: string;
    items: { productId: UUID; quantityDelta: number; notes?: string }[];
  }) => api.post('/inventory/adjustments', body).then((r) => r.data),
  postAdjustment: (id: UUID) => api.post(`/inventory/adjustments/${id}/post`).then((r) => r.data),
  transfers: (params: { branchId?: UUID; status?: string; page?: number; size?: number } = {}) =>
    api
      .get<PageResponse<Record<string, unknown>>>('/inventory/transfers', { params })
      .then((r) => r.data),
};

export const posApi = {
  registers: (params: { branchId?: UUID; status?: string } = {}) =>
    api.get<PosRegister[]>('/pos/registers', { params }).then((r) => r.data),
  createRegister: (body: {
    branchId: UUID;
    stockLocationId: UUID;
    registerCode: string;
    name: string;
  }) => api.post<PosRegister>('/pos/registers', body).then((r) => r.data),
  updateRegister: (id: UUID, body: { name?: string; stockLocationId?: UUID; status?: string }) =>
    api.patch<PosRegister>(`/pos/registers/${id}`, body).then((r) => r.data),
  lookupProduct: (barcode: string, registerId?: UUID | null) =>
    api
      .get<PosProduct>(`/pos/products/barcode/${encodeURIComponent(barcode)}`, {
        params: registerId ? { registerId } : undefined,
      })
      .then((r) => r.data),
  checkout: (body: PosCheckoutRequest, idempotencyKey: string) =>
    api
      .post<PosReceipt>('/pos/sales', body, { headers: { 'Idempotency-Key': idempotencyKey } })
      .then((r) => r.data),
  receipt: (saleId: UUID) => api.get<PosReceipt>(`/sales/${saleId}/receipt`).then((r) => r.data),
  shifts: (
    params: {
      registerId?: UUID;
      branchId?: UUID;
      status?: string;
      page?: number;
      size?: number;
    } = {},
  ) => api.get<PageResponse<PosShift>>('/pos/shifts', { params }).then((r) => r.data),
  shift: (id: UUID) => api.get<PosShift>(`/pos/shifts/${id}`).then((r) => r.data),
  openShift: (body: OpenShiftRequest) =>
    api.post<PosShift>('/pos/shifts/open', body).then((r) => r.data),
  closeShift: (id: UUID, body: CloseShiftRequest) =>
    api.post<PosShift>(`/pos/shifts/${id}/close`, body).then((r) => r.data),
  cashMovements: (id: UUID) => api.get(`/pos/shifts/${id}/cash-movements`).then((r) => r.data),
  recordCashMovement: (id: UUID, body: { movementType: string; amount: number; reason?: string }) =>
    api.post(`/pos/shifts/${id}/cash-movements`, body).then((r) => r.data),
  dailyReport: (params: { branchId?: UUID; date?: string } = {}) =>
    api.get<PosDailyReport>('/reports/pos/daily', { params }).then((r) => r.data),
  shiftReport: (id: UUID) => api.get<ShiftReport>(`/reports/pos/shifts/${id}`).then((r) => r.data),
};

export const reportApi = {
  sales: (params: { branchId?: UUID; from?: string; to?: string } = {}) =>
    api.get<SalesReport>('/reports/sales', { params }).then((r) => r.data),
  consolidated: (params: { from?: string; to?: string } = {}) =>
    api.get<SalesReport>('/reports/sales/consolidated', { params }).then((r) => r.data),
  receivables: (
    params: {
      customerId?: UUID;
      overdueOnly?: boolean;
      page?: number;
      size?: number;
    } = {},
  ) =>
    api
      .get<PageResponse<CustomerReceivable>>('/reports/receivables', { params })
      .then((r) => r.data),
};

export const paymentApi = {
  record: (body: RecordPaymentRequest) => api.post<Payment>('/payments', body).then((r) => r.data),
  get: (id: UUID) => api.get<Payment>(`/payments/${id}`).then((r) => r.data),
  forSale: (saleId: UUID) => api.get<Payment[]>(`/sales/${saleId}/payments`).then((r) => r.data),
};

export const billingApi = {
  current: () => api.get<TenantBilling>('/organizations/current/subscription').then((r) => r.data),
};

export const platformApi = {
  stats: () => api.get<PlatformStats>('/admin/stats').then((r) => r.data),
  organizations: (params: { status?: string; page?: number; size?: number } = {}) =>
    api
      .get<
        PageResponse<import('@nexora/api-types').Organization>
      >('/admin/organizations', { params })
      .then((r) => r.data),
  organization: (id: UUID) =>
    api
      .get<import('@nexora/api-types').Organization>(`/admin/organizations/${id}`)
      .then((r) => r.data),
  approve: (id: UUID, reason?: string) =>
    api.post(`/admin/organizations/${id}/approve`, { reason }).then((r) => r.data),
  reject: (id: UUID, reason?: string) =>
    api.post(`/admin/organizations/${id}/reject`, { reason }).then((r) => r.data),
  suspend: (id: UUID, reason?: string) =>
    api.post(`/admin/organizations/${id}/suspend`, { reason }).then((r) => r.data),
  activate: (id: UUID, reason?: string) =>
    api.post(`/admin/organizations/${id}/activate`, { reason }).then((r) => r.data),
  auditLogs: (
    params: {
      organizationId?: UUID;
      action?: string;
      from?: string;
      to?: string;
      page?: number;
      size?: number;
    } = {},
  ) =>
    api
      .get<
        PageResponse<import('@nexora/api-types').PlatformAuditLog>
      >('/admin/audit-logs', { params })
      .then((r) => r.data),
  supportSummary: (organizationId: UUID) =>
    api
      .get<SupportSummary>(`/admin/organizations/${organizationId}/support-summary`)
      .then((r) => r.data),
  plans: (page = 0, size = 50) =>
    api.get<PageResponse<Plan>>('/admin/plans', { params: { page, size } }).then((r) => r.data),
  plan: (id: UUID) => api.get<Plan>(`/admin/plans/${id}`).then((r) => r.data),
  createPlan: (body: PlanRequest) => api.post<Plan>('/admin/plans', body).then((r) => r.data),
  updatePlan: (id: UUID, body: PlanRequest) =>
    api.put<Plan>(`/admin/plans/${id}`, body).then((r) => r.data),
  replaceEntitlements: (id: UUID, body: PlanEntitlementsRequest) =>
    api.put<Plan>(`/admin/plans/${id}/entitlements`, body).then((r) => r.data),
  subscription: (organizationId: UUID) =>
    api
      .get<Subscription | null>(`/admin/organizations/${organizationId}/subscription`)
      .then((r) => r.data),
  subscriptions: (organizationId: UUID) =>
    api
      .get<Subscription[]>(`/admin/organizations/${organizationId}/subscriptions`)
      .then((r) => r.data),
  assignSubscription: (organizationId: UUID, body: { planId: UUID; trialDays?: number }) =>
    api
      .post<Subscription>(`/admin/organizations/${organizationId}/subscription`, body)
      .then((r) => r.data),
  changePlan: (organizationId: UUID, planId: UUID) =>
    api
      .post<Subscription>(`/admin/organizations/${organizationId}/subscription/change-plan`, {
        planId,
      })
      .then((r) => r.data),
  cancelSubscription: (organizationId: UUID, body: { immediate?: boolean; reason?: string }) =>
    api
      .post<Subscription>(`/admin/organizations/${organizationId}/subscription/cancel`, body)
      .then((r) => r.data),
  resumeSubscription: (organizationId: UUID) =>
    api
      .post<Subscription>(`/admin/organizations/${organizationId}/subscription/resume`)
      .then((r) => r.data),
  renewSubscription: (organizationId: UUID) =>
    api.post(`/admin/organizations/${organizationId}/subscription/renew`).then((r) => r.data),
  invoices: (organizationId: UUID) =>
    api
      .get<SubscriptionInvoice[]>(`/admin/organizations/${organizationId}/subscription/invoices`)
      .then((r) => r.data),
  invoicePayments: (organizationId: UUID, invoiceId: UUID) =>
    api
      .get<
        SubscriptionPayment[]
      >(`/admin/organizations/${organizationId}/subscription/invoices/${invoiceId}/payments`)
      .then((r) => r.data),
  recordInvoicePayment: (
    organizationId: UUID,
    invoiceId: UUID,
    body: RecordSubscriptionPaymentRequest,
  ) =>
    api
      .post(
        `/admin/organizations/${organizationId}/subscription/invoices/${invoiceId}/payments`,
        body,
      )
      .then((r) => r.data),
};
