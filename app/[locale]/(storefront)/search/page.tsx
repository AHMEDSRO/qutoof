import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { SearchBar } from '@/components/storefront/SearchBar';
import { ProductGrid } from '@/components/storefront/ProductGrid';

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const ctx = await getRequestContext();
  const query = searchParams.q ?? '';

  const products = query ? await productRepository.list(ctx, { listingType: 'retail', search: query }) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-wide text-ink">{dict.nav.search}</h1>
      <div className="mt-4">
        <SearchBar locale={locale} placeholder={dict.nav.search} defaultValue={query} />
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        {query
          ? locale === 'en'
            ? `${products.length} result(s) for "${query}"`
            : `${products.length} نتيجة عن "${query}"`
          : locale === 'en'
            ? 'Type something to search.'
            : 'اكتب حاجة عشان تدور.'}
      </p>
      <div className="mt-6">
        <ProductGrid
          products={products}
          locale={locale}
          emptyMessage={locale === 'en' ? 'No results.' : 'مفيش نتايج.'}
        />
      </div>
    </div>
  );
}
