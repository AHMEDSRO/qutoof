/**
 * One-off seed script — populates the Supabase tables from the same seed
 * functions the mock store used, so Phase 2 starts from the identical
 * baseline data as Phase 1. Run once after the schema exists:
 *
 *   npx tsx scripts/seed-supabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import { seedCategories } from '../lib/data/mock/categories';
import { seedProducts } from '../lib/data/mock/products';
import { seedDeliveryRegions } from '../lib/data/mock/delivery-regions';
import { seedUsers } from '../lib/data/mock/users';
import { seedOrders } from '../lib/data/mock/orders';
import type { UserProfile } from '../lib/types/user';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (load .env.local first)');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function userToRow(u: UserProfile) {
  const base = {
    id: u.id,
    email: u.email,
    full_name: u.fullName,
    phone: u.phone ?? null,
    role: u.role,
    locale: u.locale,
    created_at: u.createdAt,
  };
  if (u.role === 'retail_customer') return { ...base, addresses: u.addresses };
  if (u.role === 'wholesale_customer') {
    return {
      ...base,
      business_name: u.businessName,
      trade_license_number: u.tradeLicenseNumber ?? null,
      trade_license_file_url: u.tradeLicenseFileUrl ?? null,
      credit_limit: u.creditLimit,
      assigned_sales_rep_id: u.assignedSalesRepId ?? null,
      approved_for_wholesale_pricing: u.approvedForWholesalePricing,
    };
  }
  return base;
}

async function main() {
  const categories = seedCategories().map((c) => ({
    id: c.id,
    slug: c.slug,
    type: c.type,
    name_en: c.name.en,
    name_ar: c.name.ar,
    parent_id: c.parentId,
    image_url: c.imageUrl ?? null,
  }));
  const { error: catError } = await supabase.from('categories').upsert(categories);
  if (catError) throw catError;
  console.log(`Seeded ${categories.length} categories`);

  const regions = seedDeliveryRegions().map((r) => ({
    id: r.id,
    emirate: r.emirate,
    area: r.area,
    name_en: r.name.en,
    name_ar: r.name.ar,
    delivery_fee: r.deliveryFee,
    is_active: r.isActive,
  }));
  const { error: regionError } = await supabase.from('delivery_regions').upsert(regions);
  if (regionError) throw regionError;
  console.log(`Seeded ${regions.length} delivery regions`);

  const products = seedProducts().map((p) => ({
    id: p.id,
    slug: p.slug,
    name_en: p.name.en,
    name_ar: p.name.ar,
    description_en: p.description.en,
    description_ar: p.description.ar,
    category_id: p.categoryId,
    country_of_origin: p.countryOfOrigin,
    size_weight: p.sizeWeight,
    unit: p.unit,
    images: p.images,
    cost_price: p.costPrice,
    retail_price: p.retailPrice,
    wholesale_price: p.wholesalePrice,
    quantity_in_stock: p.quantityInStock,
    low_stock_threshold: p.lowStockThreshold,
    is_wholesale_available: p.isWholesaleAvailable,
    is_active: p.isActive,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));
  const { error: productError } = await supabase.from('products').upsert(products);
  if (productError) throw productError;
  console.log(`Seeded ${products.length} products`);

  const users = seedUsers().map(userToRow);
  const { error: userError } = await supabase.from('users').upsert(users);
  if (userError) throw userError;
  console.log(`Seeded ${users.length} users`);

  const orders = seedOrders().map((o) => ({
    id: o.id,
    order_number: o.orderNumber,
    account_type: o.accountType,
    customer_id: o.customerId,
    sales_rep_id: o.salesRepId ?? null,
    items: o.items,
    totals: o.totals,
    status: o.status,
    status_history: o.statusHistory,
    delivery_region_id: o.deliveryRegionId,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    notes: o.notes ?? null,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  }));
  const { error: orderError } = await supabase.from('orders').upsert(orders);
  if (orderError) throw orderError;
  console.log(`Seeded ${orders.length} orders`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
