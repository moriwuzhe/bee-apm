import { test, expect } from '@playwright/test';
import { mockApiCalls } from '../setup';

test.describe('Alert Rules', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiCalls(page);
  });

  test('should load alert rules page successfully', async ({ page }) => {
    await page.goto('/alert-rules');
    await page.waitForLoadState('networkidle');
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/alert-rules');
    await expect(page).toHaveURL(/\/alert-rules/);
  });

  test('should load alert rules without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('API request failed')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/alert-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const apiErrors = errors.filter(e => e.includes('API request failed'));
    expect(apiErrors).toHaveLength(0);
  });
});