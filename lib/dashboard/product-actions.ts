'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { productRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { uploadProductImage, deleteProductImageIfOwned } from '@/lib/supabase/storage';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const productSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string().default(''),
  descriptionAr: z.string().default(''),
  categoryId: z.string().min(1),
  countryOfOrigin: z.string().min(1),
  sizeWeight: z.string().min(1),
  unit: z.enum(['kg', 'g', 'piece', 'box', 'bunch']),
  listingType: z.enum(['retail', 'wholesale']),
  costPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  quantityInStock: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
});

export async function createProductAction(locale: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse(raw);
  const ctx = await getRequestContext();

  const imageFile = formData.get('image');
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    throw new Error('A product image is required');
  }
  const slug = slugify(`${data.nameEn}-${data.listingType}`);
  const imageUrl = await uploadProductImage(imageFile, slug);

  await productRepository.create(ctx, {
    slug,
    name: { en: data.nameEn, ar: data.nameAr },
    description: { en: data.descriptionEn, ar: data.descriptionAr },
    categoryId: data.categoryId,
    countryOfOrigin: data.countryOfOrigin,
    sizeWeight: data.sizeWeight,
    unit: data.unit,
    listingType: data.listingType,
    images: [{ url: imageUrl, altEn: data.nameEn, altAr: data.nameAr }],
    costPrice: data.costPrice,
    price: data.price,
    quantityInStock: data.quantityInStock,
    lowStockThreshold: data.lowStockThreshold,
    isActive: true,
  });

  revalidatePath(`/${locale}/dashboard/products`);
  redirect(`/${locale}/dashboard/products`);
}

export async function updateProductAction(locale: string, productId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse(raw);
  const ctx = await getRequestContext();

  const currentImageUrl = String(formData.get('currentImageUrl') ?? '');
  const imageFile = formData.get('image');
  let imageUrl = currentImageUrl;
  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadProductImage(imageFile, slugify(`${data.nameEn}-${data.listingType}`));
    if (currentImageUrl) await deleteProductImageIfOwned(currentImageUrl);
  }

  await productRepository.update(ctx, productId, {
    name: { en: data.nameEn, ar: data.nameAr },
    description: { en: data.descriptionEn, ar: data.descriptionAr },
    categoryId: data.categoryId,
    countryOfOrigin: data.countryOfOrigin,
    sizeWeight: data.sizeWeight,
    unit: data.unit,
    listingType: data.listingType,
    images: [{ url: imageUrl, altEn: data.nameEn, altAr: data.nameAr }],
    costPrice: data.costPrice,
    price: data.price,
    quantityInStock: data.quantityInStock,
    lowStockThreshold: data.lowStockThreshold,
  });

  revalidatePath(`/${locale}/dashboard/products`);
  redirect(`/${locale}/dashboard/products`);
}

export async function deleteProductAction(locale: string, productId: string) {
  const ctx = await getRequestContext();
  const product = await productRepository.getById(ctx, productId);
  await productRepository.delete(ctx, productId);
  if (product?.images[0]?.url) await deleteProductImageIfOwned(product.images[0].url);
  revalidatePath(`/${locale}/dashboard/products`);
}

export async function toggleProductActiveAction(locale: string, productId: string, nextIsActive: boolean) {
  const ctx = await getRequestContext();
  await productRepository.update(ctx, productId, { isActive: nextIsActive });
  revalidatePath(`/${locale}/dashboard/products`);
}

export async function adjustStockAction(locale: string, productId: string, formData: FormData) {
  const delta = Number(formData.get('delta'));
  const ctx = await getRequestContext();
  await productRepository.adjustStock(ctx, productId, delta);
  revalidatePath(`/${locale}/dashboard/inventory`);
}
