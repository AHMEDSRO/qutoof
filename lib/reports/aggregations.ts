import type { Order } from '@/lib/types/order';
import type { Product } from '@/lib/types/product';
import type { UserProfile } from '@/lib/types/user';
import type { DeliveryRegion } from '@/lib/types/delivery';
import { round2 } from '@/lib/pricing/vat';

export interface TopProductRow {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export function topProductsByRevenue(orders: Order[], locale: 'en' | 'ar', limit = 5): TopProductRow[] {
  const byProduct = new Map<string, TopProductRow>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue = round2(existing.revenue + item.lineTotal);
      } else {
        byProduct.set(item.productId, {
          productId: item.productId,
          name: item.nameSnapshot[locale],
          quantitySold: item.quantity,
          revenue: item.lineTotal,
        });
      }
    }
  }
  return [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export interface MarginRow {
  productId: string;
  name: string;
  margin: number;
  marginPercent: number;
}

export function marginByProduct(products: Product[], locale: 'en' | 'ar'): MarginRow[] {
  return products
    .map((p) => {
      const margin = round2(p.price - p.costPrice);
      return {
        productId: p.id,
        name: p.name[locale],
        margin,
        marginPercent: p.price > 0 ? round2((margin / p.price) * 100) : 0,
      };
    })
    .sort((a, b) => b.marginPercent - a.marginPercent);
}

export interface RepPerformanceRow {
  repId: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export function repPerformance(orders: Order[], users: UserProfile[]): RepPerformanceRow[] {
  const byRep = new Map<string, RepPerformanceRow>();
  for (const order of orders) {
    if (!order.salesRepId) continue;
    const rep = users.find((u) => u.id === order.salesRepId);
    const existing = byRep.get(order.salesRepId);
    if (existing) {
      existing.orderCount += 1;
      existing.revenue = round2(existing.revenue + order.totals.total);
    } else {
      byRep.set(order.salesRepId, {
        repId: order.salesRepId,
        name: rep?.fullName ?? order.salesRepId,
        orderCount: 1,
        revenue: order.totals.total,
      });
    }
  }
  return [...byRep.values()].sort((a, b) => b.revenue - a.revenue);
}

export interface RegionSalesRow {
  regionId: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export function salesByRegion(orders: Order[], regions: DeliveryRegion[], locale: 'en' | 'ar'): RegionSalesRow[] {
  const byRegion = new Map<string, RegionSalesRow>();
  for (const order of orders) {
    const region = regions.find((r) => r.id === order.deliveryRegionId);
    const name = region?.name[locale] ?? order.deliveryRegionId;
    const existing = byRegion.get(order.deliveryRegionId);
    if (existing) {
      existing.orderCount += 1;
      existing.revenue = round2(existing.revenue + order.totals.total);
    } else {
      byRegion.set(order.deliveryRegionId, { regionId: order.deliveryRegionId, name, orderCount: 1, revenue: order.totals.total });
    }
  }
  return [...byRegion.values()].sort((a, b) => b.revenue - a.revenue);
}
