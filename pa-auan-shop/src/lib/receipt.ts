import type { Order, Payment } from '../types';

export const receivedStatuses = ['succeeded', 'partially_refunded', 'refunded'];

/** Use confirmed payment attempts, never the most recent failed/pending attempt. */
export function receiptAmounts(order: Order, payments: Payment[]) {
  if (!receivedStatuses.includes(order.paymentStatus)) throw new Error('ออเดอร์นี้ยังไม่ได้ยืนยันการชำระเงิน');
  const exponent = order.currencyExponent;
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 6) throw new Error('ข้อมูลสกุลเงินไม่ครบ กรุณาโหลดใหม่');
  const settled = payments.filter(payment => receivedStatuses.includes(payment.status));
  const minor = (value: unknown) => {
    const number = Number(value);
    if (value == null || !Number.isSafeInteger(number) || number < 0) throw new Error('ข้อมูลยอดชำระไม่ถูกต้อง กรุณาตรวจสอบรายการ');
    return number;
  };
  let paid = 0;
  let refunded = 0;
  for (const payment of settled) {
    if (payment.currency !== order.currency) throw new Error('สกุลเงินของรายการชำระไม่ตรงกับออเดอร์');
    const amount = minor(payment.amountMinor);
    const refund = minor(payment.refundedAmountMinor);
    if (refund > amount) throw new Error('ยอดคืนเงินเกินยอดรับชำระ');
    paid += amount;
    refunded += refund;
  }
  if (!Number.isSafeInteger(paid) || !Number.isSafeInteger(refunded)) throw new Error('ยอดชำระเกินขอบเขตที่รองรับ');
  if (!settled.length) {
    if (order.paymentStatus !== 'succeeded') throw new Error('ยังไม่พบยอดคืนเงินที่ยืนยันแล้ว กรุณาโหลดข้อมูลใหม่');
    paid = minor(order.amountMinor);
  }
  if ((order.paymentStatus === 'refunded' && refunded !== paid)
    || (order.paymentStatus === 'partially_refunded' && !(refunded > 0 && refunded < paid))
    || (order.paymentStatus === 'succeeded' && refunded > 0)) {
    throw new Error('สถานะและยอดคืนเงินกำลังอัปเดต กรุณาโหลดข้อมูลใหม่');
  }
  return { paid: paid / 10 ** exponent, refunded: refunded / 10 ** exponent,
    net: (paid - refunded) / 10 ** exponent,
    methods: [...new Set(settled.map(payment => payment.paymentMethod).filter(Boolean))].join(', ') || 'ไม่ระบุ',
  };
}

export function receiptDate(value: string | null | undefined) {
  if (!value) return 'ไม่ระบุ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ระบุ';
  return new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' }).format(date);
}
