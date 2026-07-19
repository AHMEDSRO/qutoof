'use client';

import { useState, type ChangeEvent } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { parseProductWorkbook, type NewProduct, type ImportRowError } from '@/lib/excel/product-import';
import type { Category } from '@/lib/types/category';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function ImportProductsPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const [validRows, setValidRows] = useState<NewProduct[]>([]);
  const [errors, setErrors] = useState<ImportRowError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const [buffer, categories] = await Promise.all([
        file.arrayBuffer(),
        fetch('/api/categories').then((r) => r.json()) as Promise<Category[]>,
      ]);
      const parsed = parseProductWorkbook(buffer, categories);
      setValidRows(parsed.valid);
      setErrors(parsed.errors);
    } catch {
      setResult({ ok: false, message: locale === 'en' ? 'Could not read this file.' : 'تعذر قراءة الملف.' });
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setResult({
        ok: true,
        message: locale === 'en' ? `Imported ${data.imported} products.` : `تم استيراد ${data.imported} منتج.`,
      });
      setValidRows([]);
      setErrors([]);
      setFileName(null);
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Import failed' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wide text-ink">{locale === 'en' ? 'Import products' : 'استيراد المنتجات'}</h2>
        <a href="/api/products/template" className="text-sm font-semibold text-primary hover:underline">
          {locale === 'en' ? 'Download template' : 'تحميل القالب'}
        </a>
      </div>

      <Card className="p-4 text-sm text-ink-muted">
        {locale === 'en'
          ? 'Columns: Name (EN), Name (AR), Category Slug, Country of Origin, Size/Weight, Unit, Listing Type, Price, Quantity, Image URL. Rows with errors are skipped — the rest import normally.'
          : 'الأعمدة: Name (EN)، Name (AR)، Category Slug، Country of Origin، Size/Weight، Unit، Listing Type، Price، Quantity، Image URL. الصفوف اللي فيها أخطاء بتتجاهل، والباقي بيتستورد عادي.'}
      </Card>

      <div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm text-ink" />
        {parsing && <p className="mt-2 text-sm text-ink-muted">{locale === 'en' ? 'Reading file…' : 'جاري القراءة…'}</p>}
      </div>

      {fileName && !parsing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="primary">
              {validRows.length} {locale === 'en' ? 'valid rows' : 'صف صحيح'}
            </Badge>
            {errors.length > 0 && (
              <Badge variant="accent">
                {errors.length} {locale === 'en' ? 'errors' : 'خطأ'}
              </Badge>
            )}
          </div>

          {errors.length > 0 && (
            <div className="rounded-card border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
              <ul className="list-inside list-disc space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>
                    {locale === 'en' ? 'Row' : 'صف'} {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validRows.length > 0 && (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-start text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 text-start">{locale === 'en' ? 'Name' : 'الاسم'}</th>
                    <th className="px-3 py-2 text-start">{locale === 'en' ? 'Origin' : 'المنشأ'}</th>
                    <th className="px-3 py-2 text-start">{locale === 'en' ? 'Price' : 'السعر'}</th>
                    <th className="px-3 py-2 text-start">{locale === 'en' ? 'Qty' : 'الكمية'}</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 text-ink">{row.name[locale]}</td>
                      <td className="px-3 py-2 text-ink">{row.countryOfOrigin}</td>
                      <td className="px-3 py-2 font-mono text-ink">{row.price}</td>
                      <td className="px-3 py-2 font-mono text-ink">{row.quantityInStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 10 && (
                <p className="border-t border-border px-3 py-2 text-xs text-ink-muted">
                  {locale === 'en' ? `+ ${validRows.length - 10} more` : `+ ${validRows.length - 10} أكتر`}
                </p>
              )}
            </div>
          )}

          {validRows.length > 0 && (
            <Button variant="accent" onClick={handleImport} disabled={importing}>
              {importing
                ? locale === 'en'
                  ? 'Importing…'
                  : 'جاري الاستيراد…'
                : locale === 'en'
                  ? `Import ${validRows.length} products`
                  : `استيراد ${validRows.length} منتج`}
            </Button>
          )}
        </div>
      )}

      {result && (
        <p className={result.ok ? 'text-sm text-primary' : 'text-sm text-accent'}>{result.message}</p>
      )}
    </div>
  );
}
