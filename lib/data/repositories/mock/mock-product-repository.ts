import { readCollection, writeCollection } from '@/lib/data/store';
import { seedProducts } from '@/lib/data/mock/products';
import type { Product, PublicProduct } from '@/lib/types/product';
import type { RequestContext } from '@/lib/auth/auth-provider';
import { assertCan, can } from '@/lib/rbac/permissions';
import type { ProductRepository, ProductFilters } from '../product-repository';

function loadAll(): Product[] {
  return readCollection<Product>('products', seedProducts);
}

function sanitize(ctx: RequestContext, product: Product): Product | PublicProduct {
  if (!can(ctx.role, 'view_cost_price')) {
    const { costPrice: _costPrice, ...rest } = product;
    return rest;
  }
  return product;
}

function applyFilters(products: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return products;
  return products.filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.countryOfOrigin && p.countryOfOrigin !== filters.countryOfOrigin) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.listingType && p.listingType !== filters.listingType) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        p.name.en.toLowerCase().includes(q) ||
        p.name.ar.includes(filters.search) ||
        p.slug.includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

export const mockProductRepository: ProductRepository = {
  async list(ctx, filters) {
    const products = applyFilters(
      loadAll().filter((p) => filters?.includeInactive || p.isActive),
      filters
    );
    return products.map((p) => sanitize(ctx, p));
  },

  async getBySlug(ctx, slug) {
    const product = loadAll().find((p) => p.slug === slug);
    return product ? sanitize(ctx, product) : null;
  },

  async getById(ctx, id) {
    const product = loadAll().find((p) => p.id === id);
    return product ? sanitize(ctx, product) : null;
  },

  async create(ctx, input) {
    assertCan(ctx.role, 'edit_products');
    const products = loadAll();
    if (products.some((p) => p.slug === input.slug)) {
      throw new Error(`A product with slug "${input.slug}" already exists`);
    }
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      id: input.slug,
      createdAt: now,
      updatedAt: now,
    };
    products.push(product);
    writeCollection('products', products);
    return product;
  },

  async update(ctx, id, patch) {
    assertCan(ctx.role, 'edit_products');
    const products = loadAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Product not found: ${id}`);
    const updated: Product = { ...products[index], ...patch, updatedAt: new Date().toISOString() };
    products[index] = updated;
    writeCollection('products', products);
    return updated;
  },

  async delete(ctx, id) {
    assertCan(ctx.role, 'edit_products');
    const products = loadAll();
    writeCollection('products', products.filter((p) => p.id !== id));
  },

  async bulkImport(ctx, items) {
    assertCan(ctx.role, 'bulk_import_products');
    const products = loadAll();
    const now = new Date().toISOString();
    const result: Product[] = [];

    for (const item of items) {
      const existingIndex = products.findIndex((p) => p.slug === item.slug);
      if (existingIndex !== -1) {
        // Re-importing a known slug updates that product in place instead of duplicating it.
        const updated: Product = { ...products[existingIndex], ...item, updatedAt: now };
        products[existingIndex] = updated;
        result.push(updated);
      } else {
        const created: Product = { ...item, id: item.slug, createdAt: now, updatedAt: now };
        products.push(created);
        result.push(created);
      }
    }

    writeCollection('products', products);
    return result;
  },

  async adjustStock(ctx, id, quantityDelta) {
    assertCan(ctx.role, 'adjust_inventory');
    const products = loadAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Product not found: ${id}`);
    const updated: Product = {
      ...products[index],
      quantityInStock: Math.max(0, products[index].quantityInStock + quantityDelta),
      updatedAt: new Date().toISOString(),
    };
    products[index] = updated;
    writeCollection('products', products);
    return updated;
  },
};
