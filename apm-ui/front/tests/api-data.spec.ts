import { test, expect } from '@playwright/test';

test.describe('API Data Tests - Captures Backend Responses', () => {
  const pages = [
    { name: 'Dashboard', path: '/dashboard', apiEndpoints: [
      '/api/dashboard/stats',
      '/api/dashboard/trend',
      '/api/dashboard/alert-trend',
      '/api/dashboard/recent-alerts',
      '/api/dashboard/top-apps'
    ]},
    { name: 'Projects', path: '/projects', apiEndpoints: ['/api/projects'] },
    { name: 'Applications', path: '/applications', apiEndpoints: ['/api/applications'] },
    { name: 'Agent', path: '/agent', apiEndpoints: ['/api/agents'] },
    { name: 'JVM', path: '/jvm', apiEndpoints: ['/api/jvm'] },
    { name: 'Releases', path: '/releases', apiEndpoints: ['/api/releases'] },
    { name: 'Alert Rules', path: '/alert-rules', apiEndpoints: ['/api/alert-rules'] },
    { name: 'Users', path: '/users', apiEndpoints: ['/api/users'] },
    { name: 'Roles', path: '/roles', apiEndpoints: ['/api/roles'] },
    { name: 'Permissions', path: '/permissions', apiEndpoints: ['/api/permissions'] },
  ];

  test('should capture and log all API responses', async ({ page }) => {
    const apiResponses: Record<string, object> = {};

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const body = await response.json();
          const endpoint = url.replace('http://localhost:8081', '');
          apiResponses[endpoint] = body;
          console.log(`[API Response] ${endpoint}:`, JSON.stringify(body, null, 2));
        } catch {
          console.log(`[API Response] ${url}: (non-JSON)`);
        }
      }
    });

    for (const pageInfo of pages) {
      console.log(`\n========== Testing ${pageInfo.name} ==========`);
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    console.log('\n========== Summary of API Responses ==========');
    for (const [endpoint, data] of Object.entries(apiResponses)) {
      console.log(`\n${endpoint}:`);
      console.log(JSON.stringify(data, null, 2));
    }
  });

  for (const pageInfo of pages) {
    test(`${pageInfo.name} - should load data from APIs`, async ({ page }) => {
      let apiSuccess = false;
      const apiData: object[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/') && response.status() === 200) {
          try {
            const body = await response.json();
            apiData.push(body);
            if (response.url().includes(pageInfo.path.replace('/', ''))) {
              apiSuccess = true;
            }
          } catch {
          }
        }
      });

      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log(`\n[${pageInfo.name}] API Responses captured:`, apiData.length);
      if (apiData.length > 0) {
        console.log(`Sample data from ${pageInfo.name}:`, JSON.stringify(apiData[0], null, 2));
      }
    });
  }
});