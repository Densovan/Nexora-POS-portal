import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  toolbar,
  pageIndex = 0,
  pageSize = 20,
  pageCount,
  totalElements,
  onPageChange,
  onRowClick,
  getRowId,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const serverPaginated = pageCount !== undefined;
  const startRow = totalElements === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalElements ?? 0);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: serverPaginated,
    pageCount: serverPaginated ? pageCount : undefined,
    getRowId,
  });

  return (
    <Card className={cn('overflow-hidden', className)}>
      {toolbar && <div className="border-b border-slate-100 p-4">{toolbar}</div>}
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <TableSkeleton />
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-slate-800"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {serverPaginated && onPageChange && !error && (
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <span className="font-medium text-slate-700">{startRow}</span>–
            <span className="font-medium text-slate-700">{endRow}</span> of{' '}
            <span className="font-medium text-slate-700">{totalElements ?? 0}</span>
          </span>
          <div className="flex items-center gap-2">
            <span>
              Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
            </span>
            <ShadcnPagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={pageIndex <= 0}
                    onClick={() => onPageChange(pageIndex - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={pageIndex + 1 >= (pageCount ?? 0)}
                    onClick={() => onPageChange(pageIndex + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </ShadcnPagination>
          </div>
        </div>
      )}
    </Card>
  );
}

export function DataTableToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}
