import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const tones = {
  indigo: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
};

export function MetricCard({ label, value, hint, icon, tone = 'indigo' }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              tones[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
