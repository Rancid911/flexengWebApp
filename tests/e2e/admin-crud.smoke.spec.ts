import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

test.describe("admin crud @smoke @requiresAuth", () => {
  const admin = readAuthEnv("admin");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("admin")), ensureAuthEnvMessage("admin"));
    await login(page, admin.email as string, admin.password as string);
    await page.goto("/admin");
  });

  test("create, edit and delete user", async ({ page }) => {
    const nonce = Date.now();
    const firstName = `E2EUser${nonce}`;
    const updatedFirstName = `E2EUserUpd${nonce}`;
    const lastName = "Manager";
    const email = `e2e.manager.${nonce}@example.com`;

    await page.getByTestId("admin-tab-users").click();
    await page.getByTestId("admin-users-role-filter").selectOption("all");
    const createStatus = await page.evaluate(async ({ newFirstName, newLastName, newEmail }) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "manager",
          first_name: newFirstName,
          last_name: newLastName,
          email: newEmail,
          password: "TestPass123!",
          phone: "+79991234567",
          birth_date: null,
          english_level: null,
          target_level: null,
          learning_goal: null,
          notes: null
        })
      });
      return response.status;
    }, { newFirstName: firstName, newLastName: lastName, newEmail: email });
    expect(createStatus).toBe(201);

    await page.reload();
    await page.getByTestId("admin-tab-users").click();
    await page.getByPlaceholder("Поиск...").fill(email);
    const userEmail = page.getByText(email).first();
    await expect(userEmail).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Изменить" }).first().click();
    await page.getByTestId("admin-user-first-name-input").fill(updatedFirstName);
    await page.getByTestId("admin-user-submit").click();
    await expect(page.getByText(`${updatedFirstName} ${lastName}`)).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Удалить" }).first().click();
    await expect(page.getByText(`${updatedFirstName} ${lastName}`)).toHaveCount(0);
  });

  test("create, edit and delete blog article", async ({ page }) => {
    const nonce = Date.now();
    const title = `E2E Article ${nonce}`;
    const updatedTitle = `E2E Article Updated ${nonce}`;

    await page.getByRole("button", { name: "Блог" }).click();
    await page.getByPlaceholder("Поиск...").fill("");
    await page.getByTestId("admin-create-blog").click();

    await page.getByTestId("admin-blog-title-input").fill(title);
    await page.getByTestId("admin-blog-content-input").fill("Тестовая статья для smoke-проверки.");
    await page.getByTestId("admin-blog-status-select").selectOption("published");
    await page.getByTestId("admin-blog-submit").click();

    await page.getByPlaceholder("Поиск...").fill(String(nonce));
    const blogTitle = page.getByText(title).first();
    await expect(blogTitle).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Изменить" }).first().click();
    await page.getByTestId("admin-blog-title-input").fill(updatedTitle);
    await page.getByTestId("admin-blog-submit").click();
    await expect(page.getByText(updatedTitle)).toBeVisible();

    await page.goto("/articles");
    await expect(page.getByText(updatedTitle)).toBeVisible();

    await page.goto("/admin");
    await page.getByRole("button", { name: "Блог" }).click();
    await page.getByPlaceholder("Поиск...").fill(String(nonce));
    await expect(page.getByText(updatedTitle).first()).toBeVisible({ timeout: 15000 });
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Удалить" }).first().click();
    await expect(page.getByText(updatedTitle)).toHaveCount(0);
  });
});
