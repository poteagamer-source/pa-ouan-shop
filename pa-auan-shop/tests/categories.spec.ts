import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';

async function setup(page: Page) {
  const state = { categories: [{ id: 'bualoy', label: 'บัวลอย' }], products: [] as any[], fail: false, creates: 0 };
  await page.addInitScript(() => {
    class Stream { addEventListener() {} close() {} }
    Object.assign(window, { EventSource: Stream });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path.endsWith('/auth/me')) body = { id: 1, displayName: 'Test', role: 'manager' };
    if (path.endsWith('/categories')) {
      if (route.request().method() === 'POST') {
        state.creates++;
        if (state.fail) return route.fulfill({ status: 500, json: { error: 'บันทึกไม่สำเร็จ ลองใหม่' } });
        const created = { id: 'cat-drinks', label: route.request().postDataJSON().label };
        state.categories.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      body = state.categories;
    }
    if (path.endsWith('/products')) {
      if (route.request().method() === 'POST') {
        const created = { ...route.request().postDataJSON(), id: 'P1', active: true };
        state.products.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      body = state.products;
    }
    if (path.endsWith('/stock')) body = state.products.map(item => ({ ...item, stockQty: 10, unit: 'ถ้วย', status: 'enough' }));
    await route.fulfill({ json: body });
  });
  await page.goto('/staff/menu');
  return state;
}

test('manager can mark a product as new and unmark it when editing', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'เพิ่มสินค้า', exact: true }).click();
  const checkbox = page.getByRole('checkbox', { name: 'สินค้าใหม่', exact: true });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('เมนูใหม่ทดสอบ');
  await page.getByLabel('ราคา (บาท)', { exact: true }).fill('40');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.products[0].isNew).toBe(true);
  await page.route('**/api/products/P1', async route => {
    Object.assign(state.products[0], route.request().postDataJSON());
    await route.fulfill({ json: state.products[0] });
  });
  await page.getByRole('row').filter({ hasText: 'เมนูใหม่ทดสอบ' }).getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.products[0].isNew).toBe(false);
});

test('upload previews the stored image and saves its URL with the product', async ({ page }) => {
  const state = await setup(page);
  let finishUpload!: () => void;
  const pending = new Promise<void>(resolve => { finishUpload = resolve; });
  await page.route('**/api/images', async route => {
    expect(route.request().headers()['content-type']).toBe('image/webp');
    expect(route.request().postDataBuffer()!.length).toBeGreaterThan(0);
    await pending;
    await route.fulfill({ status: 201, json: { url: '/api/images/test.webp', bytes: 4096 } });
  });
  await page.route('**/api/images/test.webp', route => route.fulfill({ path: resolve('public/images/menu-bl1.webp'), contentType: 'image/webp' }));
  await page.getByRole('button', { name: 'เพิ่มสินค้า', exact: true }).click();
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('รูปทดสอบ');
  await page.getByLabel('ราคา (บาท)', { exact: true }).fill('40');
  await page.getByLabel('เลือกรูปสินค้า').setInputFiles(resolve('public/images/menu-bl1.webp'));
  await expect(page.getByRole('button', { name: 'บันทึก', exact: true })).toBeDisabled();
  finishUpload();
  await expect(page.getByRole('status')).toContainText('อัปโหลดแล้ว (4 KB)');
  await expect(page.getByAltText('ตัวอย่างรูปสินค้า')).toHaveAttribute('src', '/api/images/test.webp');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  expect(state.products[0].image).toBe('/api/images/test.webp');
});

test('failed image uploads retain the previous image and allow retry', async ({ page }) => {
  await setup(page);
  await page.route('**/api/images', route => route.fulfill({ status: 413, json: { error: 'รูปภาพต้องมีขนาดไม่เกิน 5 MB' } }));
  await page.getByRole('button', { name: 'เพิ่มสินค้า', exact: true }).click();
  const original = await page.getByAltText('ตัวอย่างรูปสินค้า').getAttribute('src');
  await page.getByLabel('เลือกรูปสินค้า').setInputFiles(resolve('public/images/menu-bl1.webp'));
  await expect(page.getByRole('alert')).toContainText('ไม่เกิน 5 MB');
  await expect(page.getByAltText('ตัวอย่างรูปสินค้า')).toHaveAttribute('src', original!);
  await expect(page.getByRole('button', { name: 'เปลี่ยนรูปภาพ' })).toBeEnabled();
});

test('duplicate product names are rejected across categories without losing input', async ({ page }) => {
  const state = await setup(page);
  state.products.push({ id: 'P1', name: 'ชาไทย', category: 'other', price: 40, active: false, image: '' });
  await page.reload();
  await page.getByRole('button', { name: 'เพิ่มสินค้า', exact: true }).click();
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill(' ชาไทย ');
  await page.getByLabel('ราคา (บาท)', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('มีชื่อสินค้านี้อยู่แล้ว');
  await expect(page.getByLabel('ราคา (บาท)', { exact: true })).toHaveValue('50');
  expect(state.products).toHaveLength(1);
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('ชาเขียว');
  // The API can detect a conflict created by another manager after the page loaded.
  await page.route('**/api/products', async route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 409, json: { error: 'มีชื่อสินค้านี้อยู่แล้ว กรุณาใช้ชื่ออื่น' } });
    await route.fallback();
  });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('มีชื่อสินค้านี้อยู่แล้ว');
  await expect(page.getByLabel('ชื่อสินค้า', { exact: true })).toHaveValue('ชาเขียว');
});

test('editing retains its own name but rejects the name of another product', async ({ page }) => {
  const state = await setup(page);
  state.products.push(
    { id: 'P1', name: 'ชาไทย', category: 'bualoy', price: 40, active: true, image: '' },
    { id: 'P2', name: 'ชาเขียว', category: 'bualoy', price: 45, active: true, image: '' },
  );
  let updates = 0;
  await page.route('**/api/products/P1', async route => {
    updates++;
    Object.assign(state.products[0], route.request().postDataJSON());
    await route.fulfill({ json: state.products[0] });
  });
  await page.reload();
  await page.getByRole('row').filter({ hasText: 'ชาไทย' }).getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('ชาเขียว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('มีชื่อสินค้านี้อยู่แล้ว');
  expect(updates).toBe(0);
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('ชาไทย');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(updates).toBe(1);
});

test('create a category inside a product form and reuse it across screens', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'เพิ่มสินค้า', exact: true }).click();
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('ชาไทย');
  await page.getByLabel('ราคา (บาท)', { exact: true }).fill('40');
  await page.getByRole('button', { name: '+ เพิ่มหมวดหมู่ใหม่', exact: true }).click();
  await page.getByLabel('ชื่อหมวดหมู่', { exact: true }).fill('เครื่องดื่ม');
  await page.getByRole('button', { name: 'บันทึกหมวดหมู่' }).click();
  await expect(page.getByLabel('ชื่อสินค้า', { exact: true })).toHaveValue('ชาไทย');
  await expect(page.getByLabel('หมวดหมู่', { exact: true })).toHaveValue('cat-drinks');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('ชาไทย', { exact: true })).toBeVisible();
  expect(state.products[0].category).toBe('cat-drinks');
  await page.reload();
  await page.getByRole('button', { name: /เครื่องดื่ม.*1 รายการ/ }).click();
  await expect(page.getByText('ชาไทย', { exact: true })).toBeVisible();
  await page.goto('/staff/stock');
  await page.getByRole('button', { name: /เครื่องดื่ม.*1 รายการ/ }).click();
  await expect(page.getByText('ชาไทย', { exact: true })).toBeVisible();
  await page.goto('/order/A01/menu');
  await page.getByRole('button', { name: 'เครื่องดื่ม', exact: true }).click();
  await expect(page.getByText('ชาไทย', { exact: true })).toBeVisible();
});

test('duplicate and failed category creation keep the form recoverable', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'เพิ่มหมวดหมู่', exact: true }).click();
  await page.getByLabel('ชื่อหมวดหมู่', { exact: true }).fill(' บัวลอย ');
  await page.getByRole('button', { name: 'บันทึกหมวดหมู่' }).click();
  await expect(page.getByRole('alert')).toContainText('มีชื่อหมวดหมู่นี้อยู่แล้ว');
  expect(state.creates).toBe(0);
  state.fail = true;
  await page.getByLabel('ชื่อหมวดหมู่', { exact: true }).fill('เครื่องดื่ม');
  await page.getByRole('button', { name: 'บันทึกหมวดหมู่' }).click();
  await expect(page.getByRole('alert')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.getByLabel('ชื่อหมวดหมู่', { exact: true })).toHaveValue('เครื่องดื่ม');
  state.fail = false;
  await page.getByRole('button', { name: 'บันทึกหมวดหมู่' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /เครื่องดื่ม.*0 รายการ/ })).toBeVisible();
});
