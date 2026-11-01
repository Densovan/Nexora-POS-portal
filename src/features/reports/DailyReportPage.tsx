import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Banknote, CalendarDays, ReceiptText } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { posApi, queryKeys } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/states';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { formatMoney, formatNumber, todayISO } from '@/lib/format';
import { usePosRegister } from '../../registers/RegisterProvider';

const TENDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6'];

export function DailyReportPage() {
  const auth = useAuth();
  const { register } = usePosRegister();
  const [date, setDate] = useState(() => todayISO());
  const currency = auth.organization?.defaultCurrency ?? 'USD';
  const money = (value: string | number | null | undefined) => formatMoney(value, currency);

  const report = useQuery({
    queryKey: queryKeys.posDaily({ date, branchId: register?.branchId }),
    queryFn: () => posApi.dailyReport({ date, branchId: register?.branchId }),
    enabled: Boolean(date),
  });

  const data = report.data;
  const tenderData = (data?.tenders ?? []).map((tender) => ({
    name: tender.method.replace('_', ' '),
    value: Number(tender.amount),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Insights"
        title="Daily POS report"
        description="Sales, discounts, refunds, and tender mix for one business day."
        actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 w-40"
              aria-label="Report date"
            />
          </div>
        }
      />

      {report.isLoading ? (
        <Card>
          <LoadingState label="Loading daily report…" />
        </Card>
      ) : report.error || !data ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" />}
            title="Report unavailable"
            description="The daily report could not be loaded for this date."
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{data.date}</Badge>
            <Badge>{formatNumber(data.saleCount)} sales</Badge>
            {data.branchId && <Badge>Branch {data.branchId.slice(0, 8)}</Badge>}
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
              label="Refunds"
              value={money(data.refunds)}
              tone="rose"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <MetricCard
              label="Average sale"
              value={money(data.averageSale)}
              tone="indigo"
              icon={<ReceiptText className="h-5 w-5" />}
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Tender mix</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Payment methods collected during the day.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {data.tenders.length === 0 ? (
                <EmptyState
                  title="No payments"
                  description="No POS payments were recorded on this date."
                />
              ) : (
                <div className="grid items-center gap-4 md:grid-cols-2">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tenderData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {tenderData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={TENDER_COLORS[index % TENDER_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => money(value)}
                          contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {data.tenders.map((tender, index) => (
                      <div
                        key={tender.method}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: TENDER_COLORS[index % TENDER_COLORS.length],
                            }}
                          />
                          {tender.method.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {money(tender.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
