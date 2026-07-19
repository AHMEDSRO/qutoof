import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { notFound } from 'next/navigation';
import { productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { can } from '@/lib/rbac/permissions';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const ctx = await getRequestContext();
  const showWholesale = can(ctx.role, 'view_wholesale_pricing');

  const products = await productRepository.list(ctx);
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              {locale === 'en' ? 'Fresh off the crate' : 'طازة من الصندوق'}
            </span>
            <h1 className="mt-3 font-display text-4xl leading-tight tracking-wide sm:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-4 max-w-md text-lg text-primary-foreground/80">{dict.home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/vegetables`} className={buttonVariants({ variant: 'accent', size: 'lg' })}>
                {dict.nav.vegetables}
              </Link>
              <Link
                href={`/${locale}/wholesale`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10'
                )}
              >
                {dict.nav.wholesale}
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="flex flex-col items-end gap-4">
              {featured.map((product, i) => (
                <div
                  key={product.id}
                  className="w-56 rotate-2 rounded-card border border-tag-border bg-tag p-3 shadow-lg"
                  style={{ transform: `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})`, marginInlineEnd: `${i * 24}px` }}
                >
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {product.countryOfOrigin}
                  </span>
                  <p className="font-semibold text-ink">{product.name[locale]}</p>
                  <p className="font-mono text-sm text-ink-muted">{product.sizeWeight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl tracking-wide text-ink">
          {locale === 'en' ? 'Today on the stall' : 'اليوم عالبسطة'}
        </h2>
        <div className="mt-6">
          <ProductGrid
            products={products}
            locale={locale}
            showWholesale={showWholesale}
            emptyMessage={locale === 'en' ? 'No products yet.' : 'لا يوجد منتجات بعد.'}
          />
        </div>
      </section>
    </>
  );
}
