import { test, expect } from '@playwright/test';

test('a valid QR scan starts a fresh visit and clears the previous tracking pointer', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lastOrderId:A01', 'OLD-ORDER');
    localStorage.setItem('lastOrderId:A02', 'OTHER-TABLE');
    class Stream { addEventListener() {} close() {} }
    Object.assign(window, { EventSource: Stream });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ json: path.includes('/qr-codes/resolve/') ? { tableId: 'A01' } : [] });
  });
  await page.goto('/q/test-token');
  await expect(page).toHaveURL(/\/order\/A01$/);
  expect(await page.evaluate(() => localStorage.getItem('lastOrderId:A01'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('lastOrderId:A02'))).toBe('OTHER-TABLE');
  await expect(page.getByRole('link', { name: 'สถานะออเดอร์', exact: true })).toHaveCount(0);
});

for (const path of ['menu', 'status']) {
  test(`clear completed tracking from ${path} without clearing another table`, async ({ page }) => {
    let status = 'ready';
    let fail = false;
    await page.addInitScript(() => {
      localStorage.setItem('lastOrderId:A01', 'ORDER-1');
      localStorage.setItem('lastOrderId:A02', 'ORDER-2');
      class Stream { addEventListener() {} close() {} }
      Object.assign(window, { EventSource: Stream });
    });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body: unknown = [];
      if (url.pathname.endsWith('/categories')) body = [{ id: 'bualoy', label: 'บัวลอย' }];
      if (url.pathname.endsWith('/orders/ORDER-1')) {
        if (fail) return route.fulfill({ status: 500, json: { error: 'Temporary error' } });
        body = { id: 'ORDER-1', table: 'A01', fulfillmentStatus: status, paymentStatus: 'succeeded', items: [], total: 30, currency: 'THB' };
      }
      await route.fulfill({ json: body });
    });
    await page.clock.install();
    await page.goto(`/order/A01/${path}`);
    await expect(page.getByRole('link', { name: 'สถานะออเดอร์', exact: true })).toBeVisible();
    fail = true;
    await page.clock.fastForward(3100);
    await expect(page.getByRole('link', { name: 'สถานะออเดอร์', exact: true })).toBeVisible();
    fail = false;
    status = 'served';
    await page.clock.fastForward(6100);
    await expect(page.getByRole('link', { name: 'สถานะออเดอร์', exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('lastOrderId:A01'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('lastOrderId:A02'))).toBe('ORDER-2');
    if (path === 'status') {
      await expect(page.getByText('ยังไม่มีออเดอร์ให้ติดตาม')).toBeVisible();
      await expect(page.getByText('เลขอ้างอิง ORDER-1')).toHaveCount(0);
    }
  });
}
