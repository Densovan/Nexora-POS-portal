import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { branchApi, queryKeys } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { usePermissions } from '@nexora/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { PageHeader } from '@/components/page-header';
import { usePosRegister } from '../../registers/RegisterProvider';

export function RegisterSelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { registers, register, isLoading, error, selectRegister, refresh } = usePosRegister();

  const branches = useQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchApi.list(0, 100),
    enabled: has('branches.view'),
  });

  const branchName = (branchId: string) =>
    branches.data?.items.find((branch) => branch.id === branchId)?.name ??
    `Branch ${branchId.slice(0, 8)}`;

  const choose = (next: (typeof registers)[number]) => {
    selectRegister(next);
    navigate('/sale');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Register"
        title="Choose your register"
        description="Each register is tied to a branch and stock location. Sales and shifts are recorded against it."
        actions={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <Card>
          <LoadingState label="Loading registers…" />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState title="Could not load registers" error={error} onRetry={refresh} />
        </Card>
      ) : registers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MonitorSmartphone className="h-5 w-5" />}
            title="No active registers"
            description={
              has('pos.registers.manage')
                ? 'Create a register from the organization portal, then refresh this page.'
                : 'Ask an administrator to assign an active register to your branch.'
            }
            action={
              <Button variant="outline" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
                Check again
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {registers.map((item) => {
            const selected = register?.id === item.id;
            return (
              <Card
                key={item.id}
                className={
                  selected
                    ? 'border-emerald-300 p-5 ring-2 ring-emerald-500/20'
                    : 'p-5 transition hover:border-slate-300'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MonitorSmartphone className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    {selected && <Badge variant="success">Selected</Badge>}
                    <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500">
                  {item.registerCode} · {branchName(item.branchId)}
                </p>
                <p className="mt-3 text-[11px] text-slate-400">
                  {auth.organization?.name ?? 'Organization'} · Stock location{' '}
                  {item.stockLocationId.slice(0, 8)}
                </p>
                <Button
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
                  onClick={() => choose(item)}
                >
                  {selected ? 'Continue to sale' : 'Use this register'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
