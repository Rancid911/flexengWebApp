import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, hasOptionalAuthEnv, readAuthEnv } from "./helpers/guards";

test.describe("notifications @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");
  const student = readAuthEnv("student");
  const teacher = readAuthEnv("teacher");

  test("admin creates assignments notification, student reads and dismisses it", async ({ page, context }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));

    const nonce = Date.now();
    const title = `E2E Assignments ${nonce}`;

    await login(page, admin.email as string, admin.password as string);
    const createStatus = await page.evaluate(async ({ notifTitle }) => {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifTitle,
          body: "Проверьте новые домашние задания.",
          type: "assignments",
          is_active: true,
          target_roles: ["all"],
          published_at: new Date().toISOString(),
          expires_at: null
        })
      });
      return response.status;
    }, { notifTitle: title });
    expect(createStatus).toBe(201);

    await context.clearCookies();
    await page.goto("/login");
    await login(page, student.email as string, student.password as string);
    await page.goto("/dashboard");
    await page.getByTestId("notifications-bell").click();
    await expect(page.getByTestId("notifications-drawer")).toBeVisible();

    const card = page.locator("article").filter({ hasText: title }).first();
    await expect(card).toBeVisible();

    const readResponsePromise = page.waitForResponse((response) => response.url().includes("/api/notifications/") && response.url().endsWith("/read"));
    await card.click();
    const readResponse = await readResponsePromise;
    expect(readResponse.status()).toBe(200);
    await expect(card).toBeVisible();

    const dismissResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/notifications/") && response.url().endsWith("/dismiss")
    );
    await card.locator('[data-testid^="notification-dismiss-"]').first().click();
    const dismissResponse = await dismissResponsePromise;
    expect(dismissResponse.status()).toBe(200);
    await expect(card).toHaveCount(0);

    await page.reload();
    await page.getByTestId("notifications-bell").click();
    await expect(page.locator("article").filter({ hasText: title })).toHaveCount(0);
  });

  test("teacher targeted notification hidden from student and visible for teacher", async ({ page, context }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    test.skip(!hasOptionalAuthEnv("teacher"), "teacher auth env is missing");

    const nonce = Date.now();
    const title = `E2E Teacher only ${nonce}`;

    await login(page, admin.email as string, admin.password as string);

    const status = await page.evaluate(async ({ notifTitle }) => {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: notifTitle,
          body: "Только для преподавателей",
          type: "assignments",
          is_active: true,
          target_roles: ["teacher"],
          published_at: new Date().toISOString(),
          expires_at: null
        })
      });
      return response.status;
    }, { notifTitle: title });
    expect(status).toBe(201);

    await context.clearCookies();
    await page.goto("/login");
    await login(page, student.email as string, student.password as string);
    await page.goto("/dashboard");
    await page.getByTestId("notifications-bell").click();
    await expect(page.locator("article").filter({ hasText: title })).toHaveCount(0);

    await context.clearCookies();
    await page.goto("/login");
    await login(page, teacher.email as string, teacher.password as string);
    await page.goto("/dashboard");
    await page.getByTestId("notifications-bell").click();
    await expect(page.locator("article").filter({ hasText: title })).toHaveCount(1);
  });
});
