import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, ReceiptText, ShoppingCart } from 'lucide-react';
import { posApi, queryKeys } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/states';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import { TableCell, TableHead } from '@/components/ui/table';
import { formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usePosRegister } from '../../registers/RegisterProvider';

export function ReceiptPage() {
  const { saleId = '' } = useParams();
  const auth = useAuth();
  const { register } = usePosRegister();

  const receipt = useQuery({
    queryKey: queryKeys.receipt(saleId),
    queryFn: () => posApi.receipt(saleId),
    enabled: Boolean(saleId),
  });

  const data = receipt.data;
  const sale = data?.sale;

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          eyebrow="Receipt"
          title={sale ? (sale.receiptNumber ?? sale.saleNumber) : 'Receipt'}
          description={
            sale ? `Completed ${formatDateTime(sale.postedAt ?? sale.createdAt)}` : undefined
          }
          actions={
            <>
              <Link to="/transactions" className={buttonVariants({ variant: 'outline' })}>
                <ArrowLeft className="h-4 w-4" />
                Transactions
              </Link>
              <Link
                to="/sale"
                className={cn(
                  buttonVariants(),
                  'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                New sale
              </Link>
            </>
          }
        />
      </div>

      {receipt.isLoading ? (
        <Card>
          <LoadingState label="Loading receipt…" />
        </Card>
      ) : receipt.error || !sale || !data ? (
        <Card>
          <EmptyState
            icon={<ReceiptText className="h-5 w-5" />}
            title="Receipt not available"
            description="This sale may not exist, or it is not a POS sale."
            action={
              <Link to="/transactions" className={buttonVariants({ variant: 'outline' })}>
                Back to transactions
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_320px]">
          <Card className="print-area mx-auto w-full max-w-[520px]">
            <CardContent className="space-y-4 p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {auth.organization?.name ?? 'Nexora Business'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {register && register.id === sale.registerId
                    ? `${register.name} · ${register.registerCode}`
                    : 'Point of sale'}
                </p>
                {auth.organization?.address && (
                  <p className="mt-1 text-[11px] text-slate-500">{auth.organization.address}</p>
                )}
                {auth.organization?.phone && (
                  <p className="text-[11px] text-slate-500">{auth.organization.phone}</p>
                )}
              </div>

              <div className="border-y border-dashed border-slate-200 py-3 text-xs text-slate-600">
                <div className="flex justify-between gap-2">
                  <span>Receipt</span>
                  <span className="font-medium text-slate-900">
                    {sale.receiptNumber ?? sale.saleNumber}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Sale</span>
                  <span>{sale.saleNumber}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Date</span>
                  <span>{formatDateTime(sale.postedAt ?? sale.createdAt)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Channel</span>
                  <span>{sale.saleChannel}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Status</span>
                  <StatusBadge status={sale.status} />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-1">Item</TableHead>
                    <TableHead className="px-1 text-right">Qty</TableHead>
                    <TableHead className="px-1 text-right">Price</TableHead>
                    <TableHead className="px-1 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell className="whitespace-normal px-1 py-2">
                        <p className="text-xs font-medium text-slate-900">{item.description}</p>
                        <p className="text-[10px] text-slate-500">{item.sku}</p>
                        {Number(item.discountAmount) > 0 && (
                          <p className="text-[10px] text-rose-500">
                            -{formatMoney(item.discountAmount, sale.currency)} discount
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right text-xs">
                        {Number(item.quantity)}
                        {item.unitCode ? ` ${item.unitCode}` : ''}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right text-xs">
                        {formatMoney(item.unitPrice, sale.currency)}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right text-xs font-medium text-slate-900">
                        {formatMoney(item.lineTotal, sale.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t border-dashed border-slate-200 pt-3 text-xs">
                <div className="flex justify-between gap-2 text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(sale.subtotal, sale.currency)}</span>
                </div>
                {Number(sale.discountAmount) > 0 && (
                  <div className="mt-1 flex justify-between gap-2 text-rose-600">
                    <span>Discounts</span>
                    <span>-{formatMoney(sale.discountAmount, sale.currency)}</span>
                  </div>
                )}
                {Number(sale.taxAmount) > 0 && (
                  <div className="mt-1 flex justify-between gap-2 text-slate-600">
                    <span>Tax</span>
                    <span>{formatMoney(sale.taxAmount, sale.currency)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between gap-2 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(sale.totalAmount, sale.currency)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2 text-slate-600">
                  <span>Paid</span>
                  <span>{formatMoney(sale.amountPaid, sale.currency)}</span>
                </div>
                {Number(sale.outstandingAmount) > 0 && (
                  <div className="mt-1 flex justify-between gap-2 font-medium text-rose-600">
                    <span>Outstanding</span>
                    <span>{formatMoney(sale.outstandingAmount, sale.currency)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 text-xs">
                <p className="mb-2 font-medium uppercase tracking-wide text-slate-500">Payments</p>
                {data.payments.length === 0 ? (
                  <p className="text-slate-500">No payments recorded.</p>
                ) : (
                  data.payments.flatMap((payment) =>
                    payment.tenders.map((tender) => (
                      <div
                        key={`${payment.id}-${tender.id}`}
                        className="flex justify-between gap-2 py-0.5 text-slate-600"
                      >
                        <span>
                          {tender.method.replace('_', ' ')}
                          {tender.providerReference ? ` · ${tender.providerReference}` : ''}
                        </span>
                        <span>{formatMoney(tender.amount, payment.currency)}</span>
                      </div>
                    )),
                  )
                )}
              </div>

              <p className="pt-2 text-center text-[11px] text-slate-500">
                Thank you for your purchase.
              </p>
            </CardContent>
          </Card>

          <div className="no-print space-y-4">
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-900">Receipt actions</p>
              <p className="mt-1 text-xs text-slate-500">
                Print a customer copy on your thermal printer. Use the browser print dialog to pick
                the printer.
              </p>
              <Button className="mt-4 w-full" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print receipt
              </Button>
            </Card>
            <Card className="p-5 text-sm">
              <p className="font-medium text-slate-900">Tender summary</p>
              <div className="mt-3 space-y-2">
                {data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {payment.paymentType.replace('_', ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(payment.receivedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {formatMoney(payment.amount, payment.currency)}
                      </p>
                      <Badge variant={payment.status === 'POSTED' ? 'success' : 'neutral'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
