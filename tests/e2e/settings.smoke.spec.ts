import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { ensureAuthEnvMessage, readAuthEnv } from "./helpers/guards";

function makeSvgBuffer(width: number, height: number, fill: string) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${fill}" />
    </svg>`
  );
}

test.describe("settings @smoke @requiresAuth", () => {
  const student = readAuthEnv("student");

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(ensureAuthEnvMessage("student")), ensureAuthEnvMessage("student"));
    await login(page, student.email as string, student.password as string);
    await page.goto("/settings");
  });

  test("invalid phone shows field-level validation error", async ({ page }) => {
    await page.locator('[data-testid="settings-phone-input"]:visible').fill("+7 (111)");
    await page.locator('[data-testid="settings-save-button"]:visible').click();
    await expect(page.locator("p.text-xs.text-red-500:visible").filter({ hasText: "Телефон должен быть в формате +7 (999) 999 99 99" })).toBeVisible();
  });

  test("save without changes shows neutral message", async ({ page }) => {
    await page.locator('[data-testid="settings-save-button"]:visible').click();
    await expect(page.locator("p.text-sm.text-emerald-600").filter({ hasText: "Нет изменений" }).first()).toBeVisible();
  });

  test("password confirmation mismatch shows field-level error", async ({ page }) => {
    await page.locator('[data-testid="settings-current-password-input"]:visible').fill(student.password as string);
    await page.locator('[data-testid="settings-next-password-input"]:visible').fill("NewStrongPass123!");
    await page.locator('[data-testid="settings-confirm-password-input"]:visible').fill("NewStrongPass123!_mismatch");
    await page.locator('[data-testid="settings-save-button"]:visible').click();
    await expect(page.locator("p.text-xs.text-red-500:visible").filter({ hasText: /Подтверждение пароля не совпадает/ })).toBeVisible();
  });

  test("avatar crop stays pending until save", async ({ page }) => {
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sA8J7QAAAAASUVORK5CYII=",
      "base64"
    );

    const fileChooser = page.waitForEvent("filechooser");
    await page.locator('[data-testid="settings-avatar-upload"]:visible').click();
    const chooser = await fileChooser;
    await chooser.setFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: pngBuffer
    });

    const cropTitle = page.locator("p.text-sm.font-medium.text-foreground:visible").filter({ hasText: "Подберите позицию аватара" });
    await expect(cropTitle.first()).toBeVisible();
    await page.locator('[data-testid="settings-avatar-apply"]:visible').click();
    await expect(cropTitle).toHaveCount(0);
  });

  test("avatar crop supports portrait and landscape uploads", async ({ page }) => {
    const portraitBuffer = makeSvgBuffer(600, 1000, "#4f46e5");
    const landscapeBuffer = makeSvgBuffer(1000, 600, "#10b981");

    const uploadAndApply = async (name: string, buffer: Buffer) => {
      const fileChooser = page.waitForEvent("filechooser");
      await page.locator('[data-testid="settings-avatar-upload"]:visible').click();
      const chooser = await fileChooser;
      await chooser.setFiles({
        name,
        mimeType: "image/svg+xml",
        buffer
      });

      const cropTitle = page.locator("p.text-sm.font-medium.text-foreground:visible").filter({ hasText: "Подберите позицию аватара" });
      await expect(cropTitle.first()).toBeVisible();
      await page.locator('[data-testid="settings-avatar-apply"]:visible').click();
      await expect(cropTitle).toHaveCount(0);
    };

    await uploadAndApply("portrait-avatar.svg", portraitBuffer);
    await uploadAndApply("landscape-avatar.svg", landscapeBuffer);
  });
});
