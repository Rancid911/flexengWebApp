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

    const footerBackground = await page.locator("footer").evaluate((footer) => getComputedStyle(footer).backgroundImage);
    expect(footerBackground).not.toBe("none");
  });

  test("trial lesson landing is public and responsive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/lp/trial-lesson?utm_source=test");

    await expect(page).toHaveURL(/\/lp\/trial-lesson\?utm_source=test$/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Запишитесь на бесплатный вводный урок" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Записаться" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const backgrounds = await page.locator("footer").evaluate((footer) => {
      const footerStyles = getComputedStyle(footer);
      const shellStyles = getComputedStyle(footer.parentElement as HTMLElement);

      return {
        footerBackgroundColor: footerStyles.backgroundColor,
        footerBackgroundImage: footerStyles.backgroundImage,
        footerBorderTopColor: footerStyles.borderTopColor,
        shellBackgroundImage: shellStyles.backgroundImage
      };
    });

    expect(backgrounds.footerBackgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds.footerBackgroundImage).toBe("none");
    expect(backgrounds.footerBorderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds.shellBackgroundImage).not.toBe("none");
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
