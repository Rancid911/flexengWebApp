import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();

  const loginErrorLocator = page.getByText(/Неверные данные для входа|Неверный email или пароль|Неверные учетные данные/i);
  const result = await Promise.race([
    page.waitForURL("**/dashboard", { timeout: 45_000 }).then(() => "ok" as const),
    loginErrorLocator.waitFor({ state: "visible", timeout: 45_000 }).then(() => "error" as const)
  ]);

  if (result === "error") {
    throw new Error("E2E login failed: invalid credentials or auth rejected");
  }
}
