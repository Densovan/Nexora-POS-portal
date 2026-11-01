import { z } from 'zod';

export const currencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, 'Use a three-letter currency code such as USD');

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(150),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').max(100),
  organizationName: z.string().trim().min(2, 'Enter a business name').max(200),
  businessMode: z.enum(['RETAIL', 'WHOLESALE', 'HYBRID']),
  currency: currencySchema,
  timezone: z.string().max(50).optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(100),
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unit: z.string().max(30).optional(),
  costPrice: z.coerce.number().min(0, 'Cannot be negative').optional(),
  sellingPrice: z.coerce.number().min(0, 'Cannot be negative').optional(),
  currency: currencySchema,
  trackInventory: z.boolean().default(true),
  allowFractionalQuantity: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  parentId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

export const customerSchema = z.object({
  customerCode: z.string().max(50).optional(),
  name: z.string().trim().min(1, 'Name is required').max(255),
  phone: z.string().max(50).optional(),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  address: z.string().max(2000).optional(),
  defaultPriceListId: z.string().uuid().nullable().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  creditCurrency: currencySchema.optional(),
});

export const supplierSchema = z.object({
  supplierCode: z.string().max(50).optional(),
  name: z.string().trim().min(1, 'Name is required').max(255),
  phone: z.string().max(50).optional(),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  address: z.string().max(5000).optional(),
});

export const branchSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(50),
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().max(50).optional(),
  address: z.string().max(2000).optional(),
  timezone: z.string().max(50).optional(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
});

export const planSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000).optional(),
  monthlyPrice: z.coerce.number().min(0),
  currency: currencySchema,
  billingInterval: z.enum(['MONTHLY', 'YEARLY']).optional(),
  maxUsers: z.coerce.number().int().min(0).nullable().optional(),
  maxProducts: z.coerce.number().int().min(0).nullable().optional(),
  maxBranches: z.coerce.number().int().min(0).nullable().optional(),
  maxRegisters: z.coerce.number().int().min(0).nullable().optional(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters').max(100),
    confirmPassword: z.string().min(8, 'Confirm the new password'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ProductFormValues = z.infer<typeof productSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CustomerFormValues = z.infer<typeof customerSchema>;
export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type BranchFormValues = z.infer<typeof branchSchema>;
export type RoleFormValues = z.infer<typeof roleSchema>;
export type PlanFormValues = z.infer<typeof planSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
