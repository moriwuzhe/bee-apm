import { test, expect } from '@playwright/test';
import { mockApiCalls } from '../setup';

test.describe('Roles', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiCalls(page);
  });

  test('should load roles page successfully', async ({ page }) => {
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/roles');
    await expect(page).toHaveURL(/\/roles/);
  });

  test('should load roles without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('API request failed')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const apiErrors = errors.filter(e => e.includes('API request failed'));
    expect(apiErrors).toHaveLength(0);
  });
});