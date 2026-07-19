import { readFileSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { orderRepository, userRepository, deliveryRepository } from '@/lib/data';
import { getRequestContext } from '@/lib/auth/session';
import { InvoiceDocument } from '@/lib/pdf/invoice-document';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getRequestContext();

  let order;
  try {
    order = await orderRepository.getById(ctx, params.id);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [customer, region] = await Promise.all([
    userRepository.getById(ctx, order.customerId).catch(() => null),
    deliveryRepository.getById(ctx, order.deliveryRegionId).catch(() => null),
  ]);

  let logoDataUri: string | null = null;
  try {
    const logoBuffer = readFileSync(path.join(process.cwd(), 'public/logo.jpg'));
    logoDataUri = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch {
    logoDataUri = null;
  }

  const pdfBuffer = await renderToBuffer(
    InvoiceDocument({ order, customer, region, logoDataUri })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${order.orderNumber}.pdf"`,
    },
  });
}
