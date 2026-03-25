import { describe, expect, it } from "vitest";

import {
  backspaceRuPhone,
  canRestartRuPhoneFromKey,
  getRuPhoneDigitsCount,
  isValidRuPhone,
  normalizeRuPhoneInput,
  toRuPhoneStorage
} from "@/lib/phone";

describe("lib/phone", () => {
  it("normalizes phone input to RU mask", () => {
    expect(normalizeRuPhoneInput("8 (999) 123-45-67")).toBe("+7 (999) 123 45 67");
    expect(normalizeRuPhoneInput("79991234567")).toBe("+7 (999) 123 45 67");
    expect(normalizeRuPhoneInput("123456789012345")).toBe("+7 (123) 456 78 90");
  });

  it("converts value to canonical storage format", () => {
    expect(toRuPhoneStorage("+7 (999) 123 45 67")).toBe("+79991234567");
    expect(toRuPhoneStorage("+7 (999) 123 45")).toBeNull();
  });

  it("validates ru phone", () => {
    expect(isValidRuPhone("+7 (909) 314 36 08")).toBe(true);
    expect(isValidRuPhone("+7 (909) 314 36")).toBe(false);
  });

  it("counts digits and supports backspace flow", () => {
    expect(getRuPhoneDigitsCount("+7 (999) 123 45 67")).toBe(10);
    expect(backspaceRuPhone("+7 (999) 123 45 67")).toBe("+7 (999) 123 45 6");
    expect(backspaceRuPhone("+7 ")).toBe("+7 ");
  });

  it("knows when to restart from key", () => {
    expect(canRestartRuPhoneFromKey("+7 (999) 123 45 67", "1")).toBe(true);
    expect(canRestartRuPhoneFromKey("+7 (999) 123 45", "1")).toBe(false);
    expect(canRestartRuPhoneFromKey("+7 (999) 123 45 67", "Backspace")).toBe(false);
  });
});
