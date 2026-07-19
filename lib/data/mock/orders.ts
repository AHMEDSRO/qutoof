import type { Order, OrderLineItem, OrderTotals } from '@/lib/types/order';

const now = new Date().toISOString();
const VAT_RATE = 0.05;

function totals(items: OrderLineItem[], deliveryFee: number): OrderTotals {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  return {
    subtotal,
    vatRate: VAT_RATE,
    vatAmount,
    deliveryFee,
    total: Math.round((subtotal + vatAmount + deliveryFee) * 100) / 100,
  };
}

export function seedOrders(): Order[] {
  const order1Items: OrderLineItem[] = [
    { productId: 'tomato-retail', nameSnapshot: { en: 'Tomato', ar: 'طماطم' }, unitPriceSnapshot: 6, quantity: 5, lineTotal: 30 },
    { productId: 'cucumber-retail', nameSnapshot: { en: 'Cucumber', ar: 'خيار' }, unitPriceSnapshot: 5, quantity: 3, lineTotal: 15 },
  ];

  const order2Items: OrderLineItem[] = [
    { productId: 'orange-wholesale', nameSnapshot: { en: 'Orange', ar: 'برتقال' }, unitPriceSnapshot: 4, quantity: 50, lineTotal: 200 },
    { productId: 'potato-wholesale', nameSnapshot: { en: 'Potato', ar: 'بطاطس' }, unitPriceSnapshot: 2.7, quantity: 100, lineTotal: 270 },
  ];

  const order3Items: OrderLineItem[] = [
    { productId: 'mango-retail', nameSnapshot: { en: 'Mango', ar: 'مانجو' }, unitPriceSnapshot: 11, quantity: 4, lineTotal: 44 },
  ];

  return [
    {
      id: 'order-1001',
      orderNumber: 'QT-1001',
      accountType: 'retail',
      customerId: 'user-retail',
      items: order1Items,
      totals: totals(order1Items, 15),
      status: 'delivered',
      statusHistory: [
        { status: 'pending_review', at: now },
        { status: 'confirmed', at: now },
        { status: 'preparing', at: now },
        { status: 'out_for_delivery', at: now },
        { status: 'delivered', at: now },
      ],
      deliveryRegionId: 'dxb-marina',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'order-1002',
      orderNumber: 'QT-1002',
      accountType: 'wholesale',
      customerId: 'user-wholesale',
      salesRepId: 'user-sales-rep',
      items: order2Items,
      totals: totals(order2Items, 20),
      status: 'preparing',
      statusHistory: [
        { status: 'pending_review', at: now },
        { status: 'confirmed', at: now, byUserId: 'user-sales-rep' },
        { status: 'preparing', at: now, byUserId: 'user-warehouse' },
      ],
      deliveryRegionId: 'auh-city',
      paymentMethod: 'invoice_credit',
      paymentStatus: 'unpaid',
      notes: 'Recurring weekly wholesale order.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'order-1003',
      orderNumber: 'QT-1003',
      accountType: 'retail',
      customerId: 'user-retail',
      items: order3Items,
      totals: totals(order3Items, 15),
      status: 'pending_review',
      statusHistory: [{ status: 'pending_review', at: now }],
      deliveryRegionId: 'dxb-marina',
      paymentMethod: 'card',
      paymentStatus: 'unpaid',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
