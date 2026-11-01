import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateRangeProps {
  from: string;
  to: string;
  onChange: (value: { from: string; to: string }) => void;
  className?: string;
}

export function DateRange({ from, to, onChange, className }: DateRangeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(event) => onChange({ from: event.target.value, to })}
        className="w-[150px]"
        aria-label="From date"
      />
      <span className="text-xs text-slate-400">to</span>
      <Input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(event) => onChange({ from, to: event.target.value })}
        className="w-[150px]"
        aria-label="To date"
      />
    </div>
  );
}
