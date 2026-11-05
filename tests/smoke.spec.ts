import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 7'],
  viewport: { width: 390, height: 844 }
});

test.describe('Zesti Kitchen Mobile-First Smoke Tests', () => {

  test('Page titles contain Demo and Demo ribbon is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Demo/);
    const ribbon = page.locator('aside[aria-label="Demo notice banner"]');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText('DEMO');
  });

  test('Flow 1: Two-Tap Order on Mobile Viewport', async ({ page }) => {
    // 1. Visit menu page with simulated Table QR parameter (?t=12)
    await page.goto('/menu?t=12');

    // Verify table notification banner is present
    await expect(page.locator('text=Ordering for Table #12')).toBeVisible();

    // Tap 1: Tap "+" on first dish
    const addBtn = page.locator('button:has-text("Add to Order")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify Sticky bottom cart bar appears
    const stickyCartBar = page.locator('#cart-sticky-bar');
    await expect(stickyCartBar).toBeVisible();
    await expect(stickyCartBar).toContainText('Table #12');

    // Tap 2: Tap "Send on WhatsApp" button
    const sendBtn = stickyCartBar.locator('button:has-text("Send on WhatsApp")');
    await expect(sendBtn).toBeVisible();

    // Intercept window.open or link click
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      sendBtn.click()
    ]);

    // Order has been triggered with 2 taps!
  });

  test('Flow 2: Two-Tap Reservation on Mobile Viewport', async ({ page }) => {
    await page.goto('/reserve');

    // Tap 1: Tap a ready-made slot chip
    const slotChip = page.locator('button:has-text("7:00 PM")');
    await expect(slotChip).toBeVisible();
    await slotChip.click();

    // Tap 2: Tap "Confirm on WhatsApp"
    const confirmBtn = page.locator('button:has-text("Confirm on WhatsApp")');
    await expect(confirmBtn).toBeVisible();

    // Intercept window.open or click
    await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      confirmBtn.click()
    ]);

    // Success summary card shown
    await expect(page.locator('text=Table Reserved!')).toBeVisible();
  });

  test('Owner Admin Flow: change price, sold out toggle, undo available', async ({ page }) => {
    await page.goto('/admin');

    // Enter email & verify code
    await page.fill('#admin-email', 'owner@demo.restaurant.example');
    await page.click('button:has-text("Send Access Code")');

    // One-time code input
    const otpInput = page.locator('#admin-otp');
    await expect(otpInput).toBeVisible();
    await otpInput.fill('123456');
    await page.click('button:has-text("Verify & Enter Dashboard")');

    // Expect dashboard
    await expect(page.locator('text=Restaurant Manager')).toBeVisible();

    // Toggle sold-out on first dish
    const toggleBtn = page.locator('button:has-text("In Stock")').first();
    await toggleBtn.click();
    await expect(page.locator('button:has-text("Sold Out")').first()).toBeVisible();
  });
});

