import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Skeleton({ className }: { className?: string }) {
  return <ShadcnSkeleton className={cn('bg-slate-100', className)} />;
}

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="ml-auto h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Please try again.';
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
