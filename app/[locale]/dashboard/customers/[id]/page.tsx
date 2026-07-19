import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { userRepository, orderRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';
import { EMIRATE_LABELS } from '@/lib/types/common';
import { formatMoney } from '@/lib/format';
import { DataTable } from '@/components/dashboard/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default async function CustomerDetailPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'view_reports', `/${locale}/dashboard`);

  const customer = await userRepository.getById(ctx, params.id);
  if (!customer || (customer.role !== 'retail_customer' && customer.role !== 'wholesale_customer')) notFound();

  const allOrders = await orderRepository.list(ctx);
  const orders = allOrders.filter((o) => o.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalSpend = orders.reduce((sum, o) => sum + o.totals.total, 0);

  const isWholesale = customer.role === 'wholesale_customer';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl tracking-wide text-ink">{isWholesale ? customer.businessName : customer.fullName}</h2>
        <Badge variant={isWholesale ? 'accent' : 'primary'} className="mt-1">
          {isWholesale ? (locale === 'en' ? 'Wholesale' : 'جملة') : locale === 'en' ? 'Retail' : 'قطاعي'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{locale === 'en' ? 'Orders' : 'الطلبات'}</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink">{orders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{locale === 'en' ? 'Total spend' : 'إجمالي الإنفاق'}</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink">{formatMoney(totalSpend, locale)}</p>
        </Card>
        {isWholesale && (
          <>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{locale === 'en' ? 'Credit limit' : 'حد الائتمان'}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-ink">{formatMoney(customer.creditLimit.limit, locale)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{locale === 'en' ? 'Balance due' : 'المستحق'}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-ink">{formatMoney(customer.creditLimit.currentBalance, locale)}</p>
            </Card>
          </>
        )}
      </div>

      <Card className="p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-muted">{locale === 'en' ? 'Contact' : 'الشخص المسؤول'}</dt>
            <dd className="font-semibold text-ink">{isWholesale ? customer.fullName : customer.email}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{locale === 'en' ? 'Email' : 'الإيميل'}</dt>
            <dd className="font-semibold text-ink">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{locale === 'en' ? 'Phone' : 'الهاتف'}</dt>
            <dd className="font-semibold text-ink">{customer.phone ?? '—'}</dd>
          </div>
          {isWholesale && customer.tradeLicenseNumber && (
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Trade license' : 'الرخصة التجارية'}</dt>
              <dd className="font-semibold text-ink">{customer.tradeLicenseNumber}</dd>
            </div>
          )}
          {!isWholesale && customer.addresses[0] && (
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Address' : 'العنوان'}</dt>
              <dd className="font-semibold text-ink">
                {customer.addresses[0].street}, {customer.addresses[0].area}, {EMIRATE_LABELS[customer.addresses[0].emirate][locale]}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <div>
        <h3 className="mb-2 font-display text-lg tracking-wide text-ink">{locale === 'en' ? 'Order history' : 'سجل الطلبات'}</h3>
        <DataTable
          rowKey={(o) => o.id}
          emptyMessage={locale === 'en' ? 'No orders yet.' : 'لا يوجد طلبات بعد.'}
          rows={orders}
          columns={[
            {
              header: locale === 'en' ? 'Order' : 'الطلب',
              render: (o) => (
                <Link href={`/${locale}/dashboard/orders/${o.id}`} className="font-mono font-semibold text-primary hover:underline">
                  {o.orderNumber}
                </Link>
              ),
            },
            { header: locale === 'en' ? 'Date' : 'التاريخ', render: (o) => new Date(o.createdAt).toLocaleDateString(locale) },
            { header: locale === 'en' ? 'Status' : 'الحالة', render: (o) => <Badge variant="primary">{ORDER_STATUS_LABELS[o.status][locale]}</Badge> },
            { header: locale === 'en' ? 'Total' : 'الإجمالي', render: (o) => <span className="font-mono">{formatMoney(o.totals.total, locale)}</span> },
          ]}
        />
      </div>
    </div>
  );
}
