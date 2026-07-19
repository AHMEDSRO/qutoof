import type { Product, PublicProduct, ListingType } from '@/lib/types/product';
import type { RequestContext } from '@/lib/auth/auth-provider';

export interface ProductFilters {
  categoryId?: string;
  countryOfOrigin?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  listingType?: ListingType;
  /** Dashboard management views need to see hidden products too, to be able to unhide them. */
  includeInactive?: boolean;
}

export interface ProductRepository {
  list(ctx: RequestContext, filters?: ProductFilters): Promise<(Product | PublicProduct)[]>;
  getBySlug(ctx: RequestContext, slug: string): Promise<Product | PublicProduct | null>;
  getById(ctx: RequestContext, id: string): Promise<Product | PublicProduct | null>;
  create(ctx: RequestContext, input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(ctx: RequestContext, id: string, patch: Partial<Product>): Promise<Product>;
  delete(ctx: RequestContext, id: string): Promise<void>;
  bulkImport(ctx: RequestContext, items: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Product[]>;
  adjustStock(ctx: RequestContext, id: string, quantityDelta: number): Promise<Product>;
}
