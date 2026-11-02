import type { ReactNode } from 'react';
import { LockKeyhole, LogOut } from 'lucide-react';
import { useAuth } from '@nexora/auth';
import { Button } from '@/components/ui/button';

export function RequireFeature({ feature, children }: { feature: string; children: ReactNode }) {
  const auth = useAuth();
  if (auth.hasFeature(feature)) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
          <LockKeyhole className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          POS unavailable
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">This plan does not include POS</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Ask the organization owner to add the POS feature to the subscription. Registers, shifts,
          and sales stay locked until it is enabled.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => void auth.refresh()}>
            Check again
          </Button>
          <Button
            variant="ghost"
            className="text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={() => void auth.logout()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
