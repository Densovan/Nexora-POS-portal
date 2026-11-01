export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;
export type Money = number | string;

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Record<string, string>;
}

/* ------------------------------------------------------------------ auth */

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED' | string;

export interface UserView {
  id: UUID;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: UserStatus;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | string;
  businessMode: 'RETAIL' | 'WHOLESALE' | 'HYBRID' | 'FOOD_SERVICE' | string;
  defaultCurrency: string;
  defaultLocale: string;
  timezone: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
}

export interface Membership {
  id: UUID;
  organizationId: UUID;
  organizationName: string | null;
  organizationSlug: string | null;
  status: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: ISODateTime;
  refreshTokenExpiresAt: ISODateTime;
  user: UserView;
  organization: Organization | null;
  membership: Membership | null;
}

export interface MeResponse {
  user: UserView;
  organization: Organization | null;
  memberships: Membership[];
  organizationOwner?: boolean;
  features?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  businessMode?: 'RETAIL' | 'WHOLESALE' | 'HYBRID' | 'FOOD_SERVICE';
  currency?: string;
  timezone?: string;
}

export interface AcceptInvitationRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}

export interface ImageUploadResponse {
  filename: string;
  url: string;
  contentType: string;
  size: number;
}

/* -------------------------------------------------------------- tenancy */

export interface Branch {
  id: UUID;
  code: string;
  name: string;
  phone: string | null;
  address: string | null;
  timezone: string | null;
  status: string;
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  phone?: string;
  address?: string;
  timezone?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  status?: string;
}

export interface Member {
  membershipId: UUID;
  userId: UUID;
  email: string;
  fullName: string;
  status: string;
  role: string;
  joinedAt: ISODateTime | null;
}

export interface UpdateOrganizationRequest {
  name?: string;
  phone?: string;
  address?: string;
  defaultLocale?: string;
  timezone?: string;
  businessMode?: string;
  logoUrl?: string;
}

/* ---------------------------------------------------------- authorization */

export interface Permission {
  code: string;
  module: string;
  action: string;
  description: string;
}

export interface Role {
  id: UUID;
  organizationId: UUID;
  name: string;
  normalizedName: string;
  description: string | null;
  system: boolean;
  version: number;
  permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  version: number;
}

export interface RoleAssignment {
  id: UUID;
  userId: UUID;
  roleId: UUID;
  roleName: string;
  systemRole: boolean;
  branchId: UUID | null;
  assignedBy: UUID | null;
  assignedAt: ISODateTime;
}

export interface AssignRoleRequest {
  roleId: UUID;
  branchId?: UUID | null;
}

export interface AuthorizationAuditLog {
  id: UUID;
  actorUserId: UUID | null;
  action: string;
  targetType: string;
  targetId: UUID | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: ISODateTime;
}

/* ---------------------------------------------------------------- catalog */

export interface Category {
  id: UUID;
  name: string;
  parentId: UUID | null;
  active: boolean;
}

export interface Product {
  id: UUID;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  categoryId: UUID | null;
  unit: string | null;
  costPrice: string | null;
  sellingPrice: string | null;
  currency: string;
  trackInventory: boolean;
  allowFractionalQuantity: boolean;
  showOnMenu: boolean;
  active: boolean;
}

export interface OpeningStock {
  stockLocationId: UUID;
  quantity: number;
  notes?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  categoryId?: UUID | null;
  unit?: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  currency: string;
  trackInventory?: boolean;
  allowFractionalQuantity?: boolean;
  showOnMenu?: boolean;
  openingStock?: OpeningStock;
}

export interface UpdateProductRequest
  extends Partial<Omit<CreateProductRequest, 'currency' | 'openingStock'>> {
  active?: boolean;
}

export interface ProductAvailabilityOverride {
  productId: UUID;
  available: boolean;
}

export interface BranchAvailability {
  branchId: UUID;
  overrides: ProductAvailabilityOverride[];
}

export interface Barcode {
  id: UUID;
  productId: UUID;
  barcode: string;
  barcodeType: string;
}

export interface PriceList {
  id: UUID;
  name: string;
  code: string;
  currency: string;
  priceType: string;
  active: boolean;
}

export interface ProductPrice {
  id: UUID;
  priceListId: UUID;
  productId: UUID;
  unitPrice: string;
  minQuantity: string | null;
  validFrom: ISODateTime | null;
  validTo: ISODateTime | null;
}

/* ------------------------------------------------------------------- crm */

export interface Customer {
  id: UUID;
  customerCode: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  defaultPriceListId: UUID | null;
  creditLimit: string | null;
  creditCurrency: string | null;
  active: boolean;
  createdAt: ISODateTime;
}

export interface CreateCustomerRequest {
  customerCode?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  defaultPriceListId?: UUID | null;
  creditLimit?: number | null;
  creditCurrency?: string;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest> & { active?: boolean };

export interface CustomerBalance {
  customerId: UUID;
  balances: {
    currency: string;
    outstandingAmount: Money;
    overdueAmount: Money;
    invoiceCount: number;
  }[];
}

/* ---------------------------------------------------------------- sales */

export interface SaleItem {
  id: UUID;
  productId: UUID;
  sku: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  lineTotal: string;
  priceListId: UUID | null;
  unitCode: string | null;
}

export interface Sale {
  id: UUID;
  saleNumber: string;
  invoiceNumber: string | null;
  receiptNumber: string | null;
  branchId: UUID;
  stockLocationId: UUID;
  registerId: UUID | null;
  cashierShiftId: UUID | null;
  customerId: UUID | null;
  saleChannel: string;
  status: string;
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  returnedAmount: string;
  outstandingAmount: string;
  paymentStatus: string;
  dueDate: ISODate | null;
  soldAt: ISODateTime | null;
  postedAt: ISODateTime | null;
  createdBy: UUID | null;
  createdAt: ISODateTime;
  items: SaleItem[];
}

export interface SaleLineRequest {
  productId: UUID;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateSaleRequest {
  customerId?: UUID | null;
  branchId: UUID;
  stockLocationId: UUID;
  saleChannel?: string;
  currency: string;
  priceListId?: UUID | null;
  discountAmount?: number;
  dueDate?: string | null;
  idempotencyKey?: string;
  items: SaleLineRequest[];
}

export interface CustomerReceivable {
  saleId: UUID;
  saleNumber: string;
  invoiceNumber: string | null;
  customerId: UUID;
  customerName: string;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  dueDate: ISODate | null;
  soldAt: ISODateTime;
  overdue: boolean;
}

/* ---------------------------------------------------------------- payments */

export interface Tender {
  id: UUID;
  method: string;
  amount: string;
  currency: string;
  providerReference: string | null;
  status: string;
}

export interface PaymentAllocation {
  id: UUID;
  saleId: UUID;
  amountApplied: string;
}

export interface Payment {
  id: UUID;
  customerId: UUID | null;
  amount: string;
  currency: string;
  paymentType: string;
  status: string;
  externalReference: string | null;
  receivedAt: ISODateTime;
  createdAt: ISODateTime;
  tenders: Tender[];
  allocations: PaymentAllocation[];
}

export interface TenderRequest {
  method: string;
  amount: number;
  providerReference?: string;
}

export interface RecordPaymentRequest {
  customerId: UUID;
  amount: number;
  currency: string;
  tenders: TenderRequest[];
  allocations: { saleId: UUID; amount: number }[];
  externalReference?: string;
  idempotencyKey?: string;
}

/* ------------------------------------------------------------- purchasing */

export interface Supplier {
  id: UUID;
  supplierCode: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
}

export interface CreateSupplierRequest {
  supplierCode?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PurchaseItem {
  id: UUID;
  productId: UUID;
  descriptionSnapshot: string | null;
  orderedQuantity: string;
  receivedQuantity: string;
  unitCost: string;
  lineTotal: string;
}

export interface Purchase {
  id: UUID;
  purchaseNumber: string;
  supplierId: UUID;
  status: string;
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  orderedAt: ISODateTime | null;
  receivedAt: ISODateTime | null;
  createdBy: UUID | null;
  createdAt: ISODateTime;
  items: PurchaseItem[];
}

export interface CreatePurchaseRequest {
  supplierId: UUID;
  currency: string;
  discountAmount?: number;
  taxAmount?: number;
  items: {
    productId: UUID;
    orderedQuantity: number;
    unitCost: number;
    description?: string;
  }[];
}

/* -------------------------------------------------------------- inventory */

export interface StockLocation {
  id: UUID;
  branchId: UUID;
  code: string;
  name: string;
  locationType: string;
  status: string;
}

export interface StockReportRow {
  stockLocationId: UUID;
  stockLocationName: string;
  branchId: UUID;
  productId: UUID;
  sku: string;
  productName: string;
  unit: string | null;
  quantityOnHand: string;
  unitCost: string | null;
  stockValue: string | null;
}

export interface InventoryMovement {
  id: UUID;
  stockLocationId: UUID;
  productId: UUID;
  movementType: string;
  quantityDelta: string;
  referenceType: string | null;
  referenceId: UUID | null;
  unitCostSnapshot: string | null;
  notes: string | null;
  createdBy: UUID | null;
  createdAt: ISODateTime;
}

/* ------------------------------------------------------------------- pos */

export interface PosRegister {
  id: UUID;
  branchId: UUID;
  stockLocationId: UUID;
  registerCode: string;
  name: string;
  status: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface PosShift {
  id: UUID;
  branchId: UUID;
  registerId: UUID;
  openedBy: UUID | null;
  closedBy: UUID | null;
  openingCash: string;
  cashSales: string | null;
  cashRefunds: string | null;
  cashMovementNet: string | null;
  expectedCash: string | null;
  countedCash: string | null;
  cashDifference: string | null;
  status: string;
  openedAt: ISODateTime;
  closedAt: ISODateTime | null;
}

export interface CashMovement {
  id: UUID;
  movementType: string;
  amount: string;
  reason: string | null;
  createdBy: UUID | null;
  createdAt: ISODateTime;
}

export interface OpenShiftRequest {
  registerId: UUID;
  openingCash: number;
  note?: string;
}

export interface CloseShiftRequest {
  countedCash: number;
  note?: string;
}

export interface CashMovementRequest {
  movementType: string;
  amount: number;
  reason?: string;
}

export interface PosProduct {
  id: UUID;
  sku: string;
  name: string;
  unit: string | null;
  sellingPrice: string;
  currency: string;
  trackInventory: boolean;
  allowFractionalQuantity: boolean;
  barcode: string | null;
  stockLocationId: UUID | null;
  quantityOnHand: string | null;
}

export interface PosCheckoutLine {
  productId: UUID;
  barcode?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface PosCheckoutRequest {
  registerId: UUID;
  cashierShiftId: UUID;
  customerId?: UUID | null;
  priceListId?: UUID | null;
  currency?: string;
  discountAmount?: number;
  idempotencyKey?: string;
  items: PosCheckoutLine[];
  tenders: TenderRequest[];
}

export interface PosReceipt {
  sale: Sale;
  payments: Payment[];
}

/* -------------------------------------------------------------- reporting */

export interface BranchSalesSummary {
  branchId: UUID;
  branchName: string;
  saleCount: number;
  grossSales: Money;
  discounts: Money;
  returns: Money;
  netSales: Money;
  refunds: Money;
  averageSale: Money;
}

export interface SalesReport {
  from: ISODate;
  to: ISODate;
  organizationWide: boolean;
  saleCount: number;
  grossSales: Money;
  discounts: Money;
  returns: Money;
  netSales: Money;
  refunds: Money;
  averageSale: Money;
  branches: BranchSalesSummary[];
}

export interface TenderTotal {
  method: string;
  amount: Money;
}

export interface PosDailyReport {
  date: ISODate;
  branchId: UUID | null;
  saleCount: number;
  grossSales: Money;
  discounts: Money;
  netSales: Money;
  refunds: Money;
  averageSale: Money;
  tenders: TenderTotal[];
}

export interface ShiftReport {
  shift: PosShift;
  saleCount: number;
  grossSales: Money;
  discounts: Money;
  netSales: Money;
  tenders: TenderTotal[];
  cashMovements: CashMovement[];
}

/* --------------------------------------------------------------- platform */

export interface PlatformAuditLog {
  id: UUID;
  actorUserId: UUID | null;
  organizationId: UUID | null;
  action: string;
  entityType: string;
  entityId: UUID | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateTime;
}

export interface PlatformStats {
  pendingOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  activePlans: number;
}

export interface Entitlement {
  featureCode: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

export interface Plan {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: string;
  currency: string;
  billingInterval: string;
  maxUsers: number | null;
  maxProducts: number | null;
  maxBranches: number | null;
  maxRegisters: number | null;
  active: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  entitlements: Entitlement[];
}

export interface PlanRequest {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  currency: string;
  billingInterval?: string;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxBranches?: number | null;
  maxRegisters?: number | null;
  active?: boolean;
}

export interface PlanEntitlementsRequest {
  entitlements: Entitlement[];
}

export interface Subscription {
  id: UUID;
  organizationId: UUID;
  plan: { id: UUID; code: string; name: string } | null;
  status: string;
  live: boolean;
  startedAt: ISODateTime;
  trialEndsAt: ISODateTime | null;
  currentPeriodStart: ISODateTime;
  currentPeriodEnd: ISODateTime;
  cancelAtPeriodEnd: boolean;
  cancelledAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface SubscriptionInvoice {
  id: UUID;
  organizationId: UUID;
  subscriptionId: UUID;
  invoiceNumber: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  remaining: string;
  status: string;
  issuedAt: ISODateTime;
  dueAt: ISODateTime;
  paidAt: ISODateTime | null;
}

export interface SubscriptionPayment {
  id: UUID;
  organizationId: UUID;
  subscriptionInvoiceId: UUID;
  amount: string;
  currency: string;
  method: string;
  providerReference: string | null;
  status: string;
  paidAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface SupportSummary {
  organization: Organization;
  ownerEmail: string | null;
  members: number;
  activeMembers: number;
  branches: number;
  products: number;
  registers: number;
  openShifts: number;
  plan: { id: UUID; code: string; name: string } | null;
  subscription: {
    id: UUID;
    status: string;
    currentPeriodStart: ISODateTime;
    currentPeriodEnd: ISODateTime;
    trialEndsAt: ISODateTime | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  recentAudit: PlatformAuditLog[];
}

export interface TenantBilling {
  subscription: {
    id: UUID;
    status: string;
    live: boolean;
    trialEndsAt: ISODateTime | null;
    currentPeriodStart: ISODateTime;
    currentPeriodEnd: ISODateTime;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: {
    id: UUID;
    code: string;
    name: string;
    monthlyPrice: string;
    currency: string;
    billingInterval: string;
  } | null;
  limits: {
    maxUsers: number | null;
    maxProducts: number | null;
    maxBranches: number | null;
    maxRegisters: number | null;
  } | null;
  features: string[];
  usage: { users: number; branches: number; products: number; registers: number } | null;
}

export interface RecordSubscriptionPaymentRequest {
  amount: number;
  method: string;
  providerReference?: string;
  idempotencyKey?: string;
}
