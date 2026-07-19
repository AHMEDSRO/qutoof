import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { productRepository, categoryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { UNIT_LABELS } from '@/lib/i18n/units';
import { COUNTRY_LABELS } from '@/lib/data/countries';
import { buildMetadata } from '@/lib/seo/metadata';
import { productJsonLd } from '@/lib/seo/structured-data';
import { PriceTag } from '@/components/storefront/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

interface Props {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  const product = await productRepository.getBySlug(ctx, params.slug);
  if (!product) return {};

  return buildMetadata({
    locale,
    path: `/product/${product.slug}`,
    title: `${product.name[locale]} | Qutoof`,
    description: product.description[locale],
  });
}

export default async function ProductPage({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const ctx = await getRequestContext();

  const product = await productRepository.getBySlug(ctx, params.slug);
  if (!product) notFound();

  const categories = await categoryRepository.list(ctx);
  const category = categories.find((c) => c.id === product.categoryId);
  const countryLabel = COUNTRY_LABELS[product.countryOfOrigin]?.[locale] ?? product.countryOfOrigin;
  const image = product.images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, locale)) }}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-card bg-surface-muted">
          {image && (
            <Image
              src={image.url}
              alt={locale === 'ar' ? image.altAr : image.altEn}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          )}
        </div>

        <div>
          {category && <Badge variant="primary">{category.name[locale]}</Badge>}
          <h1 className="mt-3 font-display text-3xl tracking-wide text-ink">{product.name[locale]}</h1>
          <p className="mt-2 text-ink-muted">{product.description[locale]}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Country of origin' : 'بلد المنشأ'}</dt>
              <dd className="font-semibold text-ink">{countryLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Size / weight' : 'الحجم / الوزن'}</dt>
              <dd className="font-semibold text-ink">{product.sizeWeight}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Sold by' : 'وحدة البيع'}</dt>
              <dd className="font-semibold text-ink">{UNIT_LABELS[product.unit][locale]}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{locale === 'en' ? 'Availability' : 'التوفر'}</dt>
              <dd className="font-semibold text-ink">
                {product.quantityInStock > 0
                  ? locale === 'en'
                    ? 'In stock'
                    : 'متوفر'
                  : locale === 'en'
                    ? 'Out of stock'
                    : 'غير متوفر'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-card border border-tag-border bg-tag p-4">
            <PriceTag locale={locale} price={product.price} unit={product.unit} />
          </div>

          <div className="mt-6">
            <AddToCartButton productId={product.id} locale={locale} disabled={product.quantityInStock <= 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
