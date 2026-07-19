import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { orderRepository, userRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';
import { formatMoney } from '@/lib/format';
import { DataTable } from '@/components/dashboard/DataTable';
import { RoleGate } from '@/components/dashboard/RoleGate';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';

export default async function DashboardOrdersPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();

  const orders = await orderRepository.list(ctx);
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const users = await userRepository.list(ctx).catch(() => []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Orders' : 'الطلبات'}</h2>
        <RoleGate role={ctx.role} action="create_wholesale_order">
          <Link href={`/${locale}/dashboard/orders/new`} className={buttonVariants({ variant: 'accent', size: 'sm' })}>
            {locale === 'en' ? 'New wholesale order' : 'أوردر جملة جديد'}
          </Link>
        </RoleGate>
      </div>

      <DataTable
        rowKey={(o) => o.id}
        emptyMessage={locale === 'en' ? 'No orders.' : 'لا يوجد طلبات.'}
        rows={sorted}
        columns={[
          {
            header: locale === 'en' ? 'Order' : 'الطلب',
            render: (o) => (
              <Link href={`/${locale}/dashboard/orders/${o.id}`} className="font-mono font-semibold text-primary hover:underline">
                {o.orderNumber}
              </Link>
            ),
          },
          {
            header: locale === 'en' ? 'Type' : 'النوع',
            render: (o) => <Badge variant={o.accountType === 'wholesale' ? 'accent' : 'neutral'}>{o.accountType}</Badge>,
          },
          {
            header: locale === 'en' ? 'Sales rep' : 'المندوب',
            render: (o) => users.find((u) => u.id === o.salesRepId)?.fullName ?? '—',
          },
          { header: locale === 'en' ? 'Total' : 'الإجمالي', render: (o) => <span className="font-mono">{formatMoney(o.totals.total, locale)}</span> },
          { header: locale === 'en' ? 'Status' : 'الحالة', render: (o) => <Badge variant="primary">{ORDER_STATUS_LABELS[o.status][locale]}</Badge> },
          { header: locale === 'en' ? 'Date' : 'التاريخ', render: (o) => new Date(o.createdAt).toLocaleDateString(locale) },
        ]}
      />
    </div>
  );
}
