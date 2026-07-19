'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Product, PublicProduct } from '@/lib/types/product';
import { useCart } from '@/lib/cart/cart-context';
import { buildLineItem, calculateTotals } from '@/lib/pricing/pricing';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { buttonVariants } from '@/components/ui/Button';

export default function CartPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const { items } = useCart();
  const [products, setProducts] = useState<(Product | PublicProduct)[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetch(`/api/products?ids=${items.map((i) => i.productId).join(',')}`)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setLoaded(true));
  }, [items]);

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const lineItem = buildLineItem(product, item.quantity);
      return { product, quantity: item.quantity, lineItem };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const totals = calculateTotals(
    lines.map((l) => l.lineItem),
    0
  );

  const t = {
    title: locale === 'en' ? 'Your cart' : 'سلتك',
    empty: locale === 'en' ? 'Your cart is empty.' : 'سلتك فاضية.',
    browse: locale === 'en' ? 'Browse vegetables' : 'تصفح الخضار',
    checkout: locale === 'en' ? 'Proceed to checkout' : 'استكمال الدفع',
  };

  if (!loaded) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-wide text-ink">{t.title}</h1>

      {lines.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-ink-muted">{t.empty}</p>
          <Link href={`/${locale}/vegetables`} className={buttonVariants({ variant: 'primary', className: 'mt-4' })}>
            {t.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {lines.map((l) => (
              <CartItemRow
                key={l.product.id}
                product={l.product}
                quantity={l.quantity}
                unitPrice={l.lineItem.unitPriceSnapshot}
                lineTotal={l.lineItem.lineTotal}
                locale={locale}
              />
            ))}
          </div>
          <div className="space-y-4">
            <CartSummary totals={totals} locale={locale} deliveryPending />
            <Link href={`/${locale}/checkout`} className={buttonVariants({ variant: 'accent', size: 'lg', className: 'w-full' })}>
              {t.checkout}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
