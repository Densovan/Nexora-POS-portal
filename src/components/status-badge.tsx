import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusTone, titleize } from '@/lib/format';

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const tone = statusTone(status);
  return (
    <Badge variant={tone}>
      <span
        className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', {
          'bg-emerald-500': tone === 'success',
          'bg-amber-500': tone === 'warning',
          'bg-destructive': tone === 'danger',
          'bg-slate-400': tone === 'neutral',
        })}
      />
      {label ?? titleize(status)}
    </Badge>
  );
}
