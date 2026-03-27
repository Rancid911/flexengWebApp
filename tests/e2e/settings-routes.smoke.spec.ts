import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("settings route split @smoke @requiresAuth", () => {
  const student = readAuthEnv("student");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    await login(page, student.email as string, student.password as string);
  });

  test("profile and payments are separated into different routes", async ({ page }) => {
    await page.goto("/settings/profile");

    await expect(page.getByText("Профиль").first()).toBeVisible();
    await expect(page.getByTestId("settings-save-button")).toBeVisible();
    await expect(page.getByText("История платежей")).toHaveCount(0);

    await page.getByTestId("dashboard-sidebar").getByRole("link", { name: "Оплата" }).click();
    await expect(page).toHaveURL(/\/settings\/payments/);
    await expect(page.getByText("История платежей")).toBeVisible();
    await expect(page.getByText("Доступные тарифы")).toBeVisible();
    await expect(page.getByTestId("settings-save-button")).toHaveCount(0);

    await page.getByTestId("dashboard-sidebar").getByRole("link", { name: "Профиль" }).click();
    await expect(page).toHaveURL(/\/settings\/profile/);
    await expect(page.getByTestId("settings-save-button")).toBeVisible();
    await expect(page.getByText("История платежей")).toHaveCount(0);
  });
});
