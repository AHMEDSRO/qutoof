import { NextRequest, NextResponse } from 'next/server';
import { orderRepository, productRepository, deliveryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { buildLineItem, calculateTotals, type AccountType } from '@/lib/pricing/pricing';
import type { PaymentMethod } from '@/lib/types/order';

export async function GET() {
  const ctx = await getRequestContext();
  const orders = await orderRepository.list(ctx);
  return NextResponse.json(orders);
}

interface CheckoutBody {
  items: { productId: string; quantity: number }[];
  deliveryRegionId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export async function POST(request: NextRequest) {
  const ctx = await getRequestContext();
  const body = (await request.json()) as CheckoutBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const region = await deliveryRepository.getById(ctx, body.deliveryRegionId);
  if (!region) {
    return NextResponse.json({ error: 'Invalid delivery region' }, { status: 400 });
  }

  const accountType: AccountType = ctx.role === 'wholesale_customer' ? 'wholesale' : 'retail';

  const lineItems = [];
  for (const item of body.items) {
    const product = await productRepository.getById(ctx, item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
    }
    lineItems.push(buildLineItem(product, item.quantity));
  }

  const totals = calculateTotals(lineItems, region.deliveryFee);

  const order = await orderRepository.create(ctx, {
    accountType,
    customerId: ctx.userId,
    items: lineItems,
    totals,
    status: 'pending_review',
    deliveryRegionId: region.id,
    paymentMethod: body.paymentMethod,
    paymentStatus: 'unpaid',
    notes: body.notes,
  });

  return NextResponse.json(order, { status: 201 });
}
