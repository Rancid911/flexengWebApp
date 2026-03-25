import { describe, expect, it } from "vitest";

import { mapUiErrorByCode, mapUiErrorMessage } from "@/lib/ui-error-map";

describe("lib/ui-error-map", () => {
  it("maps common auth errors to russian", () => {
    expect(mapUiErrorMessage("Invalid login credentials")).toBe("Неверные данные для входа.");
    expect(mapUiErrorMessage("Email link is invalid or has expired")).toBe("Ссылка подтверждения недействительна или устарела.");
  });

  it("maps network and validation errors", () => {
    expect(mapUiErrorMessage("Failed to fetch")).toBe("Проблема с сетью. Проверьте подключение и попробуйте снова.");
    expect(mapUiErrorMessage("phone must match +7xxxxxxxxxx")).toBe("Телефон должен быть в формате +7 (999) 999 99 99.");
    expect(mapUiErrorMessage("request failed")).toBe("Не удалось выполнить запрос. Попробуйте снова.");
  });

  it("uses fallback for unmapped english message", () => {
    expect(mapUiErrorMessage("Some unknown backend error", "Что-то пошло не так")).toBe("Что-то пошло не так");
  });

  it("maps by known api codes", () => {
    expect(mapUiErrorByCode("VALIDATION_ERROR")).toBe("Проверьте корректность заполнения полей.");
    expect(mapUiErrorByCode("FORBIDDEN")).toBe("Недостаточно прав для выполнения действия.");
    expect(mapUiErrorByCode("NOTIFICATION_DISMISS_FAILED")).toBe("Не удалось обработать уведомления. Попробуйте снова.");
    expect(mapUiErrorByCode("UNKNOWN", "fallback")).toBe("fallback");
  });
});
