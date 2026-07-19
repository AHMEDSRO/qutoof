import type { Product, PublicProduct } from '@/lib/types/product';
import type { Locale } from '@/lib/i18n/config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function productJsonLd(product: Product | PublicProduct, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[locale],
    description: product.description[locale],
    image: product.images.map((i) => i.url),
    sku: product.id,
    countryOfOrigin: product.countryOfOrigin,
    offers: {
      '@type': 'Offer',
      url: `${APP_URL}/${locale}/product/${product.slug}`,
      priceCurrency: 'AED',
      price: product.price,
      availability:
        product.quantityInStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}
