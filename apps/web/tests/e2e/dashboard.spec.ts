import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display main headers and matches section", async ({ page }) => {
    // Check main AppBar title
    await expect(page.locator("text=2026 World Cup Tracker").first()).toBeVisible();

    // Check key dashboard sections
    await expect(page.locator("text=Upcoming & Recent Matches")).toBeVisible();
    await expect(page.locator("text=Top 10 Teams by Elo Rating")).toBeVisible();
    await expect(page.locator("text=Group Standings")).toBeVisible();
  });

  test("should allow navigation to matches page", async ({ page }) => {
    // Click the Matches link in navigation
    const matchesLink = page.locator("text=Matches").first();
    await matchesLink.click();

    // Check URL has updated
    await expect(page).toHaveURL(/\/matches/);
  });
});
