import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { productRepository, categoryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { can } from '@/lib/rbac/permissions';
import { formatMoney } from '@/lib/format';
import { deleteProductAction, toggleProductActiveAction } from '@/lib/dashboard/product-actions';
import { DataTable } from '@/components/dashboard/DataTable';
import { RoleGate } from '@/components/dashboard/RoleGate';
import { ProductRowActions } from '@/components/dashboard/ProductRowActions';
import { buttonVariants } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default async function DashboardProductsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ctx = await getRequestContext();
  const showCost = can(ctx.role, 'view_cost_price');
  const canEdit = can(ctx.role, 'edit_products');

  const [products, categories] = await Promise.all([
    productRepository.list(ctx, { includeInactive: true }),
    categoryRepository.list(ctx),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Products' : 'المنتجات'}</h2>
        <div className="flex gap-2">
          <RoleGate role={ctx.role} action="bulk_import_products">
            <Link href={`/${locale}/dashboard/products/import`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {locale === 'en' ? 'Import Excel' : 'استيراد Excel'}
            </Link>
          </RoleGate>
          <RoleGate role={ctx.role} action="edit_products">
            <Link href={`/${locale}/dashboard/products/new`} className={buttonVariants({ variant: 'accent', size: 'sm' })}>
              {locale === 'en' ? 'New product' : 'منتج جديد'}
            </Link>
          </RoleGate>
        </div>
      </div>

      <DataTable
        rowKey={(p) => p.id}
        emptyMessage={locale === 'en' ? 'No products.' : 'لا يوجد منتجات.'}
        rows={products}
        columns={[
          {
            header: locale === 'en' ? 'Product' : 'المنتج',
            render: (p) => (
              <Link href={`/${locale}/dashboard/products/${p.id}/edit`} className="flex items-center gap-2 px-4 py-2 hover:underline">
                <span className={`font-semibold ${p.isActive ? 'text-ink' : 'text-ink-muted line-through'}`}>{p.name[locale]}</span>
                {p.quantityInStock <= p.lowStockThreshold && <Badge variant="accent">{locale === 'en' ? 'Low stock' : 'منخفض'}</Badge>}
                {!p.isActive && <Badge variant="neutral">{locale === 'en' ? 'Hidden' : 'مخفي'}</Badge>}
              </Link>
            ),
          },
          {
            header: locale === 'en' ? 'Category' : 'التصنيف',
            render: (p) => categories.find((c) => c.id === p.categoryId)?.name[locale] ?? '—',
          },
          { header: locale === 'en' ? 'Origin' : 'المنشأ', render: (p) => p.countryOfOrigin },
          { header: locale === 'en' ? 'Stock' : 'المخزون', render: (p) => <span className="font-mono">{p.quantityInStock}</span> },
          ...(showCost
            ? [
                {
                  header: locale === 'en' ? 'Cost' : 'التكلفة',
                  render: (p: (typeof products)[number]) =>
                    'costPrice' in p ? <span className="font-mono">{formatMoney(p.costPrice, locale)}</span> : '—',
                },
              ]
            : []),
          {
            header: locale === 'en' ? 'Type' : 'النوع',
            render: (p) => (
              <Badge variant={p.listingType === 'wholesale' ? 'accent' : 'primary'}>
                {p.listingType === 'wholesale' ? (locale === 'en' ? 'Wholesale' : 'جملة') : locale === 'en' ? 'Retail' : 'قطاعي'}
              </Badge>
            ),
          },
          {
            header: locale === 'en' ? 'Price' : 'السعر',
            render: (p) => (
              <span className="font-mono">
                {formatMoney(p.price, locale)} / {p.unit}
              </span>
            ),
          },
          ...(canEdit
            ? [
                {
                  header: locale === 'en' ? 'Actions' : 'إجراءات',
                  render: (p: (typeof products)[number]) => (
                    <ProductRowActions
                      locale={locale}
                      isActive={p.isActive}
                      toggleAction={toggleProductActiveAction.bind(null, locale, p.id, !p.isActive)}
                      deleteAction={deleteProductAction.bind(null, locale, p.id)}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
