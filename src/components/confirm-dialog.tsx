import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <div className="text-sm text-slate-600">
          {description ?? 'This action cannot be undone.'}
        </div>

        <DialogFooter>
          {
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? 'danger' : 'primary'}
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
