import { expect, test } from "@playwright/test";

test.describe("public ui @smoke-ui", () => {
  test("login page renders key controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-email")).toBeVisible();
    await expect(page.getByTestId("login-password")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();
  });

  test("public landing is available", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("public landing exposes skip link for keyboard navigation", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Перейти к основному содержимому" });
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#main-content$/);
  });

  test("public site search opens without login redirect", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ресурсы" }).click();
    await page.getByRole("link", { name: "Поиск по сайту" }).click();

    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole("heading", { name: "Введите запрос для поиска по сайту" })).toBeVisible();

    await page.getByLabel("Поисковый запрос").fill("english");
    await page.getByRole("button", { name: "Найти" }).click();

    await expect(page).toHaveURL(/\/search\?q=english$/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
