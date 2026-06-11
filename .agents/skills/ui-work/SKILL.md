---
name: ui-work
description: Use when building, modifying, or testing UI components, layouts, or pages. Guides through visual design guidelines, setting up and writing Playwright E2E tests, running the tests, and validating using Playwright MCP or Chrome DevTools MCP.
---

# UI Work & E2E Test Validation Skill

This skill guides the AI agent through modifying or adding user interfaces, ensuring that all UI changes are accompanied by robust Playwright End-to-End (E2E) tests, and providing protocols to validate them locally using the Playwright CLI, Playwright MCP, and Chrome DevTools MCP.

---

## 1. Design & Aesthetic Guidelines
All UI work must match the project's premium aesthetics:
- **Material UI (MUI):** All styling must use the MUI custom theme. No Tailwind CSS. Use MUI layout components (e.g., [Grid](https://mui.com/material-ui/react-grid/), [Stack](https://mui.com/material-ui/react-stack/), [Container](https://mui.com/material-ui/react-container/), [Box](https://mui.com/material-ui/react-box/)) with responsive configuration.
- **Aesthetic Excellence:** Use sleek dark mode, vibrant/harmonious colors, clean typography (e.g. Inter/Outfit), subtle gradients, and smooth transitions (using MUI's `Fade`, `Collapse`, `Grow`).
- **Mobile First:** Ensure responsive design that works seamlessly on both mobile (375x812) and desktop (1440x900) viewports.

---

## 2. Playwright E2E Setup Protocol
If Playwright is not yet set up in the frontend app ([apps/web](file:///Users/rony/dev/worldcupPredictor/apps/web)):
1. Install Playwright test runner in the web application:
   ```bash
   pnpm --filter @worldcup/web add -D @playwright/test
   ```
2. Run Playwright installation script to download required browsers:
   ```bash
   pnpm --filter @worldcup/web exec playwright install chromium
   ```
3. Create a standard `playwright.config.ts` in [apps/web/playwright.config.ts](file:///Users/rony/dev/worldcupPredictor/apps/web/playwright.config.ts) if it does not exist:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './tests/e2e',
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
     ],
     webServer: {
       command: 'pnpm dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120 * 1000,
     },
   });
   ```

---

## 3. E2E Test Creation Requirements
For every UI task (creating a component, modifying a page, adding a route):
- Create a corresponding test file in `apps/web/tests/e2e/<feature>.spec.ts`.
- Avoid simple rendering checks; test user interactions, responsiveness, and happy/edge path flows.
- **Example Test Structure:**
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should display main headers and allow prediction interaction', async ({ page }) => {
      // 1. Verify primary UI layout elements
      await expect(page.locator('h1')).toContainText('2026 World Cup Predictor');

      // 2. Perform user interactions
      const predictButton = page.locator('button:has-text("Predict")').first();
      await expect(predictButton).toBeVisible();
      await predictButton.click();

      // 3. Verify changes/modal responses
      await expect(page.locator('text=Prediction Details')).toBeVisible();
    });
  });
  ```

---

## 4. Test Validation & MCP Verification Protocol
Once UI work and E2E tests are implemented:
1. **Start the local dev environment:**
   Use the terminal or background runner to start the server:
   ```bash
   pnpm --filter @worldcup/web dev
   ```
2. **Run Playwright E2E Tests:**
   Run the tests via the terminal to ensure they pass:
   ```bash
   pnpm --filter @worldcup/web exec playwright test
   ```
3. **Visual & Console Inspection via MCP:**
   Validate correctness and look for UI regressions or browser errors by calling Playwright MCP or Chrome DevTools MCP tools:
   - **Playwright MCP:**
     - Navigate: Use `mcp__playwright__navigate` (or `call_mcp_tool` for `chrome-devtools-mcp`'s navigate tools) to go to `http://localhost:3000`.
     - Capture Screenshots: Capture mobile and desktop viewports using the screenshot tool to manually verify pixel-perfect visuals.
     - Inspect console: Check for unhandled exceptions or console errors.
   - **Chrome DevTools MCP:**
     - Access `list_pages` or `new_page`.
     - Navigate page to `http://localhost:3000`.
     - Use `take_screenshot` to verify the rendering.
     - Use `list_console_messages` to ensure no javascript errors were thrown.
