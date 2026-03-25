import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("dashboard shell @smoke @requiresAuth", () => {
  const student = readAuthEnv("student");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    await login(page, student.email as string, student.password as string);
  });

  test("sidebar collapsed state persists after reload", async ({ page }) => {
    const toggle = page.getByTestId("sidebar-toggle");
    const sidebar = page.getByTestId("dashboard-sidebar");

    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");

    await page.reload();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  });

  test("notification bell shows unread dot only when unread count > 0", async ({ page }) => {
    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 3 })
      });
    });

    await page.reload();
    await expect(page.getByTestId("notifications-unread-dot")).toBeVisible();
  });

  test("notification bell hides dot when unread count is zero", async ({ page }) => {
    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 })
      });
    });

    await page.reload();
    await expect(page.getByTestId("notifications-unread-dot")).toHaveCount(0);
  });

  test("notifications drawer opens and dismiss hides a card", async ({ page }) => {
    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "notif-smoke-1",
              title: "Тестовое уведомление",
              body: "Проверка drawer",
              type: "update",
              is_read: false,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          unreadCount: 1
        })
      });
    });
    await page.route("**/api/notifications/notif-smoke-1/dismiss", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.reload();
    await page.getByTestId("notifications-bell").click();
    await expect(page.getByTestId("notifications-drawer")).toBeVisible();
    await expect(page.getByText("Тестовое уведомление")).toBeVisible();
    await page.getByTestId("notification-dismiss-notif-smoke-1").click();
    await expect(page.getByText("Тестовое уведомление")).toHaveCount(0);
  });
});
