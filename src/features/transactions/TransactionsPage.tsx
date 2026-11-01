import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCw, SearchX } from 'lucide-react';
import { salesApi, queryKeys } from '@nexora/api-client';
import type { Sale } from '@nexora/api-types';
import { useAuth } from '@nexora/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Input } from '@/components/ui/input';
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

const PAGE_SIZE = 20;

export function TransactionsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { register } = usePosRegister();
  const [status, setStatus] = useState('POSTED');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const branchId = register?.branchId ?? auth.activeBranchId ?? undefined;
  const params = {
    channel: 'POS',
    status: status || undefined,
    branchId,
    from: from || undefined,
    to: to || undefined,
    page,
    size: PAGE_SIZE,
  };

  const sales = useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => salesApi.list(params),
  });

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.original.receiptNumber ?? row.original.saleNumber}
          </p>
          <p className="text-[11px] text-slate-500">{row.original.saleNumber}</p>
        </div>
      ),
    },
    {
      accessorKey: 'postedAt',
      header: 'Sold at',
      cell: ({ row }) => (
        <span className="text-slate-600">
          {formatDateTime(row.original.postedAt ?? row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'lines',
      header: 'Lines',
      cell: ({ row }) => <span className="text-slate-600">{row.original.items?.length ?? 0}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">
          {formatMoney(row.original.totalAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
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
        eyebrow="History"
        title="Transactions"
        description={
          branchId
            ? 'POS sales for the active branch. Select a row to open the receipt.'
            : 'POS sales across your organization. Select a row to open the receipt.'
        }
        actions={
          <Button variant="outline" onClick={() => void sales.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={sales.data?.items ?? []}
        loading={sales.isLoading}
        error={sales.error}
        onRetry={() => void sales.refetch()}
        pageIndex={page}
        pageSize={PAGE_SIZE}
        pageCount={sales.data?.totalPages}
        totalElements={sales.data?.totalElements}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/transactions/${row.id}`)}
        getRowId={(row) => row.id}
        emptyTitle="No POS sales found"
        emptyDescription="Completed sales will appear here. Try widening the date range or status filter."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status || 'ALL'}
              onValueChange={(value) => {
                setStatus(value === 'ALL' ? '' : value);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>From</span>
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(0);
                }}
                className="h-8 w-36"
                aria-label="From date"
              />
              <span>To</span>
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(0);
                }}
                className="h-8 w-36"
                aria-label="To date"
              />
            </div>
            {(from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setPage(0);
                }}
              >
                <SearchX className="h-3.5 w-3.5" />
                Clear dates
              </Button>
            )}
            <Badge variant="info">{sales.data?.totalElements ?? 0} sales</Badge>
          </div>
        }
      />
    </div>
  );
}
