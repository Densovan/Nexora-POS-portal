export function formatMoney(
  value: string | number | null | undefined,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: string | number | null | undefined, locale = 'en-US'): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(value: string | null | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: string | null | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function todayISO(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function startOfMonthISO(): string {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

export function titleize(value?: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const SUCCESS = new Set([
  'ACTIVE',
  'POSTED',
  'PAID',
  'RECEIVED',
  'COMPLETED',
  'LIVE',
  'APPROVED',
  'OPEN',
]);
const WARNING = new Set([
  'PENDING',
  'DRAFT',
  'TRIAL',
  'INVITED',
  'PARTIAL',
  'ORDERED',
  'PENDING_APPROVAL',
]);
const DANGER = new Set([
  'SUSPENDED',
  'CLOSED',
  'CANCELLED',
  'VOID',
  'VOIDED',
  'FAILED',
  'OVERDUE',
  'REVOKED',
  'REJECTED',
  'INACTIVE',
]);

export function statusTone(status?: string | null): StatusTone {
  if (!status) return 'neutral';
  const value = status.toUpperCase();
  if (SUCCESS.has(value)) return 'success';
  if (WARNING.has(value)) return 'warning';
  if (DANGER.has(value)) return 'danger';
  return 'neutral';
}

export function isNumeric(value: unknown): boolean {
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)))
  );
}
