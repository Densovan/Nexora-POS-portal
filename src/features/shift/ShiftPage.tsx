import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Banknote,
  Clock,
  History,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { getApiErrorMessage, posApi, queryKeys } from '@nexora/api-client';
import type { CashMovement } from '@nexora/api-types';
import { useAuth } from '@nexora/auth';
import { usePermissions } from '@nexora/permissions';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import { TableCell, TableHead } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, formatMoney } from '@/lib/format';
import { useToast } from '@/components/toast';
import { usePosRegister } from '../../registers/RegisterProvider';
import { RequireRegister } from '../../components/RequireRegister';

const MOVEMENT_TYPES = ['CASH_IN', 'CASH_OUT', 'SAFE_DROP', 'CORRECTION'] as const;
const REASON_REQUIRED = new Set(['CASH_OUT', 'SAFE_DROP', 'CORRECTION']);

const amountValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function ShiftPage() {
  return (
    <RequireRegister>
      <ShiftWorkspace />
    </RequireRegister>
  );
}

function ShiftWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const auth = useAuth();
  const { has } = usePermissions();
  const { register } = usePosRegister();
  const currency = auth.organization?.defaultCurrency ?? 'USD';
  const money = (value: string | number | null | undefined) => formatMoney(value, currency);

  const [openingCash, setOpeningCash] = useState('');
  const [openNote, setOpenNote] = useState('');
  const [opening, setOpening] = useState(false);

  const [movementType, setMovementType] = useState<string>('CASH_IN');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [recording, setRecording] = useState(false);

  const [countedCash, setCountedCash] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [closing, setClosing] = useState(false);

  const activeShift = useQuery({
    queryKey: queryKeys.shifts({ registerId: register?.id ?? null, status: 'OPEN' }),
    queryFn: () => posApi.shifts({ registerId: register?.id, status: 'OPEN', page: 0, size: 1 }),
    enabled: Boolean(register),
  });
  const shift = activeShift.data?.items[0] ?? null;

  const movements = useQuery({
    queryKey: queryKeys.shiftCashMovements(shift?.id ?? ''),
    queryFn: () => posApi.cashMovements(shift!.id) as Promise<CashMovement[]>,
    enabled: Boolean(shift?.id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pos'] });
    await activeShift.refetch();
  };

  const openShift = async (event: FormEvent) => {
    event.preventDefault();
    if (!register) return;
    const openingAmount = amountValue(openingCash);
    if (openingAmount < 0) {
      toast({ title: 'Opening cash cannot be negative', variant: 'error' });
      return;
    }
    setOpening(true);
    try {
      await posApi.openShift({
        registerId: register.id,
        openingCash: openingAmount,
        note: openNote.trim() || undefined,
      });
      toast({ title: 'Shift opened', variant: 'success' });
      setOpeningCash('');
      setOpenNote('');
      await queryClient.invalidateQueries({ queryKey: ['pos'] });
    } catch (error) {
      toast({
        title: 'Could not open the shift',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setOpening(false);
    }
  };

  const recordMovement = async (event: FormEvent) => {
    event.preventDefault();
    if (!shift) return;
    const amount = amountValue(movementAmount);
    if (amount <= 0) {
      toast({ title: 'Enter a positive amount', variant: 'error' });
      return;
    }
    if (REASON_REQUIRED.has(movementType) && !movementReason.trim()) {
      toast({
        title: `A reason is required for ${movementType.replace('_', ' ')}`,
        variant: 'error',
      });
      return;
    }
    setRecording(true);
    try {
      await posApi.recordCashMovement(shift.id, {
        movementType,
        amount,
        reason: movementReason.trim() || undefined,
      });
      toast({ title: 'Cash movement recorded', variant: 'success' });
      setMovementAmount('');
      setMovementReason('');
      await queryClient.invalidateQueries({ queryKey: ['pos'] });
    } catch (error) {
      toast({
        title: 'Could not record the movement',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setRecording(false);
    }
  };

  const closeShift = async (event: FormEvent) => {
    event.preventDefault();
    if (!shift) return;
    const counted = amountValue(countedCash);
    if (counted < 0) {
      toast({ title: 'Counted cash cannot be negative', variant: 'error' });
      return;
    }
    setClosing(true);
    try {
      const closed = await posApi.closeShift(shift.id, {
        countedCash: counted,
        note: closeNote.trim() || undefined,
      });
      toast({ title: 'Shift closed', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['pos'] });
      navigate(`/shift/${closed.id}`);
    } catch (error) {
      toast({
        title: 'Could not close the shift',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setClosing(false);
    }
  };

  const expected = Number(shift?.expectedCash ?? 0);
  const counted = amountValue(countedCash);
  const difference = counted - expected;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Drawer"
        title="Cashier shift"
        description={`${register?.name ?? 'Register'} · ${register?.registerCode ?? ''}`}
        actions={
          <>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Link to="/shift/history" className={buttonVariants({ variant: 'outline' })}>
              <History className="h-4 w-4" />
              Shift history
            </Link>
          </>
        }
      />

      {activeShift.isLoading ? (
        <Card>
          <div className="py-16 text-center text-sm text-slate-500">Loading shift…</div>
        </Card>
      ) : activeShift.error ? (
        <Card>
          <EmptyState
            title="Could not load the shift"
            description={getApiErrorMessage(activeShift.error)}
            action={
              <Button variant="outline" onClick={() => void activeShift.refetch()}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : !shift ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Open a shift</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Count the opening float, then start selling. Only one shift can be open per
                  register.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={openShift} noValidate>
                <FormField
                  label="Opening cash"
                  htmlFor="openingCash"
                  hint="Cash in the drawer at the start of the shift."
                  required
                >
                  <Input
                    id="openingCash"
                    type="number"
                    min={0}
                    step="0.01"
                    value={openingCash}
                    onChange={(event) => setOpeningCash(event.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </FormField>
                <FormField label="Note" htmlFor="openNote" hint="Optional handover note.">
                  <Textarea
                    id="openNote"
                    value={openNote}
                    onChange={(event) => setOpenNote(event.target.value)}
                    placeholder="Morning shift, drawer counted with manager."
                    className="min-h-[72px]"
                  />
                </FormField>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
                  loading={opening}
                  disabled={!has('pos.shifts.open')}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Open shift
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Before you start</p>
              <p>
                Sales, refunds, and cash movements are attached to the open shift. Closing the shift
                reconciles the expected drawer against your physical count.
              </p>
              <p className="text-xs text-slate-500">
                Your cashier role allows opening and closing shifts, but not applying discounts or
                voiding sales.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={shift.status} />
            <span className="text-xs text-slate-500">Opened {formatDateTime(shift.openedAt)}</span>
            <Badge variant="info">Shift {shift.id.slice(0, 8)}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Opening cash"
              value={money(shift.openingCash)}
              icon={<Wallet className="h-5 w-5" />}
            />
            <MetricCard
              label="Cash sales"
              value={money(shift.cashSales)}
              hint={shift.cashRefunds ? `${money(shift.cashRefunds)} refunded` : undefined}
              tone="emerald"
              icon={<Banknote className="h-5 w-5" />}
            />
            <MetricCard
              label="Cash movements"
              value={money(shift.cashMovementNet)}
              hint="Cash in, cash out, safe drops, corrections"
              tone="amber"
              icon={<ArrowLeftRight className="h-5 w-5" />}
            />
            <MetricCard
              label="Expected in drawer"
              value={money(shift.expectedCash)}
              tone="indigo"
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Cash movements</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Record petty cash, safe drops, and corrections while the shift is open.
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <ArrowLeftRight className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={recordMovement} noValidate>
                  <FormField label="Type" htmlFor="movementType" required>
                    <Select value={movementType} onValueChange={setMovementType}>
                      <SelectTrigger id="movementType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOVEMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Amount" htmlFor="movementAmount" required>
                    <Input
                      id="movementAmount"
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={movementAmount}
                      onChange={(event) => setMovementAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField
                    label="Reason"
                    htmlFor="movementReason"
                    required={REASON_REQUIRED.has(movementType)}
                    hint={
                      REASON_REQUIRED.has(movementType)
                        ? 'Required for cash out, safe drop, and corrections.'
                        : 'Optional for cash in.'
                    }
                    className="sm:col-span-2"
                  >
                    <Input
                      id="movementReason"
                      value={movementReason}
                      onChange={(event) => setMovementReason(event.target.value)}
                      placeholder="Courier pickup, float top-up…"
                    />
                  </FormField>
                  <div className="sm:col-span-2">
                    <Button type="submit" loading={recording}>
                      <Plus className="h-4 w-4" />
                      Record movement
                    </Button>
                  </div>
                </form>

                {movements.isLoading ? (
                  <p className="py-6 text-center text-xs text-slate-500">Loading movements…</p>
                ) : (movements.data ?? []).length === 0 ? (
                  <EmptyState
                    title="No cash movements"
                    description="The opening float is recorded automatically when the shift opens."
                    className="py-8"
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
                        {(movements.data ?? []).map((movement) => (
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
                            <TableCell className="max-w-[220px] truncate text-slate-500">
                              {movement.reason ?? '—'}
                            </TableCell>
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

            <Card className="h-fit">
              <CardHeader>
                <div>
                  <CardTitle>Close shift</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Count the drawer and record the physical cash.
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <LockKeyhole className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={closeShift} noValidate>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Expected</span>
                      <span className="font-medium text-slate-900">
                        {money(shift.expectedCash)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-500">Difference</span>
                      <span
                        className={
                          Math.abs(difference) < 0.0005
                            ? 'font-medium text-emerald-600'
                            : 'font-medium text-rose-600'
                        }
                      >
                        {money(difference)}
                      </span>
                    </div>
                  </div>
                  <FormField label="Counted cash" htmlFor="countedCash" required>
                    <Input
                      id="countedCash"
                      type="number"
                      min={0}
                      step="0.01"
                      value={countedCash}
                      onChange={(event) => setCountedCash(event.target.value)}
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField
                    label="Note"
                    htmlFor="closeNote"
                    hint="Optional explanation for variances."
                  >
                    <Textarea
                      id="closeNote"
                      value={closeNote}
                      onChange={(event) => setCloseNote(event.target.value)}
                      placeholder="Drawer short by 2.00, investigating."
                      className="min-h-[72px]"
                    />
                  </FormField>
                  <Button
                    type="submit"
                    variant="danger"
                    className="w-full"
                    loading={closing}
                    disabled={!countedCash || !has('pos.shifts.close')}
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Close shift
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
