import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError, fetchJson, slugify } from "@/app/(dashboard)/admin/ui/admin-console.utils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin-console.utils", () => {
  it("slugifies latin text", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
  });

  it("fetchJson throws mapped ApiRequestError on non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          code: "VALIDATION_ERROR",
          details: {
            fieldErrors: {
              phone: ["phone must match +7xxxxxxxxxx"]
            }
          }
        })
      })
    );

    await expect(fetchJson("/api/test")).rejects.toBeInstanceOf(ApiRequestError);
    await expect(fetchJson("/api/test")).rejects.toMatchObject({
      status: 400,
      message: "Телефон должен быть в формате +7 (999) 999 99 99."
    });
  });
});
