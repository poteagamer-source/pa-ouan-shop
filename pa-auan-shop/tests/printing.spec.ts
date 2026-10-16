import { test, expect, type Page } from '@playwright/test';
import { receiptAmounts } from '../src/lib/receipt';
import type { Order, Payment } from '../src/types';

function sampleOrder(status: Order['paymentStatus'] = 'succeeded'): Order {
  return { id: 'RECEIPT-1', table: 'A01', date: '2026-10-15', time: '12:00',
    total: 100, amountMinor: 10000, currency: 'THB', currencyExponent: 2,
    paymentStatus: status, fulfillmentStatus: 'queued', paidAt: '2026-10-15T05:00:00Z',
    note: 'เย็น', items: [{ id: 1, productId: 'bl1', name: 'บัวลอยชื่อเมนูยาวสำหรับทดสอบการตัดบรรทัดบนกระดาษขนาดเล็ก',
      qty: 2, price: 100, basePrice: 45, temperature: 'cold', toppings: [{ id: 't1', name: 'ไข่หวาน', price: 5 }] }] };
}
function payment(status: Payment['status'] = 'succeeded', refund = 0): Payment {
  return { id: 'PAY-1', orderId: 'RECEIPT-1', provider: 'stripe', paymentMethod: 'promptpay', status,
    amountMinor: 10000, refundedAmountMinor: refund, currency: 'THB' };
}

async function setup(page: Page) {
  const state = { order: sampleOrder(), payments: [payment()], orderReads: 0 };
  await page.addInitScript(() => {
    Object.assign(window, { printCalls: 0 });
    window.print = () => { (window as any).printCalls += 1; };
    class Stream { addEventListener() {} close() {} }
    Object.assign(window, { EventSource: Stream });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path.endsWith('/auth/me')) body = { id: 1, displayName: 'Test', role: 'manager' };
    else if (path.endsWith('/sales')) body = [{ ...state.order, paymentVerified: true }];
    else if (path.endsWith('/orders/RECEIPT-1/payments')) body = state.payments;
    else if (path.endsWith('/orders/RECEIPT-1')) { body = state.order; state.orderReads += 1; }
    await route.fulfill({ json: body });
  });
  await page.goto('/staff/purchase-orders');
  return state;
}

test('receipt uses A4, isolates print layout, and marks copies', async ({ page }, testInfo) => {
  await setup(page);
  await page.getByRole('button', { name: 'พิมพ์ใบเสร็จ', exact: true }).click();
  const receipt = page.getByRole('article', { name: 'เอกสารสำหรับพิมพ์' });
  await expect(receipt).toHaveClass(/invoice-sheet/);
  await expect(receipt).toContainText('ใบเสร็จรับเงิน');
  await expect(receipt).toContainText('Receipt');
  await expect(receipt).toContainText('เลขที่ใบเสร็จ');
  await expect(receipt).toContainText('Bill to');
  await expect(receipt).toContainText('promptpay');
  await expect(receipt).toContainText('ไข่หวาน');
  await page.getByLabel('พิมพ์เป็นสำเนา').check();
  await expect(receipt).toContainText('(สำเนา)');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  await expect(page.locator('.receipt-controls')).toBeHidden();
  const pageWidth = await receipt.evaluate(el => ({ width: el.getBoundingClientRect().width, scroll: el.scrollWidth, client: el.clientWidth }));
  expect(pageWidth.width).toBeCloseTo(210 * 96 / 25.4, 0);
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);
  await page.screenshot({ path: testInfo.outputPath('invoice-a4.png'), fullPage: true });
  await page.pdf({ path: testInfo.outputPath('invoice-a4.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/order-print-open/);
});

test('printing rechecks refund amounts and does not claim physical success', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'พิมพ์ใบเสร็จ', exact: true }).click();
  await expect(page.getByRole('article')).toContainText('promptpay');
  state.order = sampleOrder('partially_refunded');
  state.payments = [payment('failed'), payment('partially_refunded', 2500)];
  await page.getByRole('button', { name: 'สั่งพิมพ์', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).printCalls)).toBe(1);
  const receipt = page.getByRole('article');
  await expect(receipt).toContainText('คืนเงินบางส่วนแล้ว');
  await expect(receipt.locator('.invoice-total')).toContainText('75.00');
  await expect(page.getByRole('status')).toContainText('เปิดหน้าต่างพิมพ์แล้ว');
  expect(state.orderReads).toBeGreaterThanOrEqual(2);
});

test('kitchen ticket contains preparation details without receipt totals', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'พิมพ์ใบครัว', exact: true }).click();
  const receipt = page.getByRole('article');
  await expect(receipt).toContainText('โต๊ะ: A01');
  await expect(receipt).toContainText('เย็น');
  await expect(receipt).toContainText('ไข่หวาน');
  await expect(receipt).not.toContainText('รับชำระสุทธิ');
});

test('unpaid and inconsistent refunds cannot print a receipt', async ({ page }) => {
  const state = await setup(page);
  state.order = sampleOrder('pending');
  await page.getByRole('button', { name: 'พิมพ์ใบเสร็จ', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้ยืนยัน');
  await page.getByRole('button', { name: 'สั่งพิมพ์', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้ยืนยัน');
  expect(await page.evaluate(() => (window as any).printCalls)).toBe(0);
  expect(() => receiptAmounts(sampleOrder('refunded'), [payment('refunded', 2500)])).toThrow();
  expect(receiptAmounts(sampleOrder('refunded'), [payment('refunded', 10000)]).net).toBe(0);
});
