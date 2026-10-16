import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page) {
  await page.clock.install({ time: new Date('2026-10-16T05:00:00Z') });
  await page.addInitScript(() => {
    class Stream { addEventListener() {} close() {} }
    Object.assign(window, { EventSource: Stream });
  });
  const state = { fail: false, requests: [] as string[] };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body: unknown = [];
    if (url.pathname.endsWith('/auth/me')) body = { id: 1, displayName: 'Test', role: 'manager' };
    if (url.pathname.endsWith('/sales/summary')) {
      state.requests.push(url.search);
      if (state.fail) return route.fulfill({ status: 500, json: { error: 'ทดสอบโหลดไม่สำเร็จ' } });
      const year = url.searchParams.get('from')?.slice(0, 4);
      const byDay = year === '2026' ? [
        { date: '2026-01-01', revenue: 100, orderCount: 2 },
        { date: '2026-01-31', revenue: 50, orderCount: 1 },
        { date: '2026-02-01', revenue: 75, orderCount: 1 },
        { date: '2026-12-31', revenue: 200, orderCount: 2 },
      ] : year === '2025' ? [{ date: '2025-12-31', revenue: 900, orderCount: 3 }] : [];
      body = { currency: 'THB', byDay, revenue: 0, orderCount: 0, byCategory: [], topProducts: [] };
    }
    await route.fulfill({ json: body });
  });
  return state;
}

test('monthly totals cover boundaries, zero months, and match the chart', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/staff/report');
  const section = page.getByRole('region', { name: 'สรุปยอดขายรายเดือน' });
  await expect(section.locator('tbody tr')).toHaveCount(12);
  await expect(section.getByRole('row', { name: /^มกราคม/ })).toContainText('฿150.00');
  await expect(section.getByRole('row', { name: /^กุมภาพันธ์/ })).toContainText('฿75.00');
  await expect(section.getByRole('row', { name: /^มีนาคม/ })).toContainText('฿0.00');
  await expect(section.getByRole('row', { name: /^ธันวาคม/ })).toContainText('฿200.00');
  await expect(section.locator('tfoot')).toContainText('฿425.00');
  await expect(section.locator('tfoot')).toContainText('฿70.83');
  await expect(section.getByText('฿425.00', { exact: true })).toHaveCount(2);
  const dots = section.locator('.recharts-area-dot');
  await expect(dots).toHaveCount(12);
  await dots.first().hover();
  await expect(section.locator('.recharts-tooltip-wrapper')).toContainText('฿150.00');
  await page.getByRole('button', { name: '7 วัน', exact: true }).click();
  await expect(section.locator('tfoot')).toContainText('฿425.00');
  expect(state.requests.every(query => query.includes('from=2026-01-01') && query.includes('to=2026-12-31'))).toBe(true);
});

test('year selection separates years and displays empty years', async ({ page }) => {
  await setup(page);
  await page.goto('/staff/report');
  const section = page.getByRole('region', { name: 'สรุปยอดขายรายเดือน' });
  await expect(section.getByRole('button', { name: 'ปีถัดไป' })).toBeDisabled();
  await section.getByRole('button', { name: 'ปีก่อนหน้า' }).click();
  await expect(section.getByRole('heading', { name: 'ยอดขายรายเดือน พ.ศ. 2568' })).toBeVisible();
  await expect(section.locator('tfoot')).toContainText('฿900.00');
  await expect(section.getByRole('row', { name: /^มกราคม/ })).toContainText('฿0.00');
  await section.getByRole('button', { name: 'ปีก่อนหน้า' }).click();
  await expect(section.getByText('ยังไม่มียอดขายในปีนี้')).toBeVisible();
  await expect(section.locator('tbody tr')).toHaveCount(12);
  await expect(section.locator('tfoot')).toContainText('฿0.00');
});

test('failed monthly requests show an error and can be retried', async ({ page }) => {
  const state = await setup(page);
  state.fail = true;
  await page.goto('/staff/report');
  const section = page.getByRole('region', { name: 'สรุปยอดขายรายเดือน' });
  await expect(section.getByRole('alert')).toContainText('ทดสอบโหลดไม่สำเร็จ');
  await expect(section.locator('table')).toHaveCount(0);
  state.fail = false;
  await section.getByRole('button', { name: 'ลองใหม่' }).click();
  await expect(section.locator('tfoot')).toContainText('฿425.00');
});
