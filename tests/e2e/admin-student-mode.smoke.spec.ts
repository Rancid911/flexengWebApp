import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("admin student mode @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    await login(page, admin.email as string, admin.password as string);
  });

  test("sidebar order keeps admin entry before student sections", async ({ page }) => {
    await page.goto("/dashboard");

    const navLabels = await page
      .getByTestId("dashboard-sidebar")
      .locator("nav")
      .first()
      .getByRole("link")
      .evaluateAll((links) =>
        links
          .map((link) => link.textContent?.replace(/\s+/g, " ").trim() ?? "")
          .filter(Boolean)
      );

    const dashboardIndex = navLabels.findIndex((label) => label === "Дашборд");
    const adminIndex = navLabels.findIndex((label) => label === "Управление");
    const studentDashboardIndex = navLabels.findIndex((label) => label === "Рабочий стол");
    const practiceIndex = navLabels.findIndex((label) => label === "Практика");
    const profileIndex = navLabels.findIndex((label) => label === "Профиль");
    const paymentsIndex = navLabels.findIndex((label) => label === "Оплата");

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(adminIndex).toBe(dashboardIndex + 1);
    expect(studentDashboardIndex).toBe(adminIndex + 1);
    expect(practiceIndex).toBeGreaterThan(adminIndex);
    expect(profileIndex).toBeGreaterThan(practiceIndex);
    expect(paymentsIndex).toBe(profileIndex + 1);
  });

  test("admin can use student routes with regular student UI", async ({ page }) => {
    await page.goto("/student-dashboard");
    await expect(page).toHaveURL(/\/student-dashboard$/);
    await expect(page.getByText("Урок дня")).toBeVisible();

    await page.goto("/practice");
    await expect(page).toHaveURL(/\/practice$/);
    await expect(page.getByRole("heading", { name: "Практика" })).toBeVisible();

    await page.goto("/homework");
    await expect(page).toHaveURL(/\/homework$/);
    await expect(page.getByRole("heading", { name: "Домашнее задание" })).toBeVisible();

    await page.goto("/words/my");
    await expect(page).toHaveURL(/\/words\/my$/);

    await page.goto("/progress/overview");
    await expect(page).toHaveURL(/\/progress\/overview$/);
    await expect(page.getByRole("heading", { name: "Прогресс" })).toBeVisible();

    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(page.getByTestId("settings-save-button")).toBeVisible();
    await expect(page.getByText("История платежей")).toHaveCount(0);

    await page.goto("/settings/payments");
    await expect(page).toHaveURL(/\/settings\/payments$/);
    await expect(page.getByText("История платежей")).toBeVisible();
    await expect(page.getByText("Доступные тарифы")).toBeVisible();
    await expect(page.getByTestId("settings-save-button")).toHaveCount(0);
  });
});
