import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { categoryRepository, productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { requirePermission } from '@/lib/rbac/guard';
import { updateProductAction } from '@/lib/dashboard/product-actions';
import { ProductForm } from '@/components/dashboard/ProductForm';

export default async function EditProductPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  requirePermission(ctx, 'edit_products', `/${locale}/dashboard`);

  const [categories, product] = await Promise.all([
    categoryRepository.list(ctx),
    productRepository.getById(ctx, params.id),
  ]);
  if (!product) notFound();

  const action = updateProductAction.bind(null, locale, params.id);

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Edit product' : 'تعديل المنتج'}</h2>
      <ProductForm
        locale={locale}
        categories={categories}
        action={action}
        submitLabel={locale === 'en' ? 'Save changes' : 'حفظ التعديلات'}
        defaultValues={product}
      />
    </div>
  );
}
