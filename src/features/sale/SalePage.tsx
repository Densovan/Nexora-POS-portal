import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  Barcode,
  Minus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { catalogApi, getApiErrorMessage, posApi, queryKeys } from '@nexora/api-client';
import type { PosCheckoutRequest, PosProduct, Product } from '@nexora/api-types';
import { usePermissions } from '@nexora/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { formatMoney } from '@/lib/format';
import { useToast } from '@/components/toast';
import { usePosRegister } from '../../registers/RegisterProvider';
import { RequireRegister } from '../../components/RequireRegister';

interface CartLine {
  productId: string;
  sku: string;
  name: string;
  unit: string | null;
  unitPrice: number;
  currency: string;
  trackInventory: boolean;
  allowFractional: boolean;
  quantity: number;
  discountAmount: number;
  onHand: number | null;
}

interface TenderLine {
  id: string;
  method: string;
  amount: string;
  reference: string;
}

const TENDER_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'QR', 'OTHER'] as const;

const round4 = (value: number) => Math.round((value + Number.EPSILON) * 10_000) / 10_000;

const amountValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const inputAmount = (value: number) => {
  const fixed = value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return fixed === '' ? '0' : fixed;
};

const newTender = (amount = ''): TenderLine => ({
  id: crypto.randomUUID(),
  method: 'CASH',
  amount,
  reference: '',
});

export function SalePage() {
  return (
    <RequireRegister>
      <SaleWorkspace />
    </RequireRegister>
  );
}

function SaleWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { has } = usePermissions();
  const { register } = usePosRegister();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const canDiscount = has('sales.discount');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [tenders, setTenders] = useState<TenderLine[]>([newTender()]);
  const [headerDiscount, setHeaderDiscount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [checkingOut, setCheckingOut] = useState(false);

  const shiftQuery = useQuery({
    queryKey: queryKeys.shifts({ registerId: register?.id ?? null, status: 'OPEN' }),
    queryFn: () => posApi.shifts({ registerId: register?.id, status: 'OPEN', page: 0, size: 1 }),
    enabled: Boolean(register),
  });
  const shift = shiftQuery.data?.items[0] ?? null;

  const productsQuery = useQuery({
    queryKey: queryKeys.products(0, 100),
    queryFn: () => catalogApi.products(0, 100),
    enabled: has('products.view'),
  });

  const products = useMemo(() => {
    const items = (productsQuery.data?.items ?? []).filter((product) => product.active);
    const term = search.trim().toLowerCase();
    if (!term) return items.slice(0, 24);
    return items
      .filter(
        (product) =>
          product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term),
      )
      .slice(0, 36);
  }, [productsQuery.data, search]);

  const currency = cart[0]?.currency ?? 'USD';

  const subtotal = useMemo(
    () => round4(cart.reduce((sum, line) => sum + round4(line.unitPrice * line.quantity), 0)),
    [cart],
  );
  const lineDiscountTotal = useMemo(
    () => round4(cart.reduce((sum, line) => sum + line.discountAmount, 0)),
    [cart],
  );
  const maxHeaderDiscount = round4(Math.max(subtotal - lineDiscountTotal, 0));
  const headerDiscountValue = canDiscount
    ? Math.min(Math.max(amountValue(headerDiscount), 0), maxHeaderDiscount)
    : 0;
  const total = round4(Math.max(subtotal - lineDiscountTotal - headerDiscountValue, 0));
  const tenderTotal = useMemo(
    () => round4(tenders.reduce((sum, tender) => sum + amountValue(tender.amount), 0)),
    [tenders],
  );
  const remaining = round4(total - tenderTotal);
  const tenderMatches = cart.length > 0 && Math.abs(remaining) < 0.00005;

  const addLine = (product: {
    productId: string;
    sku: string;
    name: string;
    unit: string | null;
    unitPrice: number;
    currency: string;
    trackInventory: boolean;
    allowFractional: boolean;
    onHand?: number | null;
  }) => {
    if (!Number.isFinite(product.unitPrice) || product.unitPrice <= 0) {
      toast({
        title: 'No selling price',
        description: `${product.name} does not have a selling price configured.`,
        variant: 'error',
      });
      return;
    }
    if (cart.length > 0 && product.currency !== currency) {
      toast({
        title: 'Currency mismatch',
        description: `This sale is in ${currency}. ${product.name} is priced in ${product.currency}.`,
        variant: 'error',
      });
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.productId);
      if (existing) {
        return current.map((line) =>
          line.productId === product.productId
            ? { ...line, quantity: round4(line.quantity + 1) }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          unitPrice: product.unitPrice,
          currency: product.currency,
          trackInventory: product.trackInventory,
          allowFractional: product.allowFractional,
          quantity: 1,
          discountAmount: 0,
          onHand: product.onHand ?? null,
        },
      ];
    });
  };

  const addCatalogProduct = (product: Product) => {
    addLine({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      unitPrice: Number(product.sellingPrice),
      currency: product.currency,
      trackInventory: product.trackInventory,
      allowFractional: product.allowFractionalQuantity,
    });
  };

  const addScannedProduct = (product: PosProduct) => {
    addLine({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      unitPrice: Number(product.sellingPrice),
      currency: product.currency,
      trackInventory: product.trackInventory,
      allowFractional: product.allowFractionalQuantity,
      onHand: product.quantityOnHand === null ? null : Number(product.quantityOnHand),
    });
  };

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    const code = barcode.trim();
    if (!code || !register) return;
    setScanning(true);
    try {
      const product = await posApi.lookupProduct(code, register.id);
      addScannedProduct(product);
      setBarcode('');
      barcodeRef.current?.focus();
    } catch (error) {
      toast({
        title: 'Product not found',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setScanning(false);
    }
  };

  const changeQuantity = (productId: string, next: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? {
                ...line,
                quantity: line.allowFractional
                  ? round4(Math.max(next, 0))
                  : Math.max(Math.floor(next), 0),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const changeLineDiscount = (productId: string, raw: string) => {
    setCart((current) =>
      current.map((line) => {
        if (line.productId !== productId) return line;
        const gross = round4(line.unitPrice * line.quantity);
        const discount = Math.min(Math.max(amountValue(raw), 0), gross);
        return { ...line, discountAmount: round4(discount) };
      }),
    );
  };

  const removeLine = (productId: string) => {
    setCart((current) => current.filter((line) => line.productId !== productId));
  };

  const clearSale = () => {
    setCart([]);
    setTenders([newTender()]);
    setHeaderDiscount('');
    setIdempotencyKey(crypto.randomUUID());
  };

  const updateTender = (id: string, patch: Partial<TenderLine>) => {
    setTenders((current) =>
      current.map((tender) => (tender.id === id ? { ...tender, ...patch } : tender)),
    );
  };

  const addTender = () => {
    const remainder = Math.max(round4(total - tenderTotal), 0);
    setTenders((current) => [...current, newTender(remainder > 0 ? inputAmount(remainder) : '')]);
  };

  const removeTender = (id: string) => {
    setTenders((current) => (current.length > 1 ? current.filter((t) => t.id !== id) : current));
  };

  const fillExactCash = () => {
    setTenders([newTender(inputAmount(total))]);
  };

  const checkout = async () => {
    if (!register) return;
    if (!shift) {
      toast({ title: 'Open a shift before charging', variant: 'error' });
      return;
    }
    if (cart.length === 0) return;
    if (!tenderMatches) {
      toast({
        title: 'Tender amounts do not match',
        description: `The amount due is ${formatMoney(total, currency)}.`,
        variant: 'error',
      });
      return;
    }
    const tenderPayload = tenders
      .map((tender) => ({
        method: tender.method,
        amount: round4(amountValue(tender.amount)),
        providerReference: tender.reference.trim() || undefined,
      }))
      .filter((tender) => tender.amount > 0);
    if (tenderPayload.length === 0) return;

    const payload: PosCheckoutRequest = {
      registerId: register.id,
      cashierShiftId: shift.id,
      currency,
      discountAmount: headerDiscountValue > 0 ? headerDiscountValue : undefined,
      idempotencyKey,
      items: cart.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        ...(canDiscount
          ? {
              unitPrice: line.unitPrice,
              discountAmount: line.discountAmount > 0 ? line.discountAmount : undefined,
            }
          : {}),
      })),
      tenders: tenderPayload,
    };

    setCheckingOut(true);
    try {
      const receipt = await posApi.checkout(payload, idempotencyKey);
      toast({
        title: 'Sale completed',
        description: receipt.sale.receiptNumber ?? receipt.sale.saleNumber,
        variant: 'success',
      });
      await queryClient.invalidateQueries({ queryKey: ['pos'] });
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      setCart([]);
      setTenders([newTender()]);
      setHeaderDiscount('');
      setIdempotencyKey(crypto.randomUUID());
      navigate(`/transactions/${receipt.sale.id}`);
    } catch (error) {
      toast({
        title: 'Could not complete the sale',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const shiftLoading = shiftQuery.isLoading;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Checkout
            </p>
            <h1 className="text-xl font-semibold text-slate-900">New sale</h1>
            <p className="mt-1 text-sm text-slate-500">
              {register?.name} · {register?.registerCode} · Walk-in customer
            </p>
          </div>
          <div className="flex items-center gap-2">
            {shiftLoading ? (
              <Badge>Checking shift</Badge>
            ) : shift ? (
              <StatusBadge status={shift.status} label="Shift open" />
            ) : (
              <Badge variant="warning">No open shift</Badge>
            )}
          </div>
        </div>

        {!shiftLoading && !shift && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="flex-1">
              Open a cashier shift to start recording sales. Payments are attached to the shift for
              reconciliation.
            </p>
            <Link
              to="/shift"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
            >
              Open shift
            </Link>
          </div>
        )}

        <Card className="p-4">
          <form onSubmit={scan} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Barcode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                ref={barcodeRef}
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Scan a barcode or type a SKU, then press Enter"
                className="h-11 pl-10 text-base"
                autoFocus
                aria-label="Barcode or SKU"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
              loading={scanning}
              disabled={!barcode.trim()}
            >
              <ScanBarcode className="h-4 w-4" />
              Add item
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader className="flex-col gap-3 pb-4">
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <CardTitle>Product catalog</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Showing the first 100 catalog items. Use scan or SKU for anything else.
                </p>
              </div>
              <Badge variant="info">{productsQuery.data?.totalElements ?? 0} products</Badge>
            </div>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by product name or SKU"
                className="pl-9"
                aria-label="Search products"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {productsQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title={search ? 'No matching products' : 'No products available'}
                description={
                  search
                    ? 'Try a different name or SKU, or scan the barcode.'
                    : 'Add products in the organization portal to sell them here.'
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addCatalogProduct(product)}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {product.name}
                        </span>
                        <span className="block text-[11px] text-slate-500">{product.sku}</span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-600" />
                    </span>
                    <span className="mt-auto flex items-baseline justify-between gap-2 pt-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatMoney(product.sellingPrice, product.currency)}
                      </span>
                      <span className="text-[11px] text-slate-400">{product.unit ?? 'each'}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-[640px] flex-col xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Current sale</p>
              <p className="text-[11px] text-slate-500">
                {cart.length} {cart.length === 1 ? 'line' : 'lines'}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSale}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <EmptyState
              icon={<ScanBarcode className="h-5 w-5" />}
              title="Cart is empty"
              description="Scan a barcode or pick a product to begin the sale."
              className="py-16"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((line) => {
                const gross = round4(line.unitPrice * line.quantity);
                const lineTotal = round4(gross - line.discountAmount);
                const lowStock =
                  line.trackInventory && line.onHand !== null && line.onHand < line.quantity;
                return (
                  <li key={line.productId} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{line.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {line.sku} · {formatMoney(line.unitPrice, line.currency)}
                          {line.unit ? ` / ${line.unit}` : ''}
                        </p>
                        {lowStock && (
                          <p className="mt-1 text-[11px] font-medium text-amber-600">
                            Only {line.onHand} on hand at this location
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.productId)}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.productId, line.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min={line.allowFractional ? 0.01 : 1}
                          step={line.allowFractional ? 0.01 : 1}
                          value={line.quantity}
                          onChange={(event) =>
                            changeQuantity(line.productId, amountValue(event.target.value))
                          }
                          className="h-8 w-16 border-x border-slate-200 text-center text-sm focus:outline-none"
                          aria-label={`Quantity for ${line.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.productId, line.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMoney(lineTotal, line.currency)}
                      </p>
                    </div>

                    {canDiscount && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Line discount</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.discountAmount || ''}
                          onChange={(event) =>
                            changeLineDiscount(line.productId, event.target.value)
                          }
                          placeholder="0.00"
                          className="h-7 w-24 text-xs"
                          aria-label={`Discount for ${line.name}`}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            {lineDiscountTotal > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Line discounts</span>
                <span>-{formatMoney(lineDiscountTotal, currency)}</span>
              </div>
            )}
            {canDiscount && (
              <div className="flex items-center justify-between gap-3 text-slate-500">
                <span>Sale discount</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={headerDiscount}
                  onChange={(event) => setHeaderDiscount(event.target.value)}
                  placeholder="0.00"
                  className="h-7 w-24 text-right text-xs"
                  aria-label="Sale discount"
                  disabled={maxHeaderDiscount === 0}
                />
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
              <span>Total due</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tenders
              </p>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={fillExactCash}>
                    <Banknote className="h-3.5 w-3.5" />
                    Exact cash
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTender}
                  disabled={cart.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Split
                </Button>
              </div>
            </div>

            {tenders.map((tender) => (
              <div key={tender.id} className="space-y-1.5 rounded-lg bg-slate-50 p-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={tender.method}
                    onValueChange={(value) => updateTender(tender.id, { method: value })}
                  >
                    <SelectTrigger
                      className="h-8 flex-1 border-slate-200 bg-white text-xs"
                      aria-label="Tender method"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENDER_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tender.amount}
                    onChange={(event) => updateTender(tender.id, { amount: event.target.value })}
                    placeholder="0.00"
                    className="h-8 w-28 bg-white text-right text-sm"
                    aria-label="Tender amount"
                  />
                  {tenders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTender(tender.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-600"
                      aria-label="Remove tender"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {tender.method !== 'CASH' && (
                  <Input
                    value={tender.reference}
                    onChange={(event) => updateTender(tender.id, { reference: event.target.value })}
                    placeholder="Reference (optional)"
                    className="h-8 bg-white text-xs"
                    aria-label="Tender reference"
                  />
                )}
              </div>
            ))}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Tendered</span>
              <span className={tenderMatches ? 'font-medium text-emerald-600' : 'text-slate-600'}>
                {formatMoney(tenderTotal, currency)}
              </span>
            </div>
            {total > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Remaining</span>
                <span
                  className={Math.abs(remaining) < 0.00005 ? 'text-emerald-600' : 'text-rose-600'}
                >
                  {formatMoney(remaining, currency)}
                </span>
              </div>
            )}
          </div>

          <Button
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
            size="lg"
            onClick={() => void checkout()}
            loading={checkingOut}
            disabled={cart.length === 0 || !shift || !tenderMatches}
          >
            <Banknote className="h-4 w-4" />
            Charge {formatMoney(total, currency)}
          </Button>
          {!shift && !shiftLoading && (
            <p className="mt-2 text-center text-[11px] text-amber-600">
              Open a shift before taking payment.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
