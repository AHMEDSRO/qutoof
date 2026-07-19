import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { locales, dirForLocale, isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { fontDisplay, fontSans, fontArabic, fontMono } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo/metadata';
import { CartProvider } from '@/lib/cart/cart-context';
import { RoleSwitcher } from '@/components/dev/RoleSwitcher';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  return buildMetadata({
    locale,
    path: '',
    title: `${dict.brand} — ${dict.home.heroTitle}`,
    description: dict.home.heroSubtitle,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      className={cn(fontDisplay.variable, fontSans.variable, fontArabic.variable, fontMono.variable)}
    >
      <body className={cn('flex min-h-screen flex-col', locale === 'ar' ? 'font-arabic' : 'font-sans')}>
        <CartProvider>
          <Header locale={locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict} />
          <WhatsAppButton locale={locale} />
          <RoleSwitcher locale={locale} />
        </CartProvider>
      </body>
    </html>
  );
}
