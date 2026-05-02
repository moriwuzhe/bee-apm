---
name: "web-ui-automation"
description: "Provides Web UI automation testing capabilities using Playwright. Invoke when user asks to create UI tests, write Playwright tests, automate web interactions, or perform browser-based testing."
---

# Web UI Automation Testing

This skill provides capabilities for automated Web UI testing using Playwright.

## When to Invoke

**Invoke this skill when user:**
- Asks to create UI automation tests
- Wants to write Playwright tests
- Needs to automate web browser interactions
- Requests browser-based testing setup
- Asks for help with selectors, locators, or web element handling
- Needs to test React/Vue/Angular components
- Asks to run headless or headed browser tests

## Prerequisites

Ensure Playwright is installed:
```bash
npm install -D @playwright/test
npx playwright install
```

## Core Concepts

### 1. Playwright Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.locator('h1')).toHaveText('Example Domain');
});
```

### 2. Browser Contexts and Pages

```typescript
// Create isolated context
const context = await browser.newContext();
const page = await context.newPage();

// Context with options
const contextWithAuth = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  permissions: ['geolocation']
});
```

### 3. Locators (Recommended over page.locator)

```typescript
// Get elements by various selectors
const button = page.locator('button.submit');
const input = page.locator('input[name="username"]');
const link = page.locator('a[href="/dashboard"]');

// First matching element
const firstCard = page.locator('.card').first();

// Nth element
const thirdRow = page.locator('table tr').nth(2);
```

### 4. Common Actions

```typescript
// Click
await page.click('button#submit');
await page.locator('button').click({ force: true });

// Type and fill
await page.fill('input[name="email"]', 'user@example.com');
await page.type('textarea', 'slow typing', { delay: 100 });

// Select
await page.selectOption('select#country', 'US');
await page.check('input[type="checkbox"]');

// Hover and hover
await page.hover('div.menu-item');
await page.hoverAndWait('div.draggable', 'div.dropzone');

// Wait for navigation
await page.clickAndNavigate('a.link');
await page.waitForURL('**/dashboard/**');
```

### 5. Assertions

```typescript
import { expect } from '@playwright/test';

// Built-in matchers
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page.locator('.badge')).toHaveCount(5);
await expect(page.locator('input')).toBeEnabled();
await expect(page.locator('input')).toBeDisabled();
await expect(page.locator('.error')).toBeHidden();
await expect(page.locator('.loading')).toBeVisible();
await expect(page).toHaveURL(/.*dashboard/);
await expect(page).toHaveTitle('Dashboard');
```

### 6. Waiting for Elements

```typescript
// Auto-waiting (Playwright handles this automatically)
// Manual waits when needed
await page.waitForSelector('.loaded-content');
await page.waitForLoadState('networkidle');
await page.waitForResponse('**/api/data');
await page.waitForRequest('**/api/submit');
```

### 7. Network Interception

```typescript
await page.route('**/api/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ mock: 'data' })
  });
});

// Mock with delay
await page.route('**/api/users', async route => {
  await delay(1000);
  route.fulfill({ body: '[]' });
});
```

### 8. File Upload/Download

```typescript
// Upload
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Download
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button.download')
]);
await download.saveAs('saved-file.pdf');
```

### 9. iFrames and Shadow DOM

```typescript
// Frame handling
const frame = page.frameLocator('iframe[name="editor"]');
await frame.locator('.editor-content').fill('text');

// Shadow DOM
await page.locator('my-component').locator('>>>.internal-element');
```

### 10. Mobile and Responsive Testing

```typescript
// Emulate mobile device
const context = await browser.newContext({
  ...devices['iPhone 13']
});

// Set viewport
await page.setViewportSize({ width: 375, height: 812 });
```

## Page Object Pattern

```typescript
// login.page.ts
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// login.spec.ts
test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user', 'pass');
  await expect(page).toHaveURL('**/dashboard');
});
```

## Test Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

## Best Practices

1. **Use locators over page.locator/selectors** - Locators are more reliable and auto-wait
2. **Prefer user-facing attributes** - Use text, role, label over CSS/XPath when possible
3. **Avoid arbitrary waits** - Playwright's auto-waiting handles timing
4. **Use test isolation** - Each test should be independent
5. **Handle authentication properly** - Use storageState for authenticated sessions
6. **Take screenshots on failure** - Configure in playwright.config.ts
7. **Use codegen for initial selectors** - `npx playwright codegen`
8. **Group related tests** - Use test.describe() for test suites

## CLI Commands

```bash
# Run tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific file
npx playwright test login.spec.ts

# Run in headed mode
npx playwright test --headed

# Run with trace viewer
npx playwright show-trace trace.zip

# Open codegen
npx playwright codegen

# Check for issues
npx playwright test --project=chromium --grep="critical"
```

## Troubleshooting

**Element not found:**
- Check if element is in shadow DOM or iframe
- Verify selector is correct
- Use `page.pause()` to debug interactively

**Flaky tests:**
- Ensure proper waiting (Playwright auto-waits)
- Check for animations completing
- Verify network requests are mocked/handled

**Slow tests:**
- Run tests in parallel with `workers`
- Use project filtering to run subset
- Check for unnecessary waits
