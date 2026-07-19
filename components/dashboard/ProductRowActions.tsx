'use client';

import type { Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/Button';

export function ProductRowActions({
  locale,
  isActive,
  toggleAction,
  deleteAction,
}: {
  locale: Locale;
  isActive: boolean;
  toggleAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2" onClick={(e) => e.stopPropagation()}>
      <form action={toggleAction}>
        <Button type="submit" size="sm" variant="outline">
          {isActive ? (locale === 'en' ? 'Hide' : 'إخفاء') : locale === 'en' ? 'Show' : 'إظهار'}
        </Button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(locale === 'en' ? 'Delete this product permanently?' : 'حذف هذا المنتج نهائيًا؟')) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" size="sm" variant="ghost" className="text-accent hover:bg-accent/10">
          {locale === 'en' ? 'Delete' : 'حذف'}
        </Button>
      </form>
    </div>
  );
}
