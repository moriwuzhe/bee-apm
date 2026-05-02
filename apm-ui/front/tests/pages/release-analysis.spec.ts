import { test, expect } from '@playwright/test';
import { mockApiCalls } from '../setup';

test.describe('版本发布与影响分析 - ReleaseAnalysis', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiCalls(page);
  });

  test('1. 页面基本加载', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const title = page.getByRole('heading', { name: '发布影响分析' });
    await expect(title).toBeVisible();
  });

  test('2. 统计卡片显示', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=版本发布数')).toBeVisible();
    await expect(page.getByText('高风险变更', { exact: true })).toBeVisible();
    await expect(page.locator('text=受影响服务')).toBeVisible();
    await expect(page.locator('text=活跃告警数')).toBeVisible();
  });

  test('3. 变更类型筛选', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: '新增', exact: true });
    await expect(addButton).toBeVisible();

    const modifyButton = page.getByRole('button', { name: '修改', exact: true });
    await expect(modifyButton).toBeVisible();

    const deleteButton = page.getByRole('button', { name: '删除', exact: true });
    await expect(deleteButton).toBeVisible();
  });

  test('4. 导出报告按钮', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const exportButton = page.locator('button', { hasText: '导出报告' });
    await expect(exportButton).toBeVisible();
    await exportButton.click();
  });

  test('5. 热力图区域显示', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=变更热力图')).toBeVisible();
  });

  test('6. 版本列表显示', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=版本列表')).toBeVisible();
    await expect(page.locator('text=全部版本')).toBeVisible();
  });

  test('7. 版本列表点击选择', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const firstVersion = page.locator('.space-y-2 >> .px-3 >> .text-xs >> text=order-service').first();
    if (await firstVersion.isVisible()) {
      await firstVersion.click();
    }
  });

  test('8. 影响链路图显示', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=影响链路图')).toBeVisible();
  });

  test('9. 链路图缩放功能', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const zoomInButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    await zoomInButton.click();
    await zoomInButton.click();
  });

  test('10. 风险节点告警联动区域', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=风险节点告警联动')).toBeVisible();
    await expect(page.getByText('查看全部告警').first()).toBeVisible();
  });

  test('11. 告警卡片显示', async ({ page }) => {
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');

    const alertCards = page.locator('.rounded-lg').filter({ hasText: '分钟前' });
    const count = await alertCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('12. 页面URL正确', async ({ page }) => {
    await page.goto('/release-analysis');
    await expect(page).toHaveURL(/\/release-analysis/);
  });

  test('13. 无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  });

  test('14. 响应式布局 - 桌面', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-cmp="ReleaseAnalysis"]')).toBeVisible();
  });

  test('15. 响应式布局 - 平板', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/release-analysis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-cmp="ReleaseAnalysis"]')).toBeVisible();
  });
});