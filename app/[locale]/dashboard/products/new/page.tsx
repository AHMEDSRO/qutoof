import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { categoryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { createProductAction } from '@/lib/dashboard/product-actions';
import { ProductForm } from '@/components/dashboard/ProductForm';

export default async function NewProductPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'edit_products', `/${locale}/dashboard`);

  const categories = await categoryRepository.list(ctx);
  const action = createProductAction.bind(null, locale);

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'New product' : 'منتج جديد'}</h2>
      <ProductForm
        locale={locale}
        categories={categories}
        action={action}
        submitLabel={locale === 'en' ? 'Create product' : 'إنشاء المنتج'}
      />
    </div>
  );
}
