import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, ReceiptText, Wallet } from 'lucide-react';
import { posApi, queryKeys } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/states';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import { TableCell, TableHead } from '@/components/ui/table';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';

export function ShiftDetailPage() {
  const { shiftId = '' } = useParams();
  const auth = useAuth();
  const currency = auth.organization?.defaultCurrency ?? 'USD';
  const money = (value: string | number | null | undefined) => formatMoney(value, currency);

  const report = useQuery({
    queryKey: queryKeys.shiftReport(shiftId),
    queryFn: () => posApi.shiftReport(shiftId),
    enabled: Boolean(shiftId),
  });

  const data = report.data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Shift report"
        title={data ? `Shift ${data.shift.id.slice(0, 8)}` : 'Shift report'}
        description={
          data
            ? `Opened ${formatDateTime(data.shift.openedAt)}${
                data.shift.closedAt ? ` · Closed ${formatDateTime(data.shift.closedAt)}` : ''
              }`
            : 'Expected versus counted cash and every tender recorded.'
        }
        actions={
          <Link to="/shift/history" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4" />
            Shift history
          </Link>
        }
      />

      {report.isLoading ? (
        <Card>
          <LoadingState label="Loading shift report…" />
        </Card>
      ) : report.error || !data ? (
        <Card>
          <EmptyState
            title="Could not load this shift"
            description="The shift may belong to another branch or no longer exists."
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.shift.status} />
            <Badge variant="info">{formatNumber(data.saleCount)} sales</Badge>
            {data.shift.closedAt && (
              <span className="text-xs text-slate-500">
                Closed {formatDateTime(data.shift.closedAt)}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Gross sales"
              value={money(data.grossSales)}
              tone="emerald"
              icon={<ReceiptText className="h-5 w-5" />}
            />
            <MetricCard
              label="Net sales"
              value={money(data.netSales)}
              hint={Number(data.discounts) > 0 ? `${money(data.discounts)} discounts` : undefined}
              icon={<Banknote className="h-5 w-5" />}
            />
            <MetricCard
              label="Expected in drawer"
              value={money(data.shift.expectedCash)}
              tone="indigo"
              icon={<Wallet className="h-5 w-5" />}
            />
            <MetricCard
              label="Cash difference"
              value={data.shift.cashDifference === null ? '—' : money(data.shift.cashDifference)}
              tone={Number(data.shift.cashDifference ?? 0) === 0 ? 'emerald' : 'rose'}
              hint={
                data.shift.countedCash === null
                  ? 'Shift still open'
                  : `Counted ${money(data.shift.countedCash)}`
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tender mix</CardTitle>
              </CardHeader>
              <CardContent>
                {data.tenders.length === 0 ? (
                  <EmptyState
                    title="No tenders"
                    description="No payments were taken in this shift."
                  />
                ) : (
                  <div className="space-y-2">
                    {data.tenders.map((tender) => (
                      <div
                        key={tender.method}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-700">
                          {tender.method.replace('_', ' ')}
                        </span>
                        <span className="text-slate-900">{money(tender.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drawer reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(
                  [
                    ['Opening cash', data.shift.openingCash],
                    ['Cash sales', data.shift.cashSales],
                    ['Cash refunds', data.shift.cashRefunds],
                    ['Cash movement net', data.shift.cashMovementNet],
                    ['Expected cash', data.shift.expectedCash],
                    ['Counted cash', data.shift.countedCash],
                    ['Difference', data.shift.cashDifference],
                  ] as Array<[string, string | null]>
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900">{money(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash movements</CardTitle>
            </CardHeader>
            <CardContent>
              {data.cashMovements.length === 0 ? (
                <EmptyState
                  title="No cash movements"
                  description="Opening floats and drawer movements appear here."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cashMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <Badge
                              variant={
                                movement.movementType === 'OPENING_FLOAT' ? 'info' : 'neutral'
                              }
                            >
                              {movement.movementType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {money(movement.amount)}
                          </TableCell>
                          <TableCell className="text-slate-500">{movement.reason ?? '—'}</TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(movement.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
