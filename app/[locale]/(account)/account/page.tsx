import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLE_LABELS, isStaffRole } from '@/lib/rbac/roles';
import { EMIRATE_LABELS } from '@/lib/types/common';
import { formatMoney } from '@/lib/format';
import { buttonVariants } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function AccountPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const user = await getCurrentUser();

  // Staff never see the customer profile page — every staff role lands on the dashboard instead.
  if (user && isStaffRole(user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl tracking-wide text-ink">
          {locale === 'en' ? "You're not signed in" : 'مش مسجل دخول'}
        </h1>
        <p className="mt-2 text-ink-muted">
          {locale === 'en' ? 'Log in to see your orders and account details.' : 'سجل دخول عشان تشوف طلباتك وبيانات حسابك.'}
        </p>
        <Link href={`/${locale}/login`} className={buttonVariants({ variant: 'primary', className: 'mt-4' })}>
          {locale === 'en' ? 'Log in' : 'تسجيل الدخول'}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-ink">{locale === 'en' ? 'My account' : 'حسابي'}</h1>
        <Badge variant="primary">{ROLE_LABELS[user.role][locale]}</Badge>
      </div>

      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <p className="font-semibold text-ink">{user.fullName}</p>
        <p className="text-sm text-ink-muted">{user.email}</p>
        {user.phone && <p className="text-sm text-ink-muted">{user.phone}</p>}

        {user.role === 'retail_customer' && user.addresses[0] && (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="font-semibold text-ink">{locale === 'en' ? 'Delivery address' : 'عنوان التوصيل'}</p>
            <p className="text-ink-muted">
              {user.addresses[0].street}, {user.addresses[0].area}, {EMIRATE_LABELS[user.addresses[0].emirate][locale]}
            </p>
          </div>
        )}

        {user.role === 'wholesale_customer' && (
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <p className="font-semibold text-ink">{user.businessName}</p>
            <div className="flex justify-between text-ink-muted">
              <span>{locale === 'en' ? 'Credit limit' : 'حد الائتمان'}</span>
              <span className="font-mono">{formatMoney(user.creditLimit.limit, locale)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>{locale === 'en' ? 'Available credit' : 'الائتمان المتاح'}</span>
              <span className="font-mono">{formatMoney(user.creditLimit.availableCredit, locale)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link href={`/${locale}/account/orders`} className={buttonVariants({ variant: 'outline' })}>
          {locale === 'en' ? 'Order history' : 'سجل الطلبات'}
        </Link>
        <SignOutButton locale={locale} />
      </div>
    </div>
  );
}
