import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("dashboard shell @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");
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

    const serverHtmlBeforeReload = await page.evaluate(async () => {
      return await fetch(window.location.href, {
        headers: { accept: "text/html" },
        credentials: "include"
      }).then((response) => response.text());
    });
    expect(serverHtmlBeforeReload).toContain('data-testid="dashboard-sidebar"');
    expect(serverHtmlBeforeReload).toContain('data-collapsed="true"');

    await page.reload();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  });

  test("notifications preload unread summary, then load drawer content on bell click", async ({ page }) => {
    const unreadSummaryRequests: string[] = [];
    const notificationRequests: string[] = [];

    await page.route("**/api/notifications/unread-summary", async (route) => {
      unreadSummaryRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unreadCount: 1 })
      });
    });
    await page.route("**/api/notifications", async (route) => {
      notificationRequests.push(route.request().url());
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
    await expect(page.getByTestId("notifications-bell")).toBeVisible();
    await expect.poll(() => unreadSummaryRequests.length).toBeGreaterThan(0);
    await expect(page.getByTestId("notifications-unread-dot")).toBeVisible();
    await expect(page.getByTestId("notifications-drawer")).toHaveCount(0);
    expect(notificationRequests).toHaveLength(0);

    await page.getByTestId("notifications-bell").click();
    await expect(page.getByTestId("notifications-drawer")).toBeVisible();
    await expect.poll(() => notificationRequests.length).toBeGreaterThan(0);
    await expect(page.getByText("Тестовое уведомление")).toBeVisible();
    await page.getByTestId("notification-dismiss-notif-smoke-1").click();
    await expect(page.getByText("Тестовое уведомление")).toHaveCount(0);
  });

  test("search stays idle until trigger interaction and /search page has no header search", async ({ page }) => {
    const searchRequests: string[] = [];

    await page.route("**/api/search**", async (route) => {
      searchRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          groups: []
        })
      });
    });

    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-search-trigger")).toBeVisible();
    expect(searchRequests).toHaveLength(0);

    await page.getByTestId("dashboard-search-trigger").click();
    await page.getByRole("combobox").fill("present simple");
    await expect.poll(() => searchRequests.length).toBeGreaterThan(0);

    await page.goto("/search?q=present%20simple");
    await expect(page.getByRole("heading", { name: /Результаты по запросу/i })).toBeVisible();
    await expect(page.getByTestId("dashboard-search-trigger")).toHaveCount(0);
    await expect(page.getByLabel("Поисковый запрос")).toBeVisible();
  });

  test("student zone preloads unread summary but keeps full notifications lazy", async ({ page }) => {
    const unreadSummaryRequests: string[] = [];
    const notificationRequests: string[] = [];

    await page.route("**/api/notifications/unread-summary", async (route) => {
      unreadSummaryRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unreadCount: 0 })
      });
    });
    await page.route("**/api/notifications", async (route) => {
      notificationRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 })
      });
    });

    await page.goto("/settings/payments");
    await expect(page.getByTestId("notifications-bell")).toHaveCount(1);
    await expect.poll(() => unreadSummaryRequests.length).toBeGreaterThan(0);
    expect(notificationRequests).toHaveLength(0);
  });

  test("staff zone preloads unread summary but keeps search and full notifications lazy", async ({ page, context }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));

    const unreadSummaryRequests: string[] = [];
    const notificationRequests: string[] = [];
    const searchRequests: string[] = [];

    await context.clearCookies();
    await page.goto("/login");
    await login(page, admin.email as string, admin.password as string);

    await page.route("**/api/notifications/unread-summary", async (route) => {
      unreadSummaryRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unreadCount: 0 })
      });
    });
    await page.route("**/api/notifications", async (route) => {
      notificationRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 })
      });
    });
    await page.route("**/api/search**", async (route) => {
      searchRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], groups: [] })
      });
    });

    await page.goto("/admin");
    await expect(page.getByTestId("notifications-bell")).toBeVisible();
    await expect(page.getByTestId("dashboard-search-trigger")).toBeVisible();
    await expect.poll(() => unreadSummaryRequests.length).toBeGreaterThan(0);
    expect(notificationRequests).toHaveLength(0);
    expect(searchRequests).toHaveLength(0);
  });
});
