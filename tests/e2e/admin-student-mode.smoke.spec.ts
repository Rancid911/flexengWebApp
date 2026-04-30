import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("admin student mode @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    await login(page, admin.email as string, admin.password as string);
  });

  test("sidebar keeps only staff sections for admin", async ({ page }) => {
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
    const studentsIndex = navLabels.findIndex((label) => label === "Ученики");
    const studentDashboardIndex = navLabels.findIndex((label) => label === "Рабочий стол");
    const practiceIndex = navLabels.findIndex((label) => label === "Практика");
    const paymentsIndex = navLabels.findIndex((label) => label === "Оплата");

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(adminIndex).toBeGreaterThan(dashboardIndex);
    expect(studentsIndex).toBeGreaterThan(adminIndex);
    expect(paymentsIndex).toBeGreaterThan(studentsIndex);
    expect(studentDashboardIndex).toBe(-1);
    expect(practiceIndex).toBe(-1);
    expect(navLabels).not.toEqual(expect.arrayContaining(["Домашнее задание", "Слова"]));
  });

  test("admin opens student card through staff route without student navigation", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Оплата и списания" })).toHaveCount(0);

    await page.getByTestId("dashboard-sidebar").getByRole("link", { name: "Ученики" }).click();
    await expect(page).toHaveURL(/\/admin\/students$/);
    await page.getByRole("searchbox", { name: "Поиск ученика" }).fill("stu");
    await expect(page).toHaveURL(/\/admin\/students\?q=stu$/);
    await page.getByRole("link", { name: "Открыть карточку" }).first().click();

    await expect(page).toHaveURL(/\/admin\/students\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Уроки" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Placement test" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Homework и ошибки" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Оплата и списания" })).toBeVisible();

    const nav = page.getByTestId("dashboard-sidebar").locator("nav").first();
    await expect(nav.getByRole("link", { name: "Дашборд" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Расписание" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Управление" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Ученики" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Оплата" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Рабочий стол" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Практика" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Домашнее задание" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Слова" })).toHaveCount(0);
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
