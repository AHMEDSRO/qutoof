'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Product, PublicProduct } from '@/lib/types/product';
import type { DeliveryRegion } from '@/lib/types/delivery';
import type { PaymentMethod } from '@/lib/types/order';
import { EMIRATE_LABELS } from '@/lib/types/common';
import { useCart } from '@/lib/cart/cart-context';
import { buildLineItem, calculateTotals, type AccountType } from '@/lib/pricing/pricing';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';

export default function CheckoutPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const router = useRouter();
  const { items, clear } = useCart();

  const [products, setProducts] = useState<(Product | PublicProduct)[]>([]);
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [accountType, setAccountType] = useState<AccountType>('retail');
  const [regionId, setRegionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session + delivery regions only need to load once.
  useEffect(() => {
    Promise.all([
      fetch('/api/session').then((r) => r.json()),
      fetch('/api/delivery-regions').then((r) => r.json()),
    ]).then(([session, regionList]) => {
      const type: AccountType = session.role === 'wholesale_customer' ? 'wholesale' : 'retail';
      setAccountType(type);
      setPaymentMethod(type === 'wholesale' ? 'invoice_credit' : 'bank_transfer');
      setRegions(regionList);
      if (regionList[0]) setRegionId(regionList[0].id);
      setSessionLoaded(true);
    });
  }, []);

  // Cart hydrates from localStorage asynchronously (see CartProvider), so this must
  // react to `items` rather than run once — otherwise it can fetch against an empty cart.
  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setProductsLoaded(true);
      return;
    }
    setProductsLoaded(false);
    fetch(`/api/products?ids=${items.map((i) => i.productId).join(',')}`)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setProductsLoaded(true));
  }, [items]);

  const loaded = sessionLoaded && productsLoaded;

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? buildLineItem(product, item.quantity) : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const selectedRegion = regions.find((r) => r.id === regionId);
  const totals = calculateTotals(lines, selectedRegion?.deliveryFee ?? 0);

  const paymentOptions: { value: PaymentMethod; label: string; disabled?: boolean }[] =
    accountType === 'wholesale'
      ? [
          { value: 'invoice_credit', label: locale === 'en' ? 'Invoice / credit account' : 'فاتورة آجلة' },
          { value: 'bank_transfer', label: locale === 'en' ? 'Bank transfer' : 'تحويل بنكي' },
        ]
      : [
          { value: 'card', label: locale === 'en' ? 'Card (Stripe — coming soon)' : 'بطاقة (Stripe — قريبًا)', disabled: true },
          { value: 'bank_transfer', label: locale === 'en' ? 'Bank transfer' : 'تحويل بنكي' },
        ];

  async function handleSubmit() {
    if (!regionId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          deliveryRegionId: regionId,
          paymentMethod,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Checkout failed');
      }
      const order = await res.json();
      clear();
      router.push(`/${locale}/account/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-muted">
        {locale === 'en' ? 'Your cart is empty.' : 'سلتك فاضية.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-wide text-ink">{locale === 'en' ? 'Checkout' : 'الدفع'}</h1>

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">
            {locale === 'en' ? 'Delivery area' : 'منطقة التوصيل'}
          </label>
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name[locale]} — {EMIRATE_LABELS[r.emirate][locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">
            {locale === 'en' ? 'Payment method' : 'طريقة الدفع'}
          </label>
          <div className="space-y-2">
            {paymentOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  disabled={opt.disabled}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <CartSummary totals={totals} locale={locale} />

        {error && <p className="text-sm text-accent">{error}</p>}

        <Button variant="accent" size="lg" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? locale === 'en'
              ? 'Placing order…'
              : 'جاري تنفيذ الطلب…'
            : locale === 'en'
              ? 'Place order'
              : 'تأكيد الطلب'}
        </Button>
      </div>
    </div>
  );
}
