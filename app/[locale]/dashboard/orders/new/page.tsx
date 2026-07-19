import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { userRepository, productRepository, deliveryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { createWholesaleOrderAction } from '@/lib/dashboard/order-actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default async function NewWholesaleOrderPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'create_wholesale_order', `/${locale}/dashboard`);

  const [users, products, regions] = await Promise.all([
    userRepository.list(ctx).catch(() => []),
    productRepository.list(ctx, { listingType: 'wholesale' }),
    deliveryRepository.list(ctx),
  ]);
  const wholesaleCustomers = users.filter((u) => u.role === 'wholesale_customer');
  const salesReps = users.filter((u) => u.role === 'sales_rep');

  const action = createWholesaleOrderAction.bind(null, locale);

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-xl tracking-wide text-ink">
        {locale === 'en' ? 'New wholesale order' : 'أوردر جملة جديد'}
      </h2>

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={locale === 'en' ? 'Customer' : 'العميل'}>
            <select name="customerId" required className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink">
              {wholesaleCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.role === 'wholesale_customer' ? c.businessName : c.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === 'en' ? 'Sales rep' : 'موظف المبيعات'}>
            <select
              name="salesRepId"
              defaultValue={ctx.role === 'sales_rep' ? ctx.userId : ''}
              className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink"
            >
              <option value="">{locale === 'en' ? 'Unassigned' : 'غير محدد'}</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={locale === 'en' ? 'Delivery area' : 'منطقة التوصيل'}>
            <select name="deliveryRegionId" required className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink">
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name[locale]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === 'en' ? 'Payment method' : 'طريقة الدفع'}>
            <select name="paymentMethod" required className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink">
              <option value="invoice_credit">{locale === 'en' ? 'Invoice / credit' : 'فاتورة آجلة'}</option>
              <option value="bank_transfer">{locale === 'en' ? 'Bank transfer' : 'تحويل بنكي'}</option>
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{locale === 'en' ? 'Line items' : 'بنود الطلب'}</p>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_100px] gap-2">
                <select name={`productId_${i}`} className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink">
                  <option value="">{locale === 'en' ? '— none —' : '— بدون —'}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name[locale]} ({p.price} AED)
                    </option>
                  ))}
                </select>
                <Input name={`quantity_${i}`} type="number" min={0} placeholder={locale === 'en' ? 'Qty' : 'كمية'} />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" variant="accent">
          {locale === 'en' ? 'Create order' : 'إنشاء الطلب'}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
