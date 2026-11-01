import { describe, expect, it } from 'vitest';
import { formatMoney, formatNumber, initials, statusTone, titleize, todayISO } from './format';

describe('formatMoney', () => {
  it('formats numeric and string amounts', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney('10', 'EUR')).toBe('€10.00');
  });

  it('returns a dash for missing values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney('not-a-number')).toBe('—');
  });
});

describe('formatNumber', () => {
  it('limits fraction digits', () => {
    expect(formatNumber(1234.567)).toBe('1,234.57');
    expect(formatNumber('12')).toBe('12');
  });

  it('returns a dash for missing values', () => {
    expect(formatNumber(null)).toBe('—');
  });
});

describe('statusTone', () => {
  it('maps known statuses to tones', () => {
    expect(statusTone('ACTIVE')).toBe('success');
    expect(statusTone('PENDING')).toBe('warning');
    expect(statusTone('SUSPENDED')).toBe('danger');
    expect(statusTone('SOMETHING_ELSE')).toBe('neutral');
    expect(statusTone(null)).toBe('neutral');
  });
});

describe('text helpers', () => {
  it('builds initials from the first two words', () => {
    expect(initials('Dara Sok')).toBe('DS');
    expect(initials('')).toBe('?');
  });

  it('titleizes snake and kebab case', () => {
    expect(titleize('PARTIALLY_RECEIVED')).toBe('Partially Received');
    expect(titleize('safe-drop')).toBe('Safe Drop');
  });

  it('returns an ISO date for today', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
