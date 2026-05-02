import { test, expect } from '@playwright/test';
import { mockApiCalls } from '../setup';

test.describe('Agent Control', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiCalls(page);
  });

  test('should load agent control page successfully', async ({ page }) => {
    await page.goto('/agent');
    await page.waitForLoadState('networkidle');
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/agent');
    await expect(page).toHaveURL(/\/agent/);
  });

  test('should load agent data without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('API request failed')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/agent');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const apiErrors = errors.filter(e => e.includes('API request failed'));
    expect(apiErrors).toHaveLength(0);
  });
});