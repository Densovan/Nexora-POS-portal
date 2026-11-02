import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

export interface ShellNavItem {
  to: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  end?: boolean;
}

export interface ShellNavGroup {
  label: string;
  items: ShellNavItem[];
}

interface AppShellProps {
  brand: string;
  brandSubtitle?: string;
  nav: ShellNavGroup[];
  user: { name: string; email: string; role?: string | null };
  onLogout: () => void;
  children: ReactNode;
  organizationSwitcher?: ReactNode;
  branchSwitcher?: ReactNode;
  headerActions?: ReactNode;
  accent?: 'indigo' | 'emerald' | 'amber';
  maxWidth?: string;
}

const accents = {
  indigo: 'from-indigo-500 to-violet-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
};

export function AppShell({
  brand,
  brandSubtitle,
  nav,
  user,
  onLogout,
  children,
  organizationSwitcher,
  branchSwitcher,
  headerActions,
  accent = 'indigo',
  maxWidth = 'max-w-[1440px]',
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (close?: () => void) => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center gap-3 px-5">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-lg',
            accents[accent],
          )}
        >
          N
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{brand}</p>
          {brandSubtitle && (
            <p className="truncate text-[11px] uppercase tracking-wider text-slate-500">
              {brandSubtitle}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={close}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                        isActive
                          ? 'bg-white/10 font-medium text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                      )
                    }
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.role ?? user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar()}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 border-0 bg-slate-950 p-0 text-slate-300 sm:max-w-none"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">{brand} navigation</SheetTitle>
          <SheetDescription className="sr-only">Primary application navigation</SheetDescription>
          {sidebar(() => setMobileOpen(false))}
        </SheetContent>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className={cn('mx-auto flex h-16 items-center gap-3 px-4 sm:px-6', maxWidth)}>
              <SheetTrigger
                render={
                  <button
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                {organizationSwitcher}
                {branchSwitcher}
              </div>

              <div className="flex items-center gap-3">
                {headerActions}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-left transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    }
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-indigo-50 text-[11px] font-semibold text-indigo-600">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-medium text-slate-700 sm:block">
                      {user.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={<Link to="/settings/profile" className="cursor-pointer" />}
                      >
                        <UserRound className="mr-2 h-4 w-4" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onLogout}
                        className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        </div>
      </Sheet>

      <div className="lg:pl-64">
        <main className={cn('mx-auto px-4 py-6 sm:px-6', maxWidth)}>{children}</main>
      </div>
    </div>
  );
}
