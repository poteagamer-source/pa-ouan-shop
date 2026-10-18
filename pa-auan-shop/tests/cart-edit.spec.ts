import { test, expect } from '@playwright/test';

test('edit duplicate cart lines independently, cancel, save and remove all', async ({ page }) => {
  const product = { id: 'P1', name: 'บัวลอยไข่หวาน', category: 'bualoy', price: 30, image: '/images/menu-bl1.webp', active: true };
  await page.addInitScript(() => {
    class Stream { addEventListener() {} close() {} }
    Object.assign(window, { EventSource: Stream });
  });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body: unknown = [];
    if (url.pathname.endsWith('/categories')) body = [{ id: 'bualoy', label: 'บัวลอย' }];
    if (url.pathname.endsWith('/products')) body = [product];
    if (url.pathname.endsWith('/products/P1')) body = product;
    if (url.pathname.endsWith('/toppings') && url.searchParams.get('tier') !== '10') body = [{ id: 'T1', name: 'ไข่หวาน', price: 5, image: '' }];
    await route.fulfill({ json: body });
  });
  await page.goto('/order/A01/product/P1');
  await page.getByRole('button', { name: 'เพิ่มลงในตะกร้า', exact: true }).click();
  await page.getByRole('link', { name: 'ย้อนกลับ', exact: true }).click();
  await page.getByRole('link').filter({ hasText: 'บัวลอยไข่หวาน' }).click();
  await page.getByRole('button', { name: 'เพิ่มลงในตะกร้า', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  const first = page.getByRole('article').first();
  await first.getByRole('button', { name: 'เพิ่มจำนวน' }).click();
  await first.getByLabel('อุณหภูมิ').selectOption('hot');
  await first.getByRole('checkbox', { name: /ไข่หวาน/ }).check();
  await expect(first).toContainText('฿70.00');
  await expect(page.getByRole('article').nth(1)).toContainText('฿30.00');
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(first).toContainText('1 ชิ้น');
  await expect(first).toContainText('เย็น');
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await first.getByRole('button', { name: 'เพิ่มจำนวน' }).click();
  await first.getByLabel('อุณหภูมิ').selectOption('hot');
  await first.getByRole('checkbox', { name: /ไข่หวาน/ }).check();
  await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();
  await expect(first).toContainText('2 ชิ้น');
  await expect(first).toContainText('ร้อน');
  await expect(page.getByText('฿100.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await page.getByRole('button', { name: 'ลบรายการ', exact: true }).first().click();
  await page.getByRole('button', { name: 'ลบรายการ', exact: true }).first().click();
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await page.getByRole('button', { name: 'ลบรายการ', exact: true }).first().click();
  await page.getByRole('button', { name: 'ลบรายการ', exact: true }).first().click();
  await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();
  await expect(page.getByText('ยังไม่มีสินค้าในตะกร้า')).toBeVisible();
});
