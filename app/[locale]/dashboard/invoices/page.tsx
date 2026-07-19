import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { orderRepository, userRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';
import { formatMoney } from '@/lib/format';
import { DataTable } from '@/components/dashboard/DataTable';
import { Badge } from '@/components/ui/Badge';

export default async function InvoicesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'view_reports', `/${locale}/dashboard`);

  const orders = await orderRepository.list(ctx);
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const uniqueCustomerIds = [...new Set(sorted.map((o) => o.customerId))];
  const customers = await Promise.all(uniqueCustomerIds.map((id) => userRepository.getById(ctx, id).catch(() => null)));
  const customerById = new Map(uniqueCustomerIds.map((id, i) => [id, customers[i]]));

  const paymentStatusVariant = {
    paid: 'primary' as const,
    unpaid: 'accent' as const,
    partially_paid: 'accent' as const,
    refunded: 'neutral' as const,
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Invoices' : 'الفواتير'}</h2>

      <DataTable
        rowKey={(o) => o.id}
        emptyMessage={locale === 'en' ? 'No invoices yet.' : 'لا يوجد فواتير بعد.'}
        rows={sorted}
        columns={[
          {
            header: locale === 'en' ? 'Order' : 'الطلب',
            render: (o) => <span className="font-mono font-semibold text-ink">{o.orderNumber}</span>,
          },
          {
            header: locale === 'en' ? 'Customer' : 'العميل',
            render: (o) => {
              const customer = customerById.get(o.customerId);
              const name = customer?.role === 'wholesale_customer' ? customer.businessName : customer?.fullName;
              return name ?? o.customerId;
            },
          },
          { header: locale === 'en' ? 'Date' : 'التاريخ', render: (o) => new Date(o.createdAt).toLocaleDateString(locale) },
          { header: locale === 'en' ? 'Status' : 'الحالة', render: (o) => <Badge variant="primary">{ORDER_STATUS_LABELS[o.status][locale]}</Badge> },
          {
            header: locale === 'en' ? 'Payment' : 'الدفع',
            render: (o) => <Badge variant={paymentStatusVariant[o.paymentStatus]}>{o.paymentStatus.replace('_', ' ')}</Badge>,
          },
          { header: locale === 'en' ? 'Total' : 'الإجمالي', render: (o) => <span className="font-mono">{formatMoney(o.totals.total, locale)}</span> },
          {
            header: locale === 'en' ? 'Invoice' : 'الفاتورة',
            render: (o) => (
              <a
                href={`/api/orders/${o.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {locale === 'en' ? 'Download' : 'تحميل'}
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}
