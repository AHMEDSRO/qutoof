import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { Product, PublicProduct, ProductImage, ProductUnit } from '@/lib/types/product';
import type { RequestContext } from '@/lib/auth/auth-provider';
import { assertCan, can } from '@/lib/rbac/permissions';
import type { ProductRepository, ProductFilters } from '../product-repository';

interface ProductRow {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  country_of_origin: string;
  size_weight: string;
  unit: ProductUnit;
  images: ProductImage[];
  cost_price: number;
  retail_price: number;
  wholesale_price: number | null;
  quantity_in_stock: number;
  low_stock_threshold: number;
  is_wholesale_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.name_en, ar: row.name_ar },
    description: { en: row.description_en, ar: row.description_ar },
    categoryId: row.category_id,
    countryOfOrigin: row.country_of_origin,
    sizeWeight: row.size_weight,
    unit: row.unit,
    images: row.images,
    costPrice: row.cost_price,
    retailPrice: row.retail_price,
    wholesalePrice: row.wholesale_price,
    quantityInStock: row.quantity_in_stock,
    lowStockThreshold: row.low_stock_threshold,
    isWholesaleAvailable: row.is_wholesale_available,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    slug: product.slug,
    name_en: product.name.en,
    name_ar: product.name.ar,
    description_en: product.description.en,
    description_ar: product.description.ar,
    category_id: product.categoryId,
    country_of_origin: product.countryOfOrigin,
    size_weight: product.sizeWeight,
    unit: product.unit,
    images: product.images,
    cost_price: product.costPrice,
    retail_price: product.retailPrice,
    wholesale_price: product.wholesalePrice,
    quantity_in_stock: product.quantityInStock,
    low_stock_threshold: product.lowStockThreshold,
    is_wholesale_available: product.isWholesaleAvailable,
    is_active: product.isActive,
  };
}

function sanitize(ctx: RequestContext, product: Product): Product | PublicProduct {
  const visible: Product = { ...product };
  if (!can(ctx.role, 'view_wholesale_pricing')) {
    visible.wholesalePrice = null;
  }
  if (!can(ctx.role, 'view_cost_price')) {
    const { costPrice: _costPrice, ...rest } = visible;
    return rest;
  }
  return visible;
}

function applyInMemoryFilters(products: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return products;
  return products.filter((p) => {
    if (filters.wholesaleOnly && !p.isWholesaleAvailable) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches = p.name.en.toLowerCase().includes(q) || p.name.ar.includes(filters.search) || p.slug.includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

async function fetchFiltered(filters?: ProductFilters): Promise<Product[]> {
  let query = supabaseAdmin.from('products').select('*').eq('is_active', true);
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.countryOfOrigin) query = query.eq('country_of_origin', filters.countryOfOrigin);
  if (filters?.minPrice !== undefined) query = query.gte('retail_price', filters.minPrice);
  if (filters?.maxPrice !== undefined) query = query.lte('retail_price', filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;
  return applyInMemoryFilters((data as ProductRow[]).map(toProduct), filters);
}

export const supabaseProductRepository: ProductRepository = {
  async list(ctx, filters) {
    const products = await fetchFiltered(filters);
    return products.map((p) => sanitize(ctx, p));
  },

  async getBySlug(ctx, slug) {
    const { data, error } = await supabaseAdmin.from('products').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? sanitize(ctx, toProduct(data as ProductRow)) : null;
  },

  async getById(ctx, id) {
    const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? sanitize(ctx, toProduct(data as ProductRow)) : null;
  },

  async create(ctx, input) {
    assertCan(ctx.role, 'edit_products');
    const { data: existing } = await supabaseAdmin.from('products').select('id').eq('slug', input.slug).maybeSingle();
    if (existing) throw new Error(`A product with slug "${input.slug}" already exists`);

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({ id: input.slug, ...fromProduct(input) })
      .select()
      .single();
    if (error) throw error;
    return toProduct(data as ProductRow);
  },

  async update(ctx, id, patch) {
    assertCan(ctx.role, 'edit_products');
    const { data: current, error: fetchError } = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) throw new Error(`Product not found: ${id}`);

    const merged = { ...toProduct(current as ProductRow), ...patch };
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...fromProduct(merged), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toProduct(data as ProductRow);
  },

  async bulkImport(ctx, items) {
    assertCan(ctx.role, 'bulk_import_products');
    const results: Product[] = [];

    for (const item of items) {
      // Re-importing a known slug updates that product in place instead of duplicating it.
      const { data, error } = await supabaseAdmin
        .from('products')
        .upsert({ id: item.slug, ...fromProduct(item), updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      results.push(toProduct(data as ProductRow));
    }

    return results;
  },

  async adjustStock(ctx, id, quantityDelta) {
    assertCan(ctx.role, 'adjust_inventory');
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('quantity_in_stock')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) throw new Error(`Product not found: ${id}`);

    const newQuantity = Math.max(0, current.quantity_in_stock + quantityDelta);
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ quantity_in_stock: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toProduct(data as ProductRow);
  },
};
