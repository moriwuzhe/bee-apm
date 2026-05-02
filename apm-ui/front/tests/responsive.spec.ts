import { test, expect } from '@playwright/test';
import { mockApiCalls } from '../setup';

const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

test.describe('Responsive Design Tests', () => {
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
    test.describe(`${pageInfo.name} Responsive`, () => {
      for (const viewport of viewports) {
        test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
          await mockApiCalls(page);
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');

          const body = page.locator('body');
          const box = await body.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThan(0);
          expect(box!.height).toBeGreaterThan(0);

          const errors: string[] = [];
          page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('API request failed')) {
              errors.push(msg.text());
            }
          });
          await page.waitForTimeout(500);

          if (errors.length > 0) {
            console.log(`Console errors at ${viewport.name}:`, errors);
          }
        });
      }
    });
  }
});