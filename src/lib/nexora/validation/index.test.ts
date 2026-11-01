import { describe, expect, it } from 'vitest';
import { categorySchema, changePasswordSchema, loginSchema, roleSchema } from './index';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    expect(
      loginSchema.safeParse({ email: 'cashier@example.com', password: 'secret' }).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: 'secret' });
    expect(result.success).toBe(false);
  });
});

describe('categorySchema', () => {
  it('accepts a top-level category', () => {
    const result = categorySchema.safeParse({ name: ' Beverages ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Beverages');
  });

  it('rejects a non-uuid parent', () => {
    expect(categorySchema.safeParse({ name: 'Tea', parentId: '123' }).success).toBe(false);
  });
});

describe('roleSchema', () => {
  it('requires at least one permission', () => {
    expect(roleSchema.safeParse({ name: 'Shift lead', permissions: [] }).success).toBe(false);
    expect(
      roleSchema.safeParse({ name: 'Shift lead', permissions: ['pos.shifts.open'] }).success,
    ).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('requires matching confirmation', () => {
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'different-password',
    });
    expect(mismatch.success).toBe(false);

    const match = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
    expect(match.success).toBe(true);
  });
});
