import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { usePosRegister } from '../registers/RegisterProvider';

export function RequireRegister({ children }: { children: ReactNode }) {
  const { register, isLoading } = usePosRegister();

  if (isLoading) {
    return (
      <Card>
        <LoadingState label="Loading register…" />
      </Card>
    );
  }

  if (!register) return <Navigate to="/register" replace />;

  return <>{children}</>;
}
