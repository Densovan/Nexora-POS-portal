import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi, queryKeys } from '@nexora/api-client';
import type { PosRegister } from '@nexora/api-types';
import { useAuth } from '@nexora/auth';
import { usePermissions } from '@nexora/permissions';

const STORAGE_KEY = 'nexora.pos.registerId';

interface RegisterContextValue {
  registers: PosRegister[];
  register: PosRegister | null;
  isLoading: boolean;
  error: unknown;
  selectRegister: (register: PosRegister) => void;
  clearRegister: () => void;
  refresh: () => void;
}

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function RegisterProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { has } = usePermissions();
  const queryClient = useQueryClient();
  const [storedId, setStoredId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const registersQuery = useQuery({
    queryKey: queryKeys.registers({ branchId: auth.activeBranchId ?? undefined, status: 'ACTIVE' }),
    queryFn: () => posApi.registers({ status: 'ACTIVE' }),
    enabled: auth.status === 'authenticated' && has('pos.registers.view'),
  });

  const register = useMemo(
    () => registersQuery.data?.find((item) => item.id === storedId) ?? null,
    [registersQuery.data, storedId],
  );

  useEffect(() => {
    if (register && auth.activeBranchId !== register.branchId) {
      auth.setActiveBranch(register.branchId);
    }
  }, [register, auth]);

  const selectRegister = useCallback(
    (next: PosRegister) => {
      localStorage.setItem(STORAGE_KEY, next.id);
      setStoredId(next.id);
      auth.setActiveBranch(next.branchId);
      void queryClient.invalidateQueries();
    },
    [auth, queryClient],
  );

  const clearRegister = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredId(null);
    auth.setActiveBranch(null);
    void queryClient.invalidateQueries();
  }, [auth, queryClient]);

  const refresh = useCallback(() => {
    void registersQuery.refetch();
  }, [registersQuery]);

  const value = useMemo<RegisterContextValue>(
    () => ({
      registers: registersQuery.data ?? [],
      register,
      isLoading: registersQuery.isLoading,
      error: registersQuery.error,
      selectRegister,
      clearRegister,
      refresh,
    }),
    [
      registersQuery.data,
      registersQuery.isLoading,
      registersQuery.error,
      register,
      selectRegister,
      clearRegister,
      refresh,
    ],
  );

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}

export function usePosRegister() {
  const context = useContext(RegisterContext);
  if (!context) throw new Error('usePosRegister must be used inside <RegisterProvider>');
  return context;
}
