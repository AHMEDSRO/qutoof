import type { Locale } from '@/lib/i18n/config';
import type { Category } from '@/lib/types/category';
import type { Product, PublicProduct } from '@/lib/types/product';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ProductForm({
  locale,
  categories,
  action,
  submitLabel,
  defaultValues,
}: {
  locale: Locale;
  categories: Category[];
  action: (formData: FormData) => void;
  submitLabel: string;
  defaultValues?: Product | PublicProduct;
}) {
  const costPrice = defaultValues && 'costPrice' in defaultValues ? defaultValues.costPrice : undefined;
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label={locale === 'en' ? 'Name (English)' : 'الاسم (إنجليزي)'}>
          <Input name="nameEn" required defaultValue={defaultValues?.name.en} />
        </Field>
        <Field label={locale === 'en' ? 'Name (Arabic)' : 'الاسم (عربي)'}>
          <Input name="nameAr" required dir="rtl" defaultValue={defaultValues?.name.ar} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={locale === 'en' ? 'Description (English)' : 'الوصف (إنجليزي)'}>
          <Input name="descriptionEn" defaultValue={defaultValues?.description.en} />
        </Field>
        <Field label={locale === 'en' ? 'Description (Arabic)' : 'الوصف (عربي)'}>
          <Input name="descriptionAr" dir="rtl" defaultValue={defaultValues?.description.ar} />
        </Field>
      </div>

      <Field label={locale === 'en' ? 'Category' : 'التصنيف'}>
        <select
          name="categoryId"
          required
          defaultValue={defaultValues?.categoryId}
          className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink"
        >
          {categories
            .filter((c) => c.parentId !== null)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[locale]}
              </option>
            ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label={locale === 'en' ? 'Country of origin' : 'بلد المنشأ'}>
          <Input name="countryOfOrigin" placeholder="EG" required defaultValue={defaultValues?.countryOfOrigin} />
        </Field>
        <Field label={locale === 'en' ? 'Size / weight' : 'الحجم / الوزن'}>
          <Input name="sizeWeight" placeholder="1kg" required defaultValue={defaultValues?.sizeWeight} />
        </Field>
        <Field label={locale === 'en' ? 'Unit' : 'الوحدة'}>
          <select
            name="unit"
            required
            defaultValue={defaultValues?.unit ?? 'kg'}
            className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="piece">piece</option>
            <option value="box">box</option>
            <option value="bunch">bunch</option>
          </select>
        </Field>
      </div>

      <Field label={locale === 'en' ? 'Listing type' : 'نوع البيع'}>
        <select
          name="listingType"
          required
          defaultValue={defaultValues?.listingType ?? 'retail'}
          className="h-10 w-full rounded-card border border-border bg-surface px-3 text-sm text-ink"
        >
          <option value="retail">{locale === 'en' ? 'Retail' : 'قطاعي'}</option>
          <option value="wholesale">{locale === 'en' ? 'Wholesale' : 'جملة'}</option>
        </select>
        <p className="mt-1 text-xs text-ink-muted">
          {locale === 'en'
            ? 'To sell the same item both ways, add it twice — once per listing type.'
            : 'لو عايز تبيع نفس الصنف قطاعي وجملة، ضيفه مرتين — مرة لكل نوع.'}
        </p>
      </Field>

      <Field label={locale === 'en' ? 'Image URL' : 'رابط الصورة'}>
        <Input
          name="imageUrl"
          type="url"
          required
          placeholder="https://placehold.co/600x400.png"
          defaultValue={defaultValues?.images[0]?.url}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={locale === 'en' ? 'Cost price (AED)' : 'سعر التكلفة'}>
          <Input name="costPrice" type="number" step="0.01" min={0} required defaultValue={costPrice} />
        </Field>
        <Field label={locale === 'en' ? 'Price (AED)' : 'السعر'}>
          <Input name="price" type="number" step="0.01" min={0} required defaultValue={defaultValues?.price} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={locale === 'en' ? 'Quantity in stock' : 'الكمية المتاحة'}>
          <Input name="quantityInStock" type="number" min={0} required defaultValue={defaultValues?.quantityInStock} />
        </Field>
        <Field label={locale === 'en' ? 'Low stock threshold' : 'حد التنبيه'}>
          <Input
            name="lowStockThreshold"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.lowStockThreshold ?? 20}
          />
        </Field>
      </div>

      <Button type="submit" variant="accent">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
