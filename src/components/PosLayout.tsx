import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  LogOut,
  MonitorSmartphone,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { posApi, queryKeys } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { usePermissions } from '@nexora/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast';
import { usePosRegister } from '../registers/RegisterProvider';

const navItems = [
  { to: '/sale', label: 'Sale', icon: ShoppingCart, permissions: ['sales.create'] },
  { to: '/shift', label: 'Shift', icon: Wallet, permissions: ['pos.shifts.view'] },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText, permissions: ['sales.view'] },
  {
    to: '/reports',
    label: 'Daily',
    icon: BarChart3,
    permissions: ['reports.sales.view', 'pos.shifts.view'],
  },
];

export function PosLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasAny } = usePermissions();
  const { register, clearRegister, refresh } = usePosRegister();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeShift = useQuery({
    queryKey: queryKeys.shifts({ registerId: register?.id ?? null, status: 'OPEN' }),
    queryFn: () => posApi.shifts({ registerId: register?.id, status: 'OPEN', page: 0, size: 1 }),
    enabled: Boolean(register),
    refetchInterval: 60_000,
  });

  const shift = activeShift.data?.items[0] ?? null;

  const signOut = async () => {
    setMenuOpen(false);
    await auth.logout();
    navigate('/login', { replace: true });
  };

  const changeRegister = () => {
    setMenuOpen(false);
    clearRegister();
    navigate('/register');
  };

  const refreshAll = () => {
    refresh();
    void activeShift.refetch();
    toast('Registers refreshed');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="no-print sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <Link to="/sale" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-900/30">
              N
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-tight">Nexora POS</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-500">
                {auth.organization?.name ?? 'Point of sale'}
              </span>
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-1 sm:ml-6">
            {navItems
              .filter((item) => hasAny(item.permissions))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                      isActive
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {register ? (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
                  <MonitorSmartphone className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs font-medium">{register.name}</span>
                  <span className="text-[11px] text-slate-400">{register.registerCode}</span>
                </div>
                {shift ? (
                  <Link to="/shift">
                    <Badge variant="success">Shift open</Badge>
                  </Link>
                ) : (
                  <Link to="/shift">
                    <Badge variant="warning">No shift</Badge>
                  </Link>
                )}
              </>
            ) : (
              <Badge variant="warning">No register</Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={refreshAll}
              aria-label="Refresh registers"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-semibold text-emerald-200">
                  {(auth.user?.fullName ?? auth.user?.email ?? '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-xs font-medium sm:block">
                  {auth.user?.fullName ?? auth.user?.email}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {auth.user?.fullName ?? 'Cashier'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
                      {shift && (
                        <span className="mt-2 inline-flex">
                          <StatusBadge status={shift.status} />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={changeRegister}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <MonitorSmartphone className="h-4 w-4" /> Change register
                    </button>
                    <button
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
