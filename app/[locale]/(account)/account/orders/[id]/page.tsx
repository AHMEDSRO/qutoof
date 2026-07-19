import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { orderRepository, deliveryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

export default async function OrderDetailPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();

  const order = await orderRepository.getById(ctx, params.id).catch(() => null);
  if (!order) notFound();

  const region = await deliveryRepository.getById(ctx, order.deliveryRegionId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-wide text-ink">{order.orderNumber}</h1>
        <Badge variant="primary">{ORDER_STATUS_LABELS[order.status][locale]}</Badge>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-sm text-ink-muted">{new Date(order.createdAt).toLocaleString(locale)}</p>
        <a
          href={`/api/orders/${order.id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {locale === 'en' ? 'Download invoice' : 'تحميل الفاتورة'}
        </a>
      </div>

      <div className="mt-6 rounded-card border border-border bg-surface p-4">
        {order.items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between border-b border-border py-3 last:border-0">
            <div>
              <p className="font-semibold text-ink">{item.nameSnapshot[locale]}</p>
              <p className="font-mono text-xs text-ink-muted">
                {item.quantity} × {formatMoney(item.unitPriceSnapshot, locale)}
              </p>
            </div>
            <span className="font-mono font-semibold text-ink">{formatMoney(item.lineTotal, locale)}</span>
          </div>
        ))}

        <dl className="mt-4 space-y-1 text-sm text-ink-muted">
          <div className="flex justify-between">
            <dt>{locale === 'en' ? 'Subtotal' : 'الإجمالي الفرعي'}</dt>
            <dd className="font-mono">{formatMoney(order.totals.subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{locale === 'en' ? 'VAT' : 'ضريبة القيمة المضافة'}</dt>
            <dd className="font-mono">{formatMoney(order.totals.vatAmount, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{locale === 'en' ? 'Delivery' : 'التوصيل'}</dt>
            <dd className="font-mono">{formatMoney(order.totals.deliveryFee, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
            <dt>{locale === 'en' ? 'Total' : 'الإجمالي'}</dt>
            <dd className="font-mono">{formatMoney(order.totals.total, locale)}</dd>
          </div>
        </dl>
      </div>

      {region && (
        <p className="mt-4 text-sm text-ink-muted">
          {locale === 'en' ? 'Delivering to' : 'التوصيل إلى'} {region.name[locale]}
        </p>
      )}

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {locale === 'en' ? 'Status history' : 'سجل الحالة'}
        </p>
        <ol className="mt-2 space-y-1 text-sm text-ink-muted">
          {order.statusHistory.map((event, i) => (
            <li key={i} className="font-mono">
              {ORDER_STATUS_LABELS[event.status][locale]} — {new Date(event.at).toLocaleString(locale)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
