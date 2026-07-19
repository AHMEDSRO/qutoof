import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { userRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { formatMoney } from '@/lib/format';
import { updateCreditLimitAction } from '@/lib/dashboard/customer-actions';
import { DataTable } from '@/components/dashboard/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { RetailProfile, WholesaleProfile } from '@/lib/types/user';

export default async function CustomersPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'view_reports', `/${locale}/dashboard`);
  const canEditCreditLimit = ctx.role === 'super_admin';

  const users = await userRepository.list(ctx);
  const customers = users.filter(
    (u): u is RetailProfile | WholesaleProfile => u.role === 'retail_customer' || u.role === 'wholesale_customer'
  );
  const sorted = [...customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Customers' : 'العملاء'}</h2>

      <DataTable
        rowKey={(c) => c.id}
        emptyMessage={locale === 'en' ? 'No customers yet.' : 'لا يوجد عملاء بعد.'}
        rows={sorted}
        columns={[
          {
            header: locale === 'en' ? 'Customer' : 'العميل',
            render: (c) => (
              <Link href={`/${locale}/dashboard/customers/${c.id}`} className="block hover:underline">
                <p className="font-semibold text-ink">{c.role === 'wholesale_customer' ? c.businessName : c.fullName}</p>
                {c.role === 'wholesale_customer' && <p className="text-xs text-ink-muted">{c.fullName}</p>}
              </Link>
            ),
          },
          {
            header: locale === 'en' ? 'Type' : 'النوع',
            render: (c) => (
              <Badge variant={c.role === 'wholesale_customer' ? 'accent' : 'primary'}>
                {c.role === 'wholesale_customer' ? (locale === 'en' ? 'Wholesale' : 'جملة') : locale === 'en' ? 'Retail' : 'قطاعي'}
              </Badge>
            ),
          },
          { header: locale === 'en' ? 'Email' : 'الإيميل', render: (c) => c.email },
          { header: locale === 'en' ? 'Phone' : 'الهاتف', render: (c) => c.phone ?? '—' },
          {
            header: locale === 'en' ? 'Credit limit' : 'حد الائتمان',
            render: (c) => {
              if (c.role !== 'wholesale_customer') return '—';
              return canEditCreditLimit ? (
                <form action={updateCreditLimitAction.bind(null, locale, c.id)} className="flex items-center gap-2">
                  <Input name="limit" type="number" min={0} step="100" defaultValue={c.creditLimit.limit} className="w-28" />
                  <Button type="submit" size="sm" variant="outline">
                    {locale === 'en' ? 'Save' : 'حفظ'}
                  </Button>
                </form>
              ) : (
                <span className="font-mono">{formatMoney(c.creditLimit.limit, locale)}</span>
              );
            },
          },
          {
            header: locale === 'en' ? 'Balance due' : 'المستحق',
            render: (c) => (c.role === 'wholesale_customer' ? <span className="font-mono">{formatMoney(c.creditLimit.currentBalance, locale)}</span> : '—'),
          },
        ]}
      />
    </div>
  );
}
