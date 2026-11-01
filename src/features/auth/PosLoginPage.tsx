import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, MonitorSmartphone, Printer, ScanBarcode, ShieldCheck } from 'lucide-react';
import { getApiErrorMessage } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginFormValues } from '@nexora/validation';

const highlights = [
  {
    icon: ScanBarcode,
    title: 'Scan to sell',
    copy: 'Barcode and SKU lookup with live stock hints.',
  },
  {
    icon: Printer,
    title: 'Print receipts',
    copy: 'Receipt-ready layout for 80mm thermal printers.',
  },
  {
    icon: ShieldCheck,
    title: 'Cash controls',
    copy: 'Shifts, cash movements, and expected-drawer totals.',
  },
];

export function PosLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (auth.status === 'authenticated') return <Navigate to="/sale" replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await auth.login(values);
      navigate('/sale', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  });

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-base font-bold">
              N
            </span>
            <div>
              <p className="text-sm font-semibold">Nexora POS</p>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">
                Fast checkout for your counter
              </p>
            </div>
          </div>
          <h2 className="mt-14 max-w-md text-3xl font-semibold leading-tight">
            Ring up sales, take payment, and close the drawer with confidence.
          </h2>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Built for touch screens and scanners. Every sale is tied to your register and cashier
            shift, so reconciliation stays clean.
          </p>
          <div className="mt-10 max-w-md space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <item.icon className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <p className="text-xs font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-slate-500">
          {new Date().getFullYear()} Nexora. Ask an administrator for a cashier account.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              N
            </span>
            <span className="text-sm font-semibold text-slate-900">Nexora POS</span>
          </div>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <MonitorSmartphone className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to the register</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use the staff account your organization issued. Cashier accounts can sell and run
            shifts; managers can also apply discounts.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            <FormField
              label="Work email"
              htmlFor="email"
              error={form.formState.errors.email?.message}
              required
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="cashier@company.com"
                autoFocus
                {...form.register('email')}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              error={form.formState.errors.password?.message}
              required
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register('password')}
              />
            </FormField>

            {formError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
              size="lg"
              loading={form.formState.isSubmitting}
            >
              <KeyRound className="h-4 w-4" />
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
