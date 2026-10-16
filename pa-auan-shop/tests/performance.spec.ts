import { test, expect, type Page } from '@playwright/test';

const order = (id: string, status = 'served') => ({
  id, table: 'A01', date: '2026-10-15', time: '12:00', total: 35,
  paymentStatus: 'succeeded', fulfillmentStatus: status, note: '',
  currency: 'THB', amountMinor: 3500, servedAt: '12:05',
  items: [{ id: 1, productId: 'bl1', name: 'Test food', qty: 1, price: 35,
    basePrice: 35, image: '/images/menu-bl1.png', toppings: [] }],
});

async function setup(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests: string[] = [];
  await page.addInitScript(() => {
    const streams: unknown[] = [];
    class FakeEventSource {
      onopen?: () => void;
      onerror?: () => void;
      listeners: Record<string, (event: { data: string }) => void> = {};
      closed = false;
      constructor() { streams.push(this); setTimeout(() => this.onopen?.(), 0); }
      addEventListener(name: string, callback: (event: { data: string }) => void) { this.listeners[name] = callback; }
      close() { this.closed = true; }
    }
    Object.assign(window, { EventSource: FakeEventSource, testStreams: streams });
  });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    requests.push(url.pathname + url.search);
    let body: unknown = [];
    if (url.pathname.endsWith('/auth/me')) body = { id: 1, username: 'test', displayName: 'Test', role: 'manager' };
    else if (url.pathname.endsWith('/categories')) body = [{ id: 'bualoy', label: 'Bualoy' }];
    else if (url.pathname.endsWith('/products')) body = [{ id: 'bl1', name: 'Test food', price: 35, category: 'bualoy', image: '/images/menu-bl1.png', active: true }];
    else if (url.pathname.endsWith('/served-history')) {
      const current = Number(url.searchParams.get('page'));
      body = { page: current, pageSize: 50, total: 120, recent: [order('S0')], peakTimes: [['12:00 - 16:00', 120]],
        items: Array.from({ length: current === 2 ? 20 : 50 }, (_, i) => order(`S${current * 50 + i}`)) };
    } else if (url.pathname.endsWith('/orders')) body = [order('ACTIVE', 'queued')];
    await route.fulfill({ json: body });
  });
  return { errors, requests };
}

test('menu uses optimized images and shares one realtime connection', async ({ page }) => {
  const { errors } = await setup(page);
  await page.goto('/order/A01/menu');
  const image = page.locator('img[src="/images/menu-bl1.webp"]');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const count = await page.evaluate(() => (window as any).testStreams.filter((stream: any) => !stream.closed).length);
  expect(count).toBe(1);
  expect(errors).toEqual([]);
});

test('served history pages retain full totals and aggregates', async ({ page }) => {
  const { errors, requests } = await setup(page);
  await page.goto('/staff/waiter/served');
  await expect(page.getByText('หน้า 1/3 · ทั้งหมด 120 รายการ')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(50);
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
  await expect(page.getByText('หน้า 2/3 · ทั้งหมด 120 รายการ')).toBeVisible();
  await expect(page.locator('tbody tr').first()).toContainText('S50');
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'ถัดไป', exact: true })).toBeDisabled();
  expect(requests.some(url => url.includes('fulfillmentStatus=served'))).toBe(false);
  expect(errors).toEqual([]);
});

test('healthy realtime avoids 5-second polling, disconnect restores polling', async ({ page }) => {
  const { requests, errors } = await setup(page);
  await page.goto('/staff/kitchen/orders');
  await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
  await page.waitForTimeout(200);
  await page.clock.install();
  const before = requests.filter(url => url.startsWith('/api/orders?')).length;
  await page.clock.fastForward(16000);
  expect(requests.filter(url => url.startsWith('/api/orders?')).length).toBe(before);
  await page.evaluate(() => {
    const stream = (window as any).testStreams.find((item: any) => !item.closed);
    stream.onerror();
  });
  await page.clock.fastForward(5000);
  await expect.poll(() => requests.filter(url => url.startsWith('/api/orders?')).length).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('realtime order changes refresh the kitchen without a page reload', async ({ page }) => {
  const { requests } = await setup(page);
  await page.goto('/staff/kitchen/orders');
  await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
  await page.waitForTimeout(200);
  const before = requests.filter(url => url.startsWith('/api/orders?')).length;
  await page.evaluate(() => {
    const stream = (window as any).testStreams.find((item: any) => !item.closed);
    stream.listeners.update({ data: JSON.stringify({ resource: 'orders', action: 'updated', id: 'ACTIVE' }) });
  });
  await expect.poll(() => requests.filter(url => url.startsWith('/api/orders?')).length).toBeGreaterThan(before);
});
