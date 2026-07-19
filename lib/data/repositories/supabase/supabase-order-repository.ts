import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { Order, OrderLineItem, OrderTotals, OrderStatus, OrderStatusEvent, PaymentMethod, PaymentStatus } from '@/lib/types/order';
import { assertCan, can } from '@/lib/rbac/permissions';
import { assertCanTransition } from '@/lib/orders/order-status';
import { notifier } from '@/lib/notifications/notifier';
import type { OrderRepository } from '../order-repository';

interface OrderRow {
  id: string;
  order_number: string;
  account_type: 'retail' | 'wholesale';
  customer_id: string;
  sales_rep_id: string | null;
  items: OrderLineItem[];
  totals: OrderTotals;
  status: OrderStatus;
  status_history: OrderStatusEvent[];
  delivery_region_id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    accountType: row.account_type,
    customerId: row.customer_id,
    salesRepId: row.sales_rep_id,
    items: row.items,
    totals: row.totals,
    status: row.status,
    statusHistory: row.status_history,
    deliveryRegionId: row.delivery_region_id,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function nextOrderNumber(): Promise<string> {
  const { data, error } = await supabaseAdmin.from('orders').select('order_number');
  if (error) throw error;
  const max = (data as { order_number: string }[]).reduce((acc, o) => {
    const n = Number(o.order_number.replace('QT-', ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 1000);
  return `QT-${max + 1}`;
}

export const supabaseOrderRepository: OrderRepository = {
  async list(ctx) {
    let query = supabaseAdmin.from('orders').select('*');
    if (can(ctx.role, 'view_all_orders')) {
      // no filter — every order
    } else if (can(ctx.role, 'view_own_orders')) {
      query = query.eq('customer_id', ctx.userId);
    } else {
      throw new Error('Role lacks permission to view orders');
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as OrderRow[]).map(toOrder);
  },

  async getById(ctx, id) {
    const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const order = toOrder(data as OrderRow);
    const isOwner = order.customerId === ctx.userId;
    if (!isOwner && !can(ctx.role, 'view_all_orders')) {
      throw new Error('Role lacks permission to view this order');
    }
    return order;
  },

  async create(ctx, input) {
    const isSelfCheckout = input.customerId === ctx.userId;
    if (!isSelfCheckout) {
      assertCan(ctx.role, 'create_wholesale_order');
    }

    const now = new Date().toISOString();
    const orderNumber = await nextOrderNumber();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        id: `order-${Date.now()}`,
        order_number: orderNumber,
        account_type: input.accountType,
        customer_id: input.customerId,
        sales_rep_id: input.salesRepId ?? null,
        items: input.items,
        totals: input.totals,
        status: input.status,
        status_history: [{ status: input.status, at: now, byUserId: ctx.userId }],
        delivery_region_id: input.deliveryRegionId,
        payment_method: input.paymentMethod,
        payment_status: input.paymentStatus,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    const order = toOrder(data as OrderRow);
    await notifier.notify({ type: 'order_created', orderId: order.id, orderNumber: order.orderNumber, customerId: order.customerId });
    return order;
  },

  async updateStatus(ctx, id, status) {
    assertCan(ctx.role, 'update_order_status');
    const { data: current, error: fetchError } = await supabaseAdmin.from('orders').select('*').eq('id', id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) throw new Error(`Order not found: ${id}`);

    const existing = toOrder(current as OrderRow);
    assertCanTransition(existing.status, status);

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        status_history: [...existing.statusHistory, { status, at: now, byUserId: ctx.userId }],
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const updated = toOrder(data as OrderRow);
    await notifier.notify({ type: 'order_status_changed', orderId: updated.id, orderNumber: updated.orderNumber, status });
    return updated;
  },
};
