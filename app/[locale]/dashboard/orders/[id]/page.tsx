import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { orderRepository, deliveryRepository, userRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { can } from '@/lib/rbac/permissions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from '@/lib/types/order';
import { formatMoney } from '@/lib/format';
import { updateOrderStatusAction } from '@/lib/dashboard/order-actions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default async function DashboardOrderDetailPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();

  const order = await orderRepository.getById(ctx, params.id).catch(() => null);
  if (!order) notFound();

  const [region, customer] = await Promise.all([
    deliveryRepository.getById(ctx, order.deliveryRegionId),
    userRepository.getById(ctx, order.customerId).catch(() => null),
  ]);

  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
  const canUpdateStatus = can(ctx.role, 'update_order_status');
  const action = updateOrderStatusAction.bind(null, locale, order.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wide text-ink">{order.orderNumber}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{ORDER_STATUS_LABELS[order.status][locale]}</Badge>
          <a
            href={`/api/orders/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {locale === 'en' ? 'Download invoice' : 'تحميل الفاتورة'}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink-muted">{locale === 'en' ? 'Customer' : 'العميل'}</p>
          <p className="font-semibold text-ink">{customer?.fullName ?? order.customerId}</p>
        </div>
        <div>
          <p className="text-ink-muted">{locale === 'en' ? 'Delivery area' : 'منطقة التوصيل'}</p>
          <p className="font-semibold text-ink">{region?.name[locale] ?? '—'}</p>
        </div>
        <div>
          <p className="text-ink-muted">{locale === 'en' ? 'Payment' : 'الدفع'}</p>
          <p className="font-semibold text-ink">
            {order.paymentMethod} · {order.paymentStatus}
          </p>
        </div>
        <div>
          <p className="text-ink-muted">{locale === 'en' ? 'Placed' : 'تاريخ الطلب'}</p>
          <p className="font-semibold text-ink">{new Date(order.createdAt).toLocaleString(locale)}</p>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        {order.items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between border-b border-border py-2 last:border-0">
            <span className="text-ink">
              {item.nameSnapshot[locale]} × {item.quantity}
            </span>
            <span className="font-mono text-ink">{formatMoney(item.lineTotal, locale)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold text-ink">
          <span>{locale === 'en' ? 'Total' : 'الإجمالي'}</span>
          <span className="font-mono">{formatMoney(order.totals.total, locale)}</span>
        </div>
      </div>

      {canUpdateStatus && nextStatuses.length > 0 && (
        <form action={action} className="flex items-center gap-2">
          <select name="status" className="h-10 rounded-card border border-border bg-surface px-3 text-sm text-ink" defaultValue={nextStatuses[0]}>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s][locale]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" size="sm">
            {locale === 'en' ? 'Update status' : 'تحديث الحالة'}
          </Button>
        </form>
      )}
    </div>
  );
}
