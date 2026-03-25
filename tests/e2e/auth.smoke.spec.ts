import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("auth @smoke @requiresAuth", () => {
  const student = readAuthEnv("student");

  test("login and logout flow", async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    await login(page, student.email as string, student.password as string);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByTestId("logout-button").click();
    await page.waitForURL(/\/($|login(\?.*)?$)/, { timeout: 20_000 });
  });
});
