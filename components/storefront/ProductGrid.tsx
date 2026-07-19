import type { Locale } from '@/lib/i18n/config';
import type { Product, PublicProduct } from '@/lib/types/product';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  locale,
  emptyMessage,
}: {
  products: (Product | PublicProduct)[];
  locale: Locale;
  emptyMessage: string;
}) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
