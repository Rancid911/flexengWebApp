import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, hasOptionalAuthEnv, readAuthEnv } from "./helpers/guards";

test.describe("auth access @smoke @requiresAuth", () => {
  const student = readAuthEnv("student");
  const admin = readAuthEnv("admin");
  const teacher = readAuthEnv("teacher");
  const manager = readAuthEnv("manager");

  test("invalid credentials show russian message", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("wrong-user@example.com");
    await page.getByTestId("login-password").fill("wrong-password");
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Неверные данные для входа.")).toBeVisible();
  });

  test("student cannot access /admin and admin API", async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    await login(page, student.email as string, student.password as string);

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);

    const status = await page.evaluate(async () => {
      const response = await fetch("/api/admin/users?page=1&pageSize=1", { credentials: "include" });
      return response.status;
    });
    expect(status).toBe(403);
  });

  test("dashboard role split: student and admin", async ({ page, context }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));

    await login(page, student.email as string, student.password as string);
    await page.goto("/dashboard");
    await expect(page.getByText("Дашборд")).toHaveCount(0);

    await context.clearCookies();
    await page.goto("/login");

    await login(page, admin.email as string, admin.password as string);
    await page.goto("/dashboard");
    await expect(page.getByText("онлайн-школа английского языка")).toBeVisible();

    await page.goto("/student-dashboard");
    await expect(page.getByText("Урок дня")).toBeVisible();
  });

  test("dashboard role split: teacher placeholder", async ({ page }) => {
    test.skip(!hasOptionalAuthEnv("teacher"), "teacher auth env is missing");
    await login(page, teacher.email as string, teacher.password as string);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Дашборд" })).toBeVisible();
  });

  test("dashboard role split: manager placeholder", async ({ page }) => {
    test.skip(!hasOptionalAuthEnv("manager"), "manager auth env is missing");
    await login(page, manager.email as string, manager.password as string);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Дашборд" })).toBeVisible();
  });
});
