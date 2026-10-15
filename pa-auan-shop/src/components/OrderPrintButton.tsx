import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Printer } from 'lucide-react';
import { fetchOrder, fetchPayments } from '../lib/api';
import { receiptAmounts, receiptDate, receivedStatuses } from '../lib/receipt';
import { SHOP_INVOICE, SHOP_NAME } from '../config/constants';
import type { Order } from '../types';

type Kind = 'receipt' | 'kitchen';
type Snapshot = { order: Order; amounts: ReturnType<typeof receiptAmounts> | null };

export function OrderPrintButton({ orderId, kind = 'receipt' }: { orderId: string; kind?: Kind }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700">
      <Printer className="h-4 w-4" />{kind === 'receipt' ? 'พิมพ์ใบเสร็จ' : 'พิมพ์ใบครัว'}
    </button>
    {open && <PrintDialog key={`${kind}:${orderId}`} orderId={orderId} kind={kind} onClose={() => setOpen(false)} />}
  </>;
}

function PrintDialog({ orderId, kind, onClose }: { orderId: string; kind: Kind; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [copy, setCopy] = useState(false);
  const [paper, setPaper] = useState<'58' | '80'>(() => {
    try { return localStorage.getItem('receipt-paper-width') === '58' ? '58' : '80'; } catch { return '80'; }
  });
  const title = kind === 'receipt' ? 'ใบแจ้งหนี้ / ใบเสร็จรับเงิน' : 'ใบสั่งอาหารสำหรับครัว';

  async function load(): Promise<Snapshot> {
    const order = await fetchOrder(orderId);
    if (!receivedStatuses.includes(order.paymentStatus)) throw new Error('ออเดอร์นี้ยังไม่ได้ยืนยันการชำระเงิน');
    if (kind === 'kitchen' && (order.paymentStatus === 'refunded' || order.fulfillmentStatus === 'cancelled')) {
      throw new Error('ออเดอร์นี้คืนเงินทั้งหมดหรือยกเลิกแล้ว ไม่สามารถออกใบครัวได้');
    }
    return { order, amounts: kind === 'receipt' ? receiptAmounts(order, await fetchPayments(orderId)) : null };
  }

  useEffect(() => {
    mounted.current = true;
    dialog.current?.showModal();
    document.body.classList.add('order-print-open');
    let active = true;
    setBusy(true);
    load().then(value => { if (active) setSnapshot(value); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'โหลดเอกสารไม่สำเร็จ'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; mounted.current = false; document.body.classList.remove('order-print-open'); };
  }, [orderId, kind]);

  const print = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      // Re-read payment/refund status immediately before printing, not from cached UI.
      const latest = await load();
      if (!mounted.current) return;
      flushSync(() => setSnapshot(latest));
      await document.fonts.ready;
      if (!mounted.current) return;
      window.print();
      setNotice('เปิดหน้าต่างพิมพ์แล้ว หากยกเลิกหรือกระดาษไม่ออก สามารถสั่งพิมพ์ใหม่ได้');
    } catch (err) {
      if (mounted.current) { setSnapshot(null); setError(err instanceof Error ? err.message : 'เปิดหน้าต่างพิมพ์ไม่สำเร็จ'); }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const order = snapshot?.order;
  const money = (value: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: order?.currency ?? 'THB' }).format(value);
  const amounts = snapshot?.amounts;
  return createPortal(<dialog ref={dialog} className={`order-print-dialog ${kind === 'receipt' ? 'invoice-dialog' : 'ticket-dialog'}`} aria-label={title}
    style={{ '--receipt-paper': `${paper}mm` } as CSSProperties}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="receipt-controls">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">ตัวอย่าง{title}</h2><button type="button" onClick={onClose}>ปิด</button></div>
      {kind === 'receipt' ? <p className="mt-3 text-sm text-gray-700">เอกสารนี้จัดสำหรับกระดาษ <strong>A4</strong></p> : <label className="block mt-3 text-sm">ขนาดกระดาษ <select aria-label="ขนาดกระดาษ" value={paper} disabled={busy} onChange={event => {
        const value = event.target.value === '58' ? '58' : '80'; setPaper(value);
        try { localStorage.setItem('receipt-paper-width', value); } catch { /* Printing still works without storage. */ }
      }}><option value="58">58 มม.</option><option value="80">80 มม.</option></select></label>}
      <label className="flex items-center gap-2 my-3 text-sm"><input type="checkbox" checked={copy} disabled={busy} onChange={event => setCopy(event.target.checked)} />พิมพ์เป็นสำเนา</label>
      <p className="text-xs text-gray-600">{kind === 'receipt' ? 'เลือก A4, แนวตั้ง, สเกล 100% และปิดหัวกระดาษ/ท้ายกระดาษของเบราว์เซอร์' : 'เลือกขนาดกระดาษเดียวกันในหน้าต่างเครื่องพิมพ์ ตั้งสเกล 100% และปิดหัวกระดาษ/ท้ายกระดาษของเบราว์เซอร์'}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-2 text-sm">{notice}</p>}
      <button type="button" disabled={busy} onClick={() => void print()} className="mt-3 rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{busy ? 'กำลังโหลด...' : 'สั่งพิมพ์'}</button>
    </div>
    {order && kind === 'receipt' && <article className="invoice-sheet" aria-label="เอกสารสำหรับพิมพ์">
      <header className="invoice-header"><div><h1>Invoice</h1><p className="invoice-document-title">ใบแจ้งหนี้ / ใบเสร็จรับเงิน{copy ? ' (สำเนา)' : ''}</p></div><div className="invoice-mark" aria-hidden="true">฿</div></header>
      <section className="invoice-meta"><div><p><strong>Invoice number</strong><span>{order.id}</span></p><p><strong>Date of issue</strong><span>{String(order.date).slice(0, 10)}</span></p><p><strong>Payment date</strong><span>{receiptDate(order.paidAt)}</span></p></div></section>
      <section className="invoice-parties"><div><h2>From</h2><p>{SHOP_INVOICE.legalName}</p>{SHOP_INVOICE.addressLines.map(line => <p key={line}>{line}</p>)}{SHOP_INVOICE.phone && <p>{SHOP_INVOICE.phone}</p>}{SHOP_INVOICE.email && <p>{SHOP_INVOICE.email}</p>}{SHOP_INVOICE.taxId && <p>Tax ID: {SHOP_INVOICE.taxId}</p>}</div><div><h2>Bill to</h2><p>ลูกค้าโต๊ะ {order.table}</p><p>ออเดอร์รับประทานที่ร้าน</p></div></section>
      {order.paymentStatus === 'partially_refunded' && <p className="invoice-status">คืนเงินบางส่วนแล้ว</p>}
      {order.paymentStatus === 'refunded' && <p className="invoice-status">คืนเงินทั้งหมดแล้ว</p>}
      <table className="invoice-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{order.items.map(item => <tr key={item.id}><td><strong>{item.name}</strong>{item.temperature && <span>{item.temperature === 'hot' ? 'ร้อน' : 'เย็น'}</span>}{item.toppings.map((topping, index) => <span key={`${topping.id}:${index}`}>+ {topping.name}</span>)}</td><td>{item.qty}</td><td>{money(Number(item.price) / item.qty)}</td><td>{money(Number(item.price))}</td></tr>)}</tbody></table>
      {order.note && <p className="invoice-note">หมายเหตุ: {order.note}</p>}
      {amounts && <section className="invoice-summary"><p><span>Subtotal</span><span>{money(Number(order.total))}</span></p><p><span>รับชำระแล้ว</span><span>{money(amounts.paid)}</span></p>{order.paymentStatus !== 'succeeded' && <p><span>คืนเงินแล้ว</span><span>{money(amounts.refunded)}</span></p>}<p className="invoice-total"><strong>{order.paymentStatus === 'refunded' ? 'ยอดคงเหลือ' : 'ยอดรับชำระสุทธิ'}</strong><strong>{money(amounts.net)}</strong></p><p><span>Payment method</span><span>{amounts.methods}</span></p></section>}
      <footer className="invoice-footer"><span>{order.id} · {title}</span><span>Page 1 of 1</span></footer>
    </article>}
    {order && kind === 'kitchen' && <article className="receipt-sheet" aria-label="เอกสารสำหรับพิมพ์">
      <header><h1>{SHOP_NAME}</h1><h2>{title}{copy ? ' (สำเนา)' : ''}</h2></header>
      <p>เลขออเดอร์: {order.id}</p>
      <p className="receipt-table">โต๊ะ: {order.table}</p>
      <p>วันที่สั่ง: {String(order.date).slice(0, 10)} {order.time?.slice(0, 5)}</p>
      {order.paymentStatus === 'partially_refunded' && <p className="receipt-status">คืนเงินบางส่วนแล้ว — ตรวจรายการที่คืนเงินก่อนจัดเตรียมอาหาร</p>}
      {order.paymentStatus === 'refunded' && <p className="receipt-status">คืนเงินทั้งหมดแล้ว</p>}
      <div className="receipt-items">{order.items.map(item => <section className="receipt-item" key={item.id}>
        <div className="receipt-row"><strong>{item.name} × {item.qty}</strong></div>
        {item.temperature && <p>{item.temperature === 'hot' ? 'ร้อน' : 'เย็น'}</p>}
        {item.toppings.map((topping, index) => <p key={`${topping.id}:${index}`}>+ {topping.name}</p>)}
      </section>)}</div>
      {order.note && <p>หมายเหตุ: {order.note}</p>}
      <p className="receipt-thanks">เอกสารสำหรับจัดเตรียมอาหาร</p>
    </article>}
  </dialog>, document.body);
}
