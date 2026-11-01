import { useCallback, type ReactNode } from 'react';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (options: ToastOptions | string) => void;
}

const toastManager = ToastPrimitive.createToastManager();

const icons = {
  success: <CheckCircle2 className="size-4 text-emerald-500" />,
  error: <AlertCircle className="size-4 text-destructive" />,
  info: <Info className="size-4 text-primary" />,
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      className={cn(
        'pointer-events-auto w-full rounded-2xl border bg-popover p-3 pr-9 text-popover-foreground shadow-lg',
        item.type === 'error' && 'border-destructive/30',
        item.type === 'success' && 'border-emerald-200',
      )}
    >
      <ToastPrimitive.Content className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icons[item.type as ToastVariant] ?? icons.info}</span>
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="text-sm font-medium" />
          <ToastPrimitive.Description className="mt-0.5 text-xs text-muted-foreground" />
        </div>
        <ToastPrimitive.Close
          aria-label="Dismiss notification"
          className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} timeout={4500}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

export function useToast(): ToastContextValue {
  const manager = ToastPrimitive.useToastManager();

  const toast = useCallback(
    (options: ToastOptions | string) => {
      const value = typeof options === 'string' ? { title: options } : options;
      manager.add({
        title: value.title,
        description: value.description,
        type: value.variant ?? 'info',
      });
    },
    [manager],
  );

  return { toast };
}
