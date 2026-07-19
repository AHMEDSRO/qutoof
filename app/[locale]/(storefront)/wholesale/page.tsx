import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { can } from '@/lib/rbac/permissions';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { buttonVariants } from '@/components/ui/Button';

export default async function WholesalePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  const showWholesale = can(ctx.role, 'view_wholesale_pricing');

  const products = showWholesale
    ? (await productRepository.list(ctx, { listingType: 'wholesale' }))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        {locale === 'en' ? 'B2B' : 'الجملة'}
      </span>
      <h1 className="mt-2 font-display text-3xl tracking-wide text-ink">
        {locale === 'en' ? 'Wholesale / Bulk Buy' : 'الجملة'}
      </h1>

      {!showWholesale ? (
        <div className="mt-6 max-w-lg rounded-card border border-tag-border bg-tag p-6">
          <p className="text-ink">
            {locale === 'en'
              ? 'Wholesale pricing is available to approved business accounts. Registration is instant — a trade license can be added later to build trust.'
              : 'أسعار الجملة متاحة لحسابات الأعمال المعتمدة. التسجيل فوري — وتقدر ترفع الرخصة التجارية بعدين لرفع مستوى الثقة.'}
          </p>
          <Link href={`/${locale}/register/wholesale`} className={buttonVariants({ variant: 'accent', className: 'mt-4' })}>
            {locale === 'en' ? 'Register as wholesale' : 'سجل كتاجر جملة'}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid
            products={products}
            locale={locale}
            emptyMessage={locale === 'en' ? 'No wholesale products yet.' : 'لا يوجد منتجات جملة بعد.'}
          />
        </div>
      )}
    </div>
  );
}
