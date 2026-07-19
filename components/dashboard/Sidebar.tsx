'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Role } from '@/lib/rbac/roles';
import { can } from '@/lib/rbac/permissions';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
}

export function Sidebar({ locale, role }: { locale: Locale; role: Role }) {
  const pathname = usePathname() ?? '';
  const base = `/${locale}/dashboard`;

  const items: NavItem[] = [
    { href: base, labelEn: 'Overview', labelAr: 'نظرة عامة', visible: true },
    { href: `${base}/products`, labelEn: 'Products', labelAr: 'المنتجات', visible: can(role, 'edit_products') },
    { href: `${base}/orders`, labelEn: 'Orders', labelAr: 'الطلبات', visible: can(role, 'view_all_orders') },
    { href: `${base}/inventory`, labelEn: 'Inventory', labelAr: 'المخزون', visible: can(role, 'adjust_inventory') },
    { href: `${base}/customers`, labelEn: 'Customers', labelAr: 'العملاء', visible: can(role, 'view_reports') },
    { href: `${base}/invoices`, labelEn: 'Invoices', labelAr: 'الفواتير', visible: can(role, 'view_reports') },
    { href: `${base}/reports`, labelEn: 'Reports', labelAr: 'التقارير', visible: can(role, 'view_reports') },
    {
      href: `${base}/settings`,
      labelEn: 'Settings',
      labelAr: 'الإعدادات',
      visible: can(role, 'manage_payment_settings') || can(role, 'manage_users'),
    },
  ];

  return (
    <nav className="w-full shrink-0 space-y-1 lg:w-56">
      {items
        .filter((i) => i.visible)
        .map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-tag px-3 py-2 text-sm font-semibold transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-ink hover:bg-surface-muted'
              )}
            >
              {locale === 'en' ? item.labelEn : item.labelAr}
            </Link>
          );
        })}
    </nav>
  );
}
