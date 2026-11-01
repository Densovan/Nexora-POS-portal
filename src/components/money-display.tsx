import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

interface MoneyDisplayProps {
  value: string | number | null | undefined;
  currency?: string;
  locale?: string;
  className?: string;
  negativeClassName?: string;
}

export function MoneyDisplay({
  value,
  currency = 'USD',
  locale = 'en-US',
  className,
  negativeClassName = 'text-rose-600',
}: MoneyDisplayProps) {
  const amount = value === null || value === undefined ? null : Number(value);
  return (
    <span
      className={cn('tabular-nums', amount !== null && amount < 0 && negativeClassName, className)}
    >
      {formatMoney(value, currency, locale)}
    </span>
  );
}
