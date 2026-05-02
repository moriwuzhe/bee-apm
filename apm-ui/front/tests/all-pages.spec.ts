import { test, expect } from '@playwright/test';
import { mockApiCalls } from './setup';

test.describe('Menu Navigation Tests', () => {
  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Projects', path: '/projects' },
    { name: 'Applications', path: '/applications' },
    { name: 'Agent', path: '/agent' },
    { name: 'JVM', path: '/jvm' },
    { name: 'Topology', path: '/topology' },
    { name: 'Service Dependency', path: '/service-dep' },
    { name: 'Releases', path: '/releases' },
    { name: 'Alert Rules', path: '/alert-rules' },
    { name: 'Users', path: '/users' },
    { name: 'Roles', path: '/roles' },
    { name: 'Permissions', path: '/permissions' },
    { name: 'Release Analysis', path: '/release-analysis' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} - should load page successfully`, async ({ page }) => {
      await mockApiCalls(page);
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(pageInfo.path));
    });
  }
});