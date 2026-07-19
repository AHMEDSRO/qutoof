import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { categoryRepository, productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import type { CategoryType } from '@/lib/types/category';
import { CategoryNav } from './CategoryNav';
import { Filters } from './Filters';
import { ProductGrid } from './ProductGrid';

export async function CategoryListingPage({
  locale,
  type,
  activeSubcategorySlug,
  searchParams,
}: {
  locale: Locale;
  type: CategoryType;
  activeSubcategorySlug?: string;
  searchParams: Record<string, string | undefined>;
}) {
  const dict = await getDictionary(locale);
  const ctx = await getRequestContext();

  const allCategories = await categoryRepository.list(ctx);
  const topCategory = allCategories.find((c) => c.type === type && c.parentId === null);
  const subcategories = allCategories.filter((c) => c.type === type && c.parentId !== null);

  let activeCategoryId: string | undefined;
  if (activeSubcategorySlug) {
    const active = subcategories.find((c) => c.slug === activeSubcategorySlug);
    if (!active) notFound();
    activeCategoryId = active.id;
  }

  const categoryIds = activeCategoryId
    ? [activeCategoryId]
    : [topCategory?.id, ...subcategories.map((c) => c.id)].filter(Boolean) as string[];

  const products = await productRepository.list(ctx, {
    listingType: 'retail',
    countryOfOrigin: searchParams.country,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  });
  const filtered = products.filter((p) => categoryIds.includes(p.categoryId));

  const title = type === 'vegetables' ? dict.nav.vegetables : dict.nav.fruits;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-wide text-ink">{title}</h1>
      <div className="mt-4">
        <CategoryNav locale={locale} parentSlug={type} categories={subcategories} activeSlug={activeSubcategorySlug} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <Filters locale={locale} />
        </aside>
        <ProductGrid
          products={filtered}
          locale={locale}
          emptyMessage={locale === 'en' ? 'No products match these filters.' : 'لا يوجد منتجات مطابقة.'}
        />
      </div>
    </div>
  );
}
