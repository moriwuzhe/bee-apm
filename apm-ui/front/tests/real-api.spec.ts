import { test, expect } from '@playwright/test';

test.describe('Real API Data Tests', () => {
  test('Dashboard - should load real data from backend', async ({ page }) => {
    const responses: object[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const body = await response.json();
          responses.push({ url: response.url(), data: body });
          console.log(`[API] ${response.url()}:`, JSON.stringify(body, null, 2));
        } catch {}
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('\n========== Dashboard API Responses ==========');
    console.log(`Total API calls captured: ${responses.length}`);
  });

  test('Projects - should load real data from backend', async ({ page }) => {
    const responses: object[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const body = await response.json();
          responses.push({ url: response.url(), data: body });
          console.log(`[API] ${response.url()}:`, JSON.stringify(body, null, 2));
        } catch {}
      }
    });

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('\n========== Projects API Responses ==========');
    console.log(`Total API calls captured: ${responses.length}`);
  });

  test('Users - should load real data from backend', async ({ page }) => {
    const responses: object[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const body = await response.json();
          responses.push({ url: response.url(), data: body });
          console.log(`[API] ${response.url()}:`, JSON.stringify(body, null, 2));
        } catch {}
      }
    });

    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('\n========== Users API Responses ==========');
    console.log(`Total API calls captured: ${responses.length}`);
  });
});