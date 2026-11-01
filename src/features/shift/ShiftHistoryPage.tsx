import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, History } from 'lucide-react';
import { posApi, queryKeys } from '@nexora/api-client';
import type { PosShift } from '@nexora/api-types';
import { useAuth } from '@nexora/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime, formatMoney } from '@/lib/format';
import { usePosRegister } from '../../registers/RegisterProvider';
import { RequireRegister } from '../../components/RequireRegister';

const PAGE_SIZE = 20;

export function ShiftHistoryPage() {
  return (
    <RequireRegister>
      <ShiftHistoryWorkspace />
    </RequireRegister>
  );
}

function ShiftHistoryWorkspace() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { register } = usePosRegister();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const currency = auth.organization?.defaultCurrency ?? 'USD';
  const money = (value: string | number | null | undefined) => formatMoney(value, currency);

  const params = {
    registerId: register?.id,
    status: status || undefined,
    page,
    size: PAGE_SIZE,
  };

  const shifts = useQuery({
    queryKey: queryKeys.shifts(params),
    queryFn: () => posApi.shifts(params),
    enabled: Boolean(register),
  });

  const columns: ColumnDef<PosShift>[] = [
    {
      accessorKey: 'openedAt',
      header: 'Opened',
      cell: ({ row }) => (
        <span className="text-slate-600">{formatDateTime(row.original.openedAt)}</span>
      ),
    },
    {
      accessorKey: 'closedAt',
      header: 'Closed',
      cell: ({ row }) => (
        <span className="text-slate-500">{formatDateTime(row.original.closedAt)}</span>
      ),
    },
    {
      accessorKey: 'openingCash',
      header: 'Opening',
      cell: ({ row }) => money(row.original.openingCash),
    },
    {
      accessorKey: 'expectedCash',
      header: 'Expected',
      cell: ({ row }) => money(row.original.expectedCash),
    },
    {
      accessorKey: 'countedCash',
      header: 'Counted',
      cell: ({ row }) => money(row.original.countedCash),
    },
    {
      accessorKey: 'cashDifference',
      header: 'Difference',
      cell: ({ row }) => {
        const value = Number(row.original.cashDifference ?? 0);
        return (
          <span className={value === 0 ? 'text-emerald-600' : 'font-medium text-rose-600'}>
            {row.original.cashDifference === null ? '—' : money(row.original.cashDifference)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Drawer"
        title="Shift history"
        description={`${register?.name ?? 'Register'} · every shift opened on this register.`}
        actions={
          <Link to="/shift" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4" />
            Current shift
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={shifts.data?.items ?? []}
        loading={shifts.isLoading}
        error={shifts.error}
        onRetry={() => void shifts.refetch()}
        pageIndex={page}
        pageSize={PAGE_SIZE}
        pageCount={shifts.data?.totalPages}
        totalElements={shifts.data?.totalElements}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/shift/${row.id}`)}
        getRowId={(row) => row.id}
        emptyTitle="No shifts yet"
        emptyDescription="Open a shift from the current shift page to start recording sales."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status || 'ALL'}
              onValueChange={(value) => {
                setStatus(value === 'ALL' ? '' : value);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="RECONCILIATION_REQUIRED">Reconciliation required</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => void shifts.refetch()}>
              <History className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        }
      />
    </div>
  );
}
