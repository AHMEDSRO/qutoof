import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Product, PublicProduct } from '@/lib/types/product';
import { PriceTag } from './PriceTag';

export function ProductCard({
  product,
  locale,
}: {
  product: Product | PublicProduct;
  locale: Locale;
}) {
  const outOfStock = product.quantityInStock <= 0;

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group relative block rounded-card border border-tag-border bg-tag p-3 transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* punch-hole notch — the tag-hanging detail */}
      <span
        aria-hidden
        className="absolute start-3 top-3 z-10 h-3 w-3 rounded-full border border-tag-border bg-surface-muted"
      />
      <span className="absolute end-3 top-3 z-10 rotate-3 rounded-tag border border-primary/30 bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
        {product.countryOfOrigin}
      </span>

      <div className="relative mt-2 aspect-square overflow-hidden rounded-tag bg-surface-muted">
        <Image
          src={product.images[0]?.url ?? 'https://placehold.co/600x400.png'}
          alt={locale === 'ar' ? product.images[0]?.altAr ?? product.name.ar : product.images[0]?.altEn ?? product.name.en}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm font-semibold uppercase tracking-wide text-surface">
            {locale === 'en' ? 'Out of stock' : 'غير متوفر'}
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-1 font-semibold text-ink">{product.name[locale]}</h3>
      <p className="text-xs text-ink-muted">{product.sizeWeight}</p>
      <div className="mt-2">
        <PriceTag locale={locale} price={product.price} unit={product.unit} />
      </div>
    </Link>
  );
}
