import path from 'path';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Order } from '@/lib/types/order';
import type { UserProfile } from '@/lib/types/user';
import type { DeliveryRegion } from '@/lib/types/delivery';
import { EMIRATE_LABELS } from '@/lib/types/common';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';

let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  Font.register({
    family: 'Cairo',
    src: path.join(process.cwd(), 'public/fonts/Cairo-Regular.ttf'),
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Cairo', fontSize: 10, color: '#1a1a1a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  logo: { width: 56, height: 56, borderRadius: 4 },
  brand: { fontSize: 16, fontWeight: 700, color: '#1F4D36' },
  titleBlock: { alignItems: 'flex-end' },
  title: { fontSize: 14, fontWeight: 700 },
  muted: { color: '#666666' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: '#666666', marginBottom: 4, textTransform: 'uppercase' },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  col: { width: '48%' },
  bold: { fontWeight: 700 },
  table: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#dddddd' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f5f4f0', paddingVertical: 6, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#eeeeee' },
  cellName: { width: '46%' },
  cellQty: { width: '14%', textAlign: 'right' },
  cellUnit: { width: '20%', textAlign: 'right' },
  cellTotal: { width: '20%', textAlign: 'right' },
  totalsBlock: { marginTop: 16, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  totalsFinalRow: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  footer: { marginTop: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#dddddd', color: '#666666', fontSize: 8 },
});

function money(value: number): string {
  return `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface InvoiceProps {
  order: Order;
  customer: UserProfile | null;
  region: DeliveryRegion | null;
  logoDataUri: string | null;
}

export function InvoiceDocument({ order, customer, region, logoDataUri }: InvoiceProps) {
  ensureFont();

  const billToName = customer?.role === 'wholesale_customer' ? customer.businessName : customer?.fullName ?? order.customerId;
  const address = customer?.role === 'retail_customer' ? customer.addresses[0] : undefined;

  return (
    <Document title={`${order.orderNumber} — Qutoof`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image, not an HTML <img>; it has no alt prop */}
            {logoDataUri && <Image src={logoDataUri} style={styles.logo} />}
            <View>
              <Text style={styles.brand}>Qutoof — قطوف</Text>
              <Text style={styles.muted}>Fresh vegetables & fruit — UAE</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>TAX INVOICE / فاتورة ضريبية</Text>
            <Text style={styles.muted}>{order.orderNumber}</Text>
            <Text style={styles.muted}>{new Date(order.createdAt).toLocaleDateString('en-GB')}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill to / إلى</Text>
            <Text style={styles.bold}>{billToName}</Text>
            {customer?.phone && <Text>{customer.phone}</Text>}
            {customer?.email && <Text style={styles.muted}>{customer.email}</Text>}
            {address && (
              <Text style={styles.muted}>
                {address.street}, {address.area}, {EMIRATE_LABELS[address.emirate].en}
              </Text>
            )}
          </View>
          <View style={[styles.col, { alignItems: 'flex-end' }]}>
            <Text style={styles.sectionTitle}>Delivery / التوصيل</Text>
            <Text>{region ? `${region.name.en} — ${EMIRATE_LABELS[region.emirate].en}` : '—'}</Text>
            <Text style={styles.muted}>Status: {ORDER_STATUS_LABELS[order.status].en}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellName, styles.bold]}>Item</Text>
            <Text style={[styles.cellQty, styles.bold]}>Qty</Text>
            <Text style={[styles.cellUnit, styles.bold]}>Unit price</Text>
            <Text style={[styles.cellTotal, styles.bold]}>Total</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.cellName}>{item.nameSnapshot.en}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellUnit}>{money(item.unitPriceSnapshot)}</Text>
              <Text style={styles.cellTotal}>{money(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(order.totals.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>VAT ({Math.round(order.totals.vatRate * 100)}%)</Text>
            <Text>{money(order.totals.vatAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Delivery</Text>
            <Text>{money(order.totals.deliveryFee)}</Text>
          </View>
          <View style={styles.totalsFinalRow}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.bold}>{money(order.totals.total)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Payment method: {order.paymentMethod.replace('_', ' ')} · Payment status: {order.paymentStatus}
          </Text>
          {order.notes && <Text>Notes: {order.notes}</Text>}
          <Text style={{ marginTop: 4 }}>Thank you for your order — Qutoof.</Text>
        </View>
      </Page>
    </Document>
  );
}
