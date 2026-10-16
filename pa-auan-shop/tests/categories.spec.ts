import { test, expect, type Page } from '@playwright/test';

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
