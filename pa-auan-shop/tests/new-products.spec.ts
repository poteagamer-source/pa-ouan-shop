import { test, expect } from '@playwright/test';

test('only two latest items have badges and realtime addition retires the older badge', async ({ page }) => {
  const product = (id: string, isNew: boolean) => ({ id, name: `เมนู ${id}`, category: 'bualoy', price: 35,
    image: '/images/menu-bl1.png', active: true, isNew, createdAt: `2026-10-${id.slice(1)}T00:00:00Z` });
  let products = [product('P10', false), product('P11', true), product('P12', true)];
  await page.addInitScript(() => {
    class Stream {
      listeners: Record<string, (event: { data: string }) => void> = {};
      constructor() { Object.assign(window, { productStream: this }); }
      addEventListener(name: string, callback: (event: { data: string }) => void) { this.listeners[name] = callback; }
      close() {}
    }
    Object.assign(window, { EventSource: Stream });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path.endsWith('/categories')) body = [{ id: 'bualoy', label: 'บัวลอย' }];
    if (path.endsWith('/products')) body = products;
    if (/\/products\/P\d+$/.test(path)) body = products.find(p => path.endsWith(`/${p.id}`));
    await route.fulfill({ json: body });
  });
  await page.goto('/order/A01/menu');
  await expect(page.getByLabel('สินค้าใหม่', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('link').filter({ hasText: 'เมนู P10' }).getByLabel('สินค้าใหม่')).toHaveCount(0);
  await page.getByRole('button', { name: 'เมนูใหม่', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'เมนูใหม่ล่าสุด' })).toBeVisible();
  await expect(page.getByText('เมนู P10', { exact: true })).toHaveCount(0);
  await expect(page.getByText('เมนู P11', { exact: true })).toBeVisible();
  products = [product('P10', false), product('P11', false), product('P12', true), product('P13', true)];
  await page.evaluate(() => (window as any).productStream.listeners.update({ data: JSON.stringify({ resource: 'products', action: 'created', id: 'P13' }) }));
  await expect(page.getByText('เมนู P13', { exact: true })).toBeVisible();
  await expect(page.getByText('เมนู P11', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('สินค้าใหม่', { exact: true })).toHaveCount(2);
  await page.getByRole('link', { name: 'สั่งอาหารเพิ่ม', exact: true }).click();
  await expect(page.getByText('เมนู P11', { exact: true })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: 'เมนู P11' }).getByLabel('สินค้าใหม่')).toHaveCount(0);
  await page.getByRole('link').filter({ hasText: 'เมนู P13' }).click();
  await expect(page.getByLabel('สินค้าใหม่', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'เมนูใหม่', exact: true }).click();
  await expect(page).toHaveURL(/\/order\/A01\/menu$/);
  await expect(page.getByLabel('สินค้าใหม่', { exact: true })).toHaveCount(2);
});
