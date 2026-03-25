import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("admin users @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    await login(page, admin.email as string, admin.password as string);
    await page.goto("/admin");
  });

  test("role filter applies teacher context and search remains inside role", async ({ page }) => {
    await page.getByTestId("admin-tab-users").click();
    await page.getByTestId("admin-users-role-filter").selectOption("teacher");
    await page.getByPlaceholder("Поиск...").fill("ivan");

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("admin-users-role-filter")).toHaveValue("teacher");
  });
});
